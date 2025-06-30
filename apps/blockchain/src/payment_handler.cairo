use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
use starknet::storage::{
    Map, StorageMapReadAccess, StorageMapWriteAccess,
    StoragePointerReadAccess, StoragePointerWriteAccess
};
use crate::payment_models::{Payment, PaymentStatus, PaymentType};

#[starknet::interface]
pub trait ISTRKPaymentHandler<TContractState> {
    // Core payment functions
    fn process_payment(
        ref self: TContractState,
        recipient: ContractAddress,
        amount: u256,
        payment_type: PaymentType,
        metadata_hash: felt252
    ) -> u256;
    
    // Payment status management
    fn complete_payment(ref self: TContractState, payment_id: u256) -> bool;
    fn fail_payment(ref self: TContractState, payment_id: u256) -> bool;
    
    // Payment queries
    fn get_payment(self: @TContractState, payment_id: u256) -> Payment;
    fn get_payment_status(self: @TContractState, payment_id: u256) -> PaymentStatus;
    
    // Admin functions
    fn set_admin(ref self: TContractState, admin: ContractAddress);
    fn get_admin(self: @TContractState) -> ContractAddress;
    
    // Statistics
    fn get_total_payments(self: @TContractState) -> u32;
    fn get_total_volume(self: @TContractState) -> u256;
}

#[starknet::contract]
pub mod STRKPaymentHandler {
    use super::*;

    #[storage]
    struct Storage {
        admin: ContractAddress,
        next_payment_id: u256,
        
        // Payment tracking
        payments: Map<u256, Payment>,
        payment_exists: Map<u256, bool>,
        
        // System statistics
        total_payments_processed: u32,
        total_payment_volume: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        PaymentProcessed: PaymentProcessed,
        PaymentCompleted: PaymentCompleted,
        PaymentFailed: PaymentFailed,
    }

    #[derive(Drop, starknet::Event)]
    pub struct PaymentProcessed {
        pub payment_id: u256,
        pub payer: ContractAddress,
        pub recipient: ContractAddress,
        pub amount: u256,
        pub payment_type: PaymentType,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct PaymentCompleted {
        pub payment_id: u256,
        pub completed_at: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct PaymentFailed {
        pub payment_id: u256,
        pub failed_at: u64,
    }

    #[constructor]
    fn constructor(ref self: ContractState, admin: ContractAddress) {
        self.admin.write(admin);
        self.next_payment_id.write(1);
    }

    #[abi(embed_v0)]
    impl STRKPaymentHandlerImpl of super::ISTRKPaymentHandler<ContractState> {
        fn process_payment(
            ref self: ContractState,
            recipient: ContractAddress,
            amount: u256,
            payment_type: PaymentType,
            metadata_hash: felt252
        ) -> u256 {
            let payer = get_caller_address();
            let payment_id = self.next_payment_id.read();
            let timestamp = get_block_timestamp();
            
            // Create payment record
            let payment = Payment {
                id: payment_id,
                payer,
                recipient,
                amount,
                payment_type,
                status: PaymentStatus::Pending,
                timestamp,
                expiration_time: 0,
                gas_fee: 0,
                metadata_hash,
            };
            
            // Store payment
            self.payments.write(payment_id, payment);
            self.payment_exists.write(payment_id, true);
            self.next_payment_id.write(payment_id + 1);
            
            // Update statistics
            let total_payments = self.total_payments_processed.read();
            let total_volume = self.total_payment_volume.read();
            self.total_payments_processed.write(total_payments + 1);
            self.total_payment_volume.write(total_volume + amount);
            
            self.emit(Event::PaymentProcessed(PaymentProcessed {
                payment_id,
                payer,
                recipient,
                amount,
                payment_type,
                timestamp,
            }));
            
            payment_id
        }

        fn complete_payment(ref self: ContractState, payment_id: u256) -> bool {
            assert(self.payment_exists.read(payment_id), 'Payment does not exist');
            
            let mut payment = self.payments.read(payment_id);
            assert(payment.status == PaymentStatus::Pending, 'Payment not pending');
            
            // Update payment status
            payment.status = PaymentStatus::Completed;
            self.payments.write(payment_id, payment);
            
            self.emit(Event::PaymentCompleted(PaymentCompleted {
                payment_id,
                completed_at: get_block_timestamp(),
            }));
            
            true
        }

        fn fail_payment(ref self: ContractState, payment_id: u256) -> bool {
            assert(self.payment_exists.read(payment_id), 'Payment does not exist');
            
            let mut payment = self.payments.read(payment_id);
            assert(payment.status == PaymentStatus::Pending, 'Payment not pending');
            
            // Update payment status
            payment.status = PaymentStatus::Failed;
            self.payments.write(payment_id, payment);
            
            self.emit(Event::PaymentFailed(PaymentFailed {
                payment_id,
                failed_at: get_block_timestamp(),
            }));
            
            true
        }

        fn get_payment(self: @ContractState, payment_id: u256) -> Payment {
            assert(self.payment_exists.read(payment_id), 'Payment does not exist');
            self.payments.read(payment_id)
        }

        fn get_payment_status(self: @ContractState, payment_id: u256) -> PaymentStatus {
            assert(self.payment_exists.read(payment_id), 'Payment does not exist');
            let payment = self.payments.read(payment_id);
            payment.status
        }

        fn set_admin(ref self: ContractState, admin: ContractAddress) {
            self._only_admin();
            self.admin.write(admin);
        }

        fn get_admin(self: @ContractState) -> ContractAddress {
            self.admin.read()
        }

        fn get_total_payments(self: @ContractState) -> u32 {
            self.total_payments_processed.read()
        }

        fn get_total_volume(self: @ContractState) -> u256 {
            self.total_payment_volume.read()
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