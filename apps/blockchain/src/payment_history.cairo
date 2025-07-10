use starknet::{ContractAddress, get_caller_address};
use starknet::storage::{
    Map, StorageMapReadAccess, StorageMapWriteAccess,
    StoragePointerReadAccess, StoragePointerWriteAccess
};
use crate::payment_models::{Payment, PaymentStatus, PaymentType};

#[starknet::interface]
pub trait IPaymentHistory<TContractState> {
    fn record_payment(ref self: TContractState, payment: Payment);
    fn update_payment_status(ref self: TContractState, payment_id: u256, new_status: PaymentStatus);
    
    fn get_user_payments(self: @TContractState, user: ContractAddress, limit: u32, offset: u32) -> Array<Payment>;
    fn get_payments_by_status(self: @TContractState, status: PaymentStatus, limit: u32, offset: u32) -> Array<Payment>;
    fn get_payments_by_type(self: @TContractState, payment_type: PaymentType, limit: u32, offset: u32) -> Array<Payment>;
    fn get_recent_payments(self: @TContractState, limit: u32, offset: u32) -> Array<Payment>;
    
    fn get_user_payment_stats(self: @TContractState, user: ContractAddress) -> (u32, u256); // count, total_amount
    fn get_payment_volume_by_period(self: @TContractState, from_time: u64, to_time: u64) -> u256;
    
    fn set_admin(ref self: TContractState, admin: ContractAddress);
    fn get_admin(self: @TContractState) -> ContractAddress;
}

#[starknet::contract]
pub mod PaymentHistory {
    use super::*;

    #[storage]
    struct Storage {
        admin: ContractAddress,
        
        // Payment storage
        payments: Map<u256, Payment>,
        payment_exists: Map<u256, bool>,
        
        // User tracking (simplified)
        user_payment_count: Map<ContractAddress, u32>,
        user_total_amount: Map<ContractAddress, u256>,
        
        // Time-based tracking
        daily_volume: Map<u64, u256>, // day_timestamp -> volume
        daily_count: Map<u64, u32>, // day_timestamp -> count
        
        // System statistics
        total_payments_recorded: u32,
        total_volume_recorded: u256,
        last_payment_id: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        PaymentRecorded: PaymentRecorded,
        PaymentStatusUpdated: PaymentStatusUpdated,
        PaymentHistoryQueried: PaymentHistoryQueried,
    }

    #[derive(Drop, starknet::Event)]
    pub struct PaymentRecorded {
        pub payment_id: u256,
        pub payer: ContractAddress,
        pub recipient: ContractAddress,
        pub amount: u256,
        pub payment_type: PaymentType,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct PaymentStatusUpdated {
        pub payment_id: u256,
        pub old_status: PaymentStatus,
        pub new_status: PaymentStatus,
        pub updated_by: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct PaymentHistoryQueried {
        pub query_type: felt252,
        pub result_count: u32,
        pub queried_by: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState, admin: ContractAddress) {
        self.admin.write(admin);
        self.total_payments_recorded.write(0);
        self.total_volume_recorded.write(0);
        self.last_payment_id.write(0);
    }

    #[abi(embed_v0)]
    impl PaymentHistoryImpl of super::IPaymentHistory<ContractState> {
        fn record_payment(ref self: ContractState, payment: Payment) {
            // Store payment
            self.payments.write(payment.id, payment);
            self.payment_exists.write(payment.id, true);
            
            // Update user statistics
            let payer_count = self.user_payment_count.read(payment.payer);
            let payer_total = self.user_total_amount.read(payment.payer);
            self.user_payment_count.write(payment.payer, payer_count + 1);
            self.user_total_amount.write(payment.payer, payer_total + payment.amount);
            
            // Update recipient statistics if different
            if payment.payer != payment.recipient {
                let recipient_count = self.user_payment_count.read(payment.recipient);
                self.user_payment_count.write(payment.recipient, recipient_count + 1);
            }
            
            // Update daily statistics
            let day_timestamp = (payment.timestamp / 86400) * 86400; // Round to day
            let daily_vol = self.daily_volume.read(day_timestamp);
            let daily_cnt = self.daily_count.read(day_timestamp);
            self.daily_volume.write(day_timestamp, daily_vol + payment.amount);
            self.daily_count.write(day_timestamp, daily_cnt + 1);
            
            // Update system totals
            let total_recorded = self.total_payments_recorded.read();
            let total_volume = self.total_volume_recorded.read();
            self.total_payments_recorded.write(total_recorded + 1);
            self.total_volume_recorded.write(total_volume + payment.amount);
            self.last_payment_id.write(payment.id);
            
            self.emit(Event::PaymentRecorded(PaymentRecorded {
                payment_id: payment.id,
                payer: payment.payer,
                recipient: payment.recipient,
                amount: payment.amount,
                payment_type: payment.payment_type,
                timestamp: payment.timestamp,
            }));
        }

        fn update_payment_status(ref self: ContractState, payment_id: u256, new_status: PaymentStatus) {
            assert(self.payment_exists.read(payment_id), 'Payment not found');
            
            let mut payment = self.payments.read(payment_id);
            let old_status = payment.status;
            
            // Update payment
            payment.status = new_status;
            self.payments.write(payment_id, payment);
            
            self.emit(Event::PaymentStatusUpdated(PaymentStatusUpdated {
                payment_id,
                old_status,
                new_status,
                updated_by: get_caller_address(),
            }));
        }

        fn get_user_payments(self: @ContractState, user: ContractAddress, limit: u32, offset: u32) -> Array<Payment> {
            let mut result: Array<Payment> = ArrayTrait::new();
            let mut count = 0_u32;
            let mut found = 0_u32;
            let total_payments = self.total_payments_recorded.read();
            
            // Simplified implementation - iterate through payments
            let mut payment_id = 1_u256;
            while payment_id <= total_payments.into() && count < limit {
                if self.payment_exists.read(payment_id) {
                    let payment = self.payments.read(payment_id);
                    if payment.payer == user || payment.recipient == user {
                        if found >= offset {
                            result.append(payment);
                            count += 1;
                        }
                        found += 1;
                    }
                }
                payment_id += 1;
            };
            
            result
        }

        fn get_payments_by_status(self: @ContractState, status: PaymentStatus, limit: u32, offset: u32) -> Array<Payment> {
            let mut result: Array<Payment> = ArrayTrait::new();
            let mut count = 0_u32;
            let mut found = 0_u32;
            let total_payments = self.total_payments_recorded.read();
            
            // Simplified implementation
            let mut payment_id = 1_u256;
            while payment_id <= total_payments.into() && count < limit {
                if self.payment_exists.read(payment_id) {
                    let payment = self.payments.read(payment_id);
                    if payment.status == status {
                        if found >= offset {
                            result.append(payment);
                            count += 1;
                        }
                        found += 1;
                    }
                }
                payment_id += 1;
            };
            
            result
        }

        fn get_payments_by_type(self: @ContractState, payment_type: PaymentType, limit: u32, offset: u32) -> Array<Payment> {
            let mut result: Array<Payment> = ArrayTrait::new();
            let mut count = 0_u32;
            let mut found = 0_u32;
            let total_payments = self.total_payments_recorded.read();
            
            // Simplified implementation
            let mut payment_id = 1_u256;
            while payment_id <= total_payments.into() && count < limit {
                if self.payment_exists.read(payment_id) {
                    let payment = self.payments.read(payment_id);
                    if payment.payment_type == payment_type {
                        if found >= offset {
                            result.append(payment);
                            count += 1;
                        }
                        found += 1;
                    }
                }
                payment_id += 1;
            };
            
            result
        }

        fn get_recent_payments(self: @ContractState, limit: u32, offset: u32) -> Array<Payment> {
            let mut result: Array<Payment> = ArrayTrait::new();
            let mut count = 0_u32;
            let mut skipped = 0_u32;
            let total_payments = self.total_payments_recorded.read();
            
            // Get most recent payments (work backwards)
            let mut payment_id = total_payments.into();
            while payment_id > 0 && count < limit {
                if self.payment_exists.read(payment_id) {
                    if skipped >= offset {
                        let payment = self.payments.read(payment_id);
                        result.append(payment);
                        count += 1;
                    } else {
                        skipped += 1;
                    }
                }
                payment_id -= 1;
            };
            
            result
        }

        fn get_user_payment_stats(self: @ContractState, user: ContractAddress) -> (u32, u256) {
            let count = self.user_payment_count.read(user);
            let total_amount = self.user_total_amount.read(user);
            (count, total_amount)
        }

        fn get_payment_volume_by_period(self: @ContractState, from_time: u64, to_time: u64) -> u256 {
            let mut total_volume = 0_u256;
            let mut current_day = (from_time / 86400) * 86400;
            let end_day = (to_time / 86400) * 86400;
            
            while current_day <= end_day {
                let daily_vol = self.daily_volume.read(current_day);
                total_volume += daily_vol;
                current_day += 86400; // Next day
            };
            
            total_volume
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