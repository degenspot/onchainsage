use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};

#[starknet::interface]
pub trait IPaymentExpiration<TContractState> {
    fn set_payment_expiration(ref self: TContractState, payment_id: u256, expiration_time: u64) -> bool;
    fn update_payment_expiration(ref self: TContractState, payment_id: u256, new_expiration: u64) -> bool;
    fn check_payment_expiration(ref self: TContractState, payment_id: u256) -> bool;
    fn get_payment_expiration(self: @TContractState, payment_id: u256) -> u64;
    fn is_payment_expired(self: @TContractState, payment_id: u256) -> bool;
    
    fn get_expired_payments(self: @TContractState, limit: u32, offset: u32) -> Array<u256>;
    fn process_expired_payments(ref self: TContractState, limit: u32) -> u32;
    fn bulk_expire_payments(ref self: TContractState, payment_ids: Array<u256>) -> u32;
    
    fn set_default_expiration_window(ref self: TContractState, seconds: u64);
    fn get_default_expiration_window(self: @TContractState) -> u64;
    
    fn set_admin(ref self: TContractState, admin: ContractAddress);
    fn get_admin(self: @TContractState) -> ContractAddress;
}

#[starknet::contract]
pub mod PaymentExpiration {
    use super::*;
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess
    };

    #[storage]
    struct Storage {
        admin: ContractAddress,
        default_expiration_window: u64,
        
        // Payment expiration tracking
        payment_expirations: Map<u256, u64>, // payment_id -> expiration_time
        payment_expired: Map<u256, bool>, // payment_id -> is_expired
        
        // Simplified tracking
        total_expired_payments: u32,
        last_cleanup_time: u64,
        
        // Configuration
        auto_cleanup_enabled: bool,
        cleanup_batch_size: u32,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        PaymentExpirationSet: PaymentExpirationSet,
        PaymentExpirationUpdated: PaymentExpirationUpdated,
        PaymentExpired: PaymentExpired,
        BulkPaymentsExpired: BulkPaymentsExpired,
        ExpirationWindowUpdated: ExpirationWindowUpdated,
        CleanupCompleted: CleanupCompleted,
    }

    #[derive(Drop, starknet::Event)]
    pub struct PaymentExpirationSet {
        pub payment_id: u256,
        pub expiration_time: u64,
        pub set_by: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct PaymentExpirationUpdated {
        pub payment_id: u256,
        pub old_expiration: u64,
        pub new_expiration: u64,
        pub updated_by: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct PaymentExpired {
        pub payment_id: u256,
        pub expired_at: u64,
        pub expiration_time: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct BulkPaymentsExpired {
        pub count: u32,
        pub processed_by: ContractAddress,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ExpirationWindowUpdated {
        pub old_window: u64,
        pub new_window: u64,
        pub updated_by: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct CleanupCompleted {
        pub payments_processed: u32,
        pub timestamp: u64,
    }

    #[constructor]
    fn constructor(ref self: ContractState, admin: ContractAddress) {
        self.admin.write(admin);
        self.default_expiration_window.write(3600_u64); // 1 hour default
        self.auto_cleanup_enabled.write(true);
        self.cleanup_batch_size.write(100);
        self.last_cleanup_time.write(get_block_timestamp());
    }

    #[abi(embed_v0)]
    impl PaymentExpirationImpl of super::IPaymentExpiration<ContractState> {
        fn set_payment_expiration(ref self: ContractState, payment_id: u256, expiration_time: u64) -> bool {
            let current_time = get_block_timestamp();
            assert(expiration_time > current_time, 'Expiration in past');
            
            self.payment_expirations.write(payment_id, expiration_time);
            
            self.emit(Event::PaymentExpirationSet(PaymentExpirationSet {
                payment_id,
                expiration_time,
                set_by: get_caller_address(),
            }));
            
            true
        }

        fn update_payment_expiration(ref self: ContractState, payment_id: u256, new_expiration: u64) -> bool {
            let old_expiration = self.payment_expirations.read(payment_id);
            assert(old_expiration != 0, 'Payment not found');
            
            let current_time = get_block_timestamp();
            assert(new_expiration > current_time, 'Expiration in past');
            
            self.payment_expirations.write(payment_id, new_expiration);
            
            self.emit(Event::PaymentExpirationUpdated(PaymentExpirationUpdated {
                payment_id,
                old_expiration,
                new_expiration,
                updated_by: get_caller_address(),
            }));
            
            true
        }

        fn check_payment_expiration(ref self: ContractState, payment_id: u256) -> bool {
            let expiration_time = self.payment_expirations.read(payment_id);
            if expiration_time == 0 {
                return false; // No expiration set
            }
            
            let current_time = get_block_timestamp();
            if current_time >= expiration_time && !self.payment_expired.read(payment_id) {
                // Mark as expired
                self.payment_expired.write(payment_id, true);
                
                // Update counter
                let total = self.total_expired_payments.read();
                self.total_expired_payments.write(total + 1);
                
                self.emit(Event::PaymentExpired(PaymentExpired {
                    payment_id,
                    expired_at: current_time,
                    expiration_time,
                }));
                
                true
            } else {
                false
            }
        }

        fn get_payment_expiration(self: @ContractState, payment_id: u256) -> u64 {
            self.payment_expirations.read(payment_id)
        }

        fn is_payment_expired(self: @ContractState, payment_id: u256) -> bool {
            let expiration_time = self.payment_expirations.read(payment_id);
            if expiration_time == 0 {
                return false;
            }
            
            let current_time = get_block_timestamp();
            current_time >= expiration_time
        }

        fn get_expired_payments(self: @ContractState, limit: u32, offset: u32) -> Array<u256> {
            // Simplified implementation
            // In practice, this would iterate through stored expired payments
            let mut result: Array<u256> = ArrayTrait::new();
            result
        }

        fn process_expired_payments(ref self: ContractState, limit: u32) -> u32 {
            let mut processed = 0_u32;
            let current_time = get_block_timestamp();
            self.emit(Event::CleanupCompleted(CleanupCompleted {
                payments_processed: processed,
                timestamp: current_time,
            }));
            
            processed
        }

        fn bulk_expire_payments(ref self: ContractState, payment_ids: Array<u256>) -> u32 {
            let mut expired_count = 0_u32;
            let mut i = 0_u32;
            
            while i < payment_ids.len() {
                let payment_id = *payment_ids.at(i);
                if self.check_payment_expiration(payment_id) {
                    expired_count += 1;
                }
                i += 1;
            };
            
            self.emit(Event::BulkPaymentsExpired(BulkPaymentsExpired {
                count: expired_count,
                processed_by: get_caller_address(),
                timestamp: get_block_timestamp(),
            }));
            
            expired_count
        }

        fn set_default_expiration_window(ref self: ContractState, seconds: u64) {
            self._only_admin();
            assert(seconds > 0, 'Invalid time');
            
            let old_window = self.default_expiration_window.read();
            self.default_expiration_window.write(seconds);
            
            self.emit(Event::ExpirationWindowUpdated(ExpirationWindowUpdated {
                old_window,
                new_window: seconds,
                updated_by: get_caller_address(),
            }));
        }

        fn get_default_expiration_window(self: @ContractState) -> u64 {
            self.default_expiration_window.read()
        }

        fn set_admin(ref self: ContractState, admin: ContractAddress) {
            self._only_admin();
            self.admin.write(admin);
        }

        fn get_admin(self: @ContractState) -> ContractAddress {
            self.admin.read()
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _only_admin(self: @ContractState) {
            let caller = get_caller_address();
            let admin = self.admin.read();
            assert(caller == admin, 'Only admin');
        }
    }
} 