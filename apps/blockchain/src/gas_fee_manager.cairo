use starknet::{ContractAddress, get_block_timestamp, get_caller_address, get_tx_info};
use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};
use crate::payment_models::GasFeeRecord;

#[starknet::interface]
pub trait IGasFeeManager<TContractState> {
    fn set_base_gas_fee(ref self: TContractState, fee: u256);
    fn get_base_gas_fee(self: @TContractState) -> u256;
    
    fn calculate_gas_fee(self: @TContractState, operation_type: felt252, data_size: u32) -> u256;
    fn estimate_transaction_cost(self: @TContractState, operation_type: felt252, complexity: u32) -> u256;
    
    fn pay_gas_fee(ref self: TContractState, operation_type: felt252, amount: u256) -> bool;
    fn batch_pay_gas_fees(ref self: TContractState, operations: Array<felt252>, amounts: Array<u256>) -> bool;
    
    fn get_gas_fee_record(self: @TContractState, tx_hash: felt252) -> GasFeeRecord;
    fn get_user_gas_spending(self: @TContractState, user: ContractAddress, from_time: u64, to_time: u64) -> u256;
    fn get_total_gas_collected(self: @TContractState) -> u256;
    
    fn set_fee_discount(ref self: TContractState, user: ContractAddress, discount_percent: u8);
    fn get_fee_discount(self: @TContractState, user: ContractAddress) -> u8;
    
    fn withdraw_gas_fees(ref self: TContractState, amount: u256, recipient: ContractAddress) -> bool;
    
    // Admin functions
    fn set_admin(ref self: TContractState, admin: ContractAddress);
    fn get_admin(self: @TContractState) -> ContractAddress;
    fn pause_gas_collection(ref self: TContractState);
    fn resume_gas_collection(ref self: TContractState);
    fn is_gas_collection_paused(self: @TContractState) -> bool;
}

#[starknet::contract]
pub mod GasFeeManager {
    use super::*;
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess
    };

    #[storage]
    struct Storage {
        admin: ContractAddress,
        base_gas_fee: u256,
        total_gas_collected: u256,
        is_paused: bool,
        
        // Gas fee records
        gas_records: Map<felt252, GasFeeRecord>, // tx_hash -> record
        user_gas_spending: Map<ContractAddress, u256>,
        user_gas_count: Map<ContractAddress, u32>, // simplified tracking
        
        // Fee discounts and multipliers
        user_discounts: Map<ContractAddress, u8>, // percentage discount (0-100)
        operation_multipliers: Map<felt252, u256>, // operation_type -> multiplier (basis points)
        
        // Gas optimization settings
        min_gas_fee: u256,
        max_gas_fee: u256,
        fee_adjustment_factor: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        GasFeePaid: GasFeePaid,
        BatchGasFeesPaid: BatchGasFeesPaid,
        GasFeeWithdrawn: GasFeeWithdrawn,
        BaseGasFeeUpdated: BaseGasFeeUpdated,
        FeeDiscountSet: FeeDiscountSet,
        GasCollectionPaused: GasCollectionPaused,
        GasCollectionResumed: GasCollectionResumed,
        OperationMultiplierSet: OperationMultiplierSet,
    }

    #[derive(Drop, starknet::Event)]
    pub struct GasFeePaid {
        pub payer: ContractAddress,
        pub tx_hash: felt252,
        pub operation_type: felt252,
        pub amount: u256,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct BatchGasFeesPaid {
        pub payer: ContractAddress,
        pub total_amount: u256,
        pub operations_count: u32,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct GasFeeWithdrawn {
        pub admin: ContractAddress,
        pub recipient: ContractAddress,
        pub amount: u256,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct BaseGasFeeUpdated {
        pub old_fee: u256,
        pub new_fee: u256,
        pub updated_by: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct FeeDiscountSet {
        pub user: ContractAddress,
        pub discount_percent: u8,
        pub set_by: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct GasCollectionPaused {
        pub paused_by: ContractAddress,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct GasCollectionResumed {
        pub resumed_by: ContractAddress,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct OperationMultiplierSet {
        pub operation_type: felt252,
        pub multiplier: u256,
        pub set_by: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState, admin: ContractAddress, base_gas_fee: u256) {
        self.admin.write(admin);
        self.base_gas_fee.write(base_gas_fee);
        self.min_gas_fee.write(1000_u256); // 0.001 STRK minimum
        self.max_gas_fee.write(1000000000000000000_u256); // 1 STRK maximum
        self.fee_adjustment_factor.write(10000_u256); // 100% in basis points
        self.is_paused.write(false);
    }

    #[abi(embed_v0)]
    impl GasFeeManagerImpl of super::IGasFeeManager<ContractState> {
        fn set_base_gas_fee(ref self: ContractState, fee: u256) {
            self._only_admin();
            let old_fee = self.base_gas_fee.read();
            self.base_gas_fee.write(fee);
            
            self.emit(Event::BaseGasFeeUpdated(BaseGasFeeUpdated {
                old_fee,
                new_fee: fee,
                updated_by: get_caller_address(),
            }));
        }

        fn get_base_gas_fee(self: @ContractState) -> u256 {
            self.base_gas_fee.read()
        }

        fn calculate_gas_fee(self: @ContractState, operation_type: felt252, data_size: u32) -> u256 {
            let base_fee = self.base_gas_fee.read();
            let multiplier = self.operation_multipliers.read(operation_type);
            
            // Default multiplier if not set
            let effective_multiplier = if multiplier == 0 { 10000_u256 } else { multiplier };
            
            // Calculate base cost
            let mut fee = (base_fee * effective_multiplier) / 10000_u256;
            
            // Add data size cost (1 wei per byte)
            fee += data_size.into();
            
            // Apply bounds
            let min_fee = self.min_gas_fee.read();
            let max_fee = self.max_gas_fee.read();
            
            if fee < min_fee {
                fee = min_fee;
            } else if fee > max_fee {
                fee = max_fee;
            }
            
            fee
        }

        fn estimate_transaction_cost(self: @ContractState, operation_type: felt252, complexity: u32) -> u256 {
            let base_cost = self.calculate_gas_fee(operation_type, complexity);
            
            // Add network congestion factor (simplified)
            let congestion_multiplier = 11000_u256; // 110% during normal times
            (base_cost * congestion_multiplier) / 10000_u256
        }

        fn pay_gas_fee(ref self: ContractState, operation_type: felt252, amount: u256) -> bool {
            assert(!self.is_paused.read(), 'Gas collection paused');
            
            let payer = get_caller_address();
            let tx_info = get_tx_info().unbox();
            let tx_hash = tx_info.transaction_hash;
            let timestamp = get_block_timestamp();
            
            // Create gas fee record
            let record = GasFeeRecord {
                transaction_hash: tx_hash,
                payer,
                amount,
                timestamp,
                operation_type,
            };
            
            // Store record
            self.gas_records.write(tx_hash, record);
            
            // Update user spending
            let current_spending = self.user_gas_spending.read(payer);
            self.user_gas_spending.write(payer, current_spending + amount);
            
            // Update total collected
            let total = self.total_gas_collected.read();
            self.total_gas_collected.write(total + amount);
            
            // Update user transaction count
            let count = self.user_gas_count.read(payer);
            self.user_gas_count.write(payer, count + 1);
            
            self.emit(Event::GasFeePaid(GasFeePaid {
                payer,
                tx_hash,
                operation_type,
                amount,
                timestamp,
            }));
            
            true
        }

        fn batch_pay_gas_fees(ref self: ContractState, operations: Array<felt252>, amounts: Array<u256>) -> bool {
            assert(!self.is_paused.read(), 'Gas collection paused');
            assert(operations.len() == amounts.len(), 'Arrays length mismatch');
            
            let payer = get_caller_address();
            let timestamp = get_block_timestamp();
            let mut total_amount = 0_u256;
            let mut i = 0_u32;
            
            while i < operations.len() {
                let operation = *operations.at(i);
                let amount = *amounts.at(i);
                total_amount += amount;
                
                // Process individual gas fee
                self.pay_gas_fee(operation, amount);
                i += 1;
            };
            
            self.emit(Event::BatchGasFeesPaid(BatchGasFeesPaid {
                payer,
                total_amount,
                operations_count: operations.len(),
                timestamp,
            }));
            
            true
        }

        fn get_gas_fee_record(self: @ContractState, tx_hash: felt252) -> GasFeeRecord {
            self.gas_records.read(tx_hash)
        }

        fn get_user_gas_spending(self: @ContractState, user: ContractAddress, from_time: u64, to_time: u64) -> u256 {
            // Simplified implementation - returns total spending
            // In a full implementation, this would filter by time range
            self.user_gas_spending.read(user)
        }

        fn get_total_gas_collected(self: @ContractState) -> u256 {
            self.total_gas_collected.read()
        }

        fn set_fee_discount(ref self: ContractState, user: ContractAddress, discount_percent: u8) {
            self._only_admin();
            assert(discount_percent <= 100, 'Invalid discount');
            
            self.user_discounts.write(user, discount_percent);
            
            self.emit(Event::FeeDiscountSet(FeeDiscountSet {
                user,
                discount_percent,
                set_by: get_caller_address(),
            }));
        }

        fn get_fee_discount(self: @ContractState, user: ContractAddress) -> u8 {
            self.user_discounts.read(user)
        }

        fn withdraw_gas_fees(ref self: ContractState, amount: u256, recipient: ContractAddress) -> bool {
            self._only_admin();
            
            let total_collected = self.total_gas_collected.read();
            assert(amount <= total_collected, 'Insufficient funds');
            
            self.total_gas_collected.write(total_collected - amount);
            
            self.emit(Event::GasFeeWithdrawn(GasFeeWithdrawn {
                admin: get_caller_address(),
                recipient,
                amount,
                timestamp: get_block_timestamp(),
            }));
            
            true
        }

        fn set_admin(ref self: ContractState, admin: ContractAddress) {
            self._only_admin();
            self.admin.write(admin);
        }

        fn get_admin(self: @ContractState) -> ContractAddress {
            self.admin.read()
        }

        fn pause_gas_collection(ref self: ContractState) {
            self._only_admin();
            self.is_paused.write(true);
            
            self.emit(Event::GasCollectionPaused(GasCollectionPaused {
                paused_by: get_caller_address(),
                timestamp: get_block_timestamp(),
            }));
        }

        fn resume_gas_collection(ref self: ContractState) {
            self._only_admin();
            self.is_paused.write(false);
            
            self.emit(Event::GasCollectionResumed(GasCollectionResumed {
                resumed_by: get_caller_address(),
                timestamp: get_block_timestamp(),
            }));
        }

        fn is_gas_collection_paused(self: @ContractState) -> bool {
            self.is_paused.read()
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