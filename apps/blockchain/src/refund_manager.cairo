use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
use starknet::storage::{
    Map, StorageMapReadAccess, StorageMapWriteAccess,
    StoragePointerReadAccess, StoragePointerWriteAccess
};
use crate::payment_models::{RefundRequest, PaymentStatus, RefundRequested, RefundProcessed};

#[starknet::interface]
pub trait IRefundManager<TContractState> {
    fn request_refund(ref self: TContractState, payment_id: u256, reason_hash: felt252) -> u256;
    fn approve_refund(ref self: TContractState, refund_id: u256) -> bool;
    fn reject_refund(ref self: TContractState, refund_id: u256, reason_hash: felt252) -> bool;
    fn process_refund(ref self: TContractState, refund_id: u256) -> bool;
    
    fn get_refund_request(self: @TContractState, refund_id: u256) -> RefundRequest;
    fn get_payment_refund_count(self: @TContractState, payment_id: u256) -> u32;
    fn get_user_refund_count(self: @TContractState, user: ContractAddress) -> u32;
    fn get_pending_refunds_count(self: @TContractState) -> u32;
    
    fn is_refund_eligible(self: @TContractState, payment_id: u256) -> bool;
    fn calculate_refund_amount(self: @TContractState, payment_id: u256, refund_type: felt252) -> u256;
    fn get_refund_deadline(self: @TContractState, payment_id: u256) -> u64;
    
    // Admin functions
    fn set_refund_policy(ref self: TContractState, refund_window: u64, max_refund_percentage: u8);
    fn set_auto_approve_threshold(ref self: TContractState, threshold: u256);
    fn bulk_process_refunds(ref self: TContractState, refund_ids: Array<u256>) -> u32;
    fn set_admin(ref self: TContractState, admin: ContractAddress);
    fn get_admin(self: @TContractState) -> ContractAddress;
    fn pause_refunds(ref self: TContractState);
    fn resume_refunds(ref self: TContractState);
    fn is_refunds_paused(self: @TContractState) -> bool;
}

#[starknet::contract]
pub mod RefundManager {
    use super::*;

    #[storage]
    struct Storage {
        admin: ContractAddress,
        next_refund_id: u256,
        is_paused: bool,
        
        // Refund requests
        refund_requests: Map<u256, RefundRequest>,
        refund_exists: Map<u256, bool>,
        
        // Payment to refund mapping (simplified)
        payment_refund_count: Map<u256, u32>,
        user_refund_count: Map<ContractAddress, u32>,
        
        // Refund policy settings
        refund_window_seconds: u64, // Time window for refund eligibility
        max_refund_percentage: u8, // Maximum percentage of payment that can be refunded
        auto_approve_threshold: u256, // Auto-approve refunds below this amount
        
        // Refund statistics
        total_refunds_requested: u32,
        total_refunds_approved: u32,
        total_refunds_processed: u32,
        total_refund_amount: u256,
        
        // Refund eligibility rules
        subscription_refund_window: u64,
        gas_fee_refund_enabled: bool,
        one_time_payment_refund_window: u64,
        
        // Blacklisted payments (not eligible for refunds)
        refund_blacklist: Map<u256, bool>, // payment_id -> blacklisted
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        RefundRequested: RefundRequested,
        RefundApproved: RefundApproved,
        RefundRejected: RefundRejected,
        RefundProcessed: RefundProcessed,
        RefundPolicyUpdated: RefundPolicyUpdated,
        RefundsPaused: RefundsPaused,
        RefundsResumed: RefundsResumed,
        BulkRefundsProcessed: BulkRefundsProcessed,
    }

    #[derive(Drop, starknet::Event)]
    pub struct RefundApproved {
        pub refund_id: u256,
        pub payment_id: u256,
        pub amount: u256,
        pub approved_by: ContractAddress,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct RefundRejected {
        pub refund_id: u256,
        pub payment_id: u256,
        pub rejected_by: ContractAddress,
        pub reason_hash: felt252,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct RefundPolicyUpdated {
        pub refund_window: u64,
        pub max_percentage: u8,
        pub updated_by: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct RefundsPaused {
        pub paused_by: ContractAddress,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct RefundsResumed {
        pub resumed_by: ContractAddress,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct BulkRefundsProcessed {
        pub count: u32,
        pub total_amount: u256,
        pub processed_by: ContractAddress,
        pub timestamp: u64,
    }

    #[constructor]
    fn constructor(ref self: ContractState, admin: ContractAddress) {
        self.admin.write(admin);
        self.next_refund_id.write(1);
        self.refund_window_seconds.write(604800_u64); // 7 days default
        self.max_refund_percentage.write(100_u8); // 100% refund allowed by default
        self.auto_approve_threshold.write(1000000000000000000_u256); // 1 STRK auto-approve threshold
        self.subscription_refund_window.write(259200_u64); // 3 days for subscriptions
        self.one_time_payment_refund_window.write(86400_u64); // 1 day for one-time payments
        self.gas_fee_refund_enabled.write(false); // Gas fees not refundable by default
        self.is_paused.write(false);
    }

    #[abi(embed_v0)]
    impl RefundManagerImpl of super::IRefundManager<ContractState> {
        fn request_refund(ref self: ContractState, payment_id: u256, reason_hash: felt252) -> u256 {
            assert(!self.is_paused.read(), 'Refunds paused');
            assert(self.is_refund_eligible(payment_id), 'Not eligible');
            assert(!self.refund_blacklist.read(payment_id), 'Payment blacklisted');
            
            let requester = get_caller_address();
            let refund_id = self.next_refund_id.read();
            let timestamp = get_block_timestamp();
            
            // Calculate refund amount (simplified - could be more complex based on policy)
            let refund_amount = self.calculate_refund_amount(payment_id, 'full_refund');
            
            let refund_request = RefundRequest {
                id: refund_id,
                payment_id,
                requester,
                amount: refund_amount,
                reason_hash,
                timestamp,
                status: PaymentStatus::Pending,
                approved_by: requester, // Will be updated when approved
            };
            
            self.refund_requests.write(refund_id, refund_request);
            self.refund_exists.write(refund_id, true);
            self.next_refund_id.write(refund_id + 1);
            
            // Update counters
            let payment_count = self.payment_refund_count.read(payment_id);
            self.payment_refund_count.write(payment_id, payment_count + 1);
            
            let user_count = self.user_refund_count.read(requester);
            self.user_refund_count.write(requester, user_count + 1);
            
            // Update statistics
            let total_requested = self.total_refunds_requested.read();
            self.total_refunds_requested.write(total_requested + 1);
            
            // Auto-approve if below threshold
            if refund_amount <= self.auto_approve_threshold.read() {
                self._approve_refund_internal(refund_id, requester);
            }
            
            self.emit(Event::RefundRequested(RefundRequested {
                refund_id,
                payment_id,
                requester,
                amount: refund_amount,
            }));
            
            refund_id
        }

        fn approve_refund(ref self: ContractState, refund_id: u256) -> bool {
            self._only_admin();
            self._approve_refund_internal(refund_id, get_caller_address())
        }

        fn reject_refund(ref self: ContractState, refund_id: u256, reason_hash: felt252) -> bool {
            self._only_admin();
            assert(self.refund_exists.read(refund_id), 'Refund not found');
            
            let mut refund = self.refund_requests.read(refund_id);
            assert(refund.status == PaymentStatus::Pending, 'Not pending');
            
            refund.status = PaymentStatus::Failed;
            self.refund_requests.write(refund_id, refund);
            
            self.emit(Event::RefundRejected(RefundRejected {
                refund_id,
                payment_id: refund.payment_id,
                rejected_by: get_caller_address(),
                reason_hash,
                timestamp: get_block_timestamp(),
            }));
            
            true
        }

        fn process_refund(ref self: ContractState, refund_id: u256) -> bool {
            assert(self.refund_exists.read(refund_id), 'Refund not found');
            
            let mut refund = self.refund_requests.read(refund_id);
            assert(refund.status == PaymentStatus::Completed, 'Not approved');
            
            // Process the actual refund (simplified)
            refund.status = PaymentStatus::Refunded;
            self.refund_requests.write(refund_id, refund);
            
            // Update statistics
            let total_processed = self.total_refunds_processed.read();
            let total_amount = self.total_refund_amount.read();
            self.total_refunds_processed.write(total_processed + 1);
            self.total_refund_amount.write(total_amount + refund.amount);
            
            self.emit(Event::RefundProcessed(RefundProcessed {
                refund_id,
                payment_id: refund.payment_id,
                amount: refund.amount,
                approved_by: refund.approved_by,
            }));
            
            true
        }

        fn get_refund_request(self: @ContractState, refund_id: u256) -> RefundRequest {
            assert(self.refund_exists.read(refund_id), 'Refund not found');
            self.refund_requests.read(refund_id)
        }

        fn get_payment_refund_count(self: @ContractState, payment_id: u256) -> u32 {
            self.payment_refund_count.read(payment_id)
        }

        fn get_user_refund_count(self: @ContractState, user: ContractAddress) -> u32 {
            self.user_refund_count.read(user)
        }

        fn get_pending_refunds_count(self: @ContractState) -> u32 {
            // Simplified implementation
            self.total_refunds_requested.read() - self.total_refunds_processed.read()
        }

        fn is_refund_eligible(self: @ContractState, payment_id: u256) -> bool {
            // Simplified eligibility check
            // In practice, this would check payment timestamp and other criteria
            true // Simplified for compilation
        }

        fn calculate_refund_amount(self: @ContractState, payment_id: u256, refund_type: felt252) -> u256 {
            // Simplified refund calculation
            // In practice, this would consider payment details, fees, etc.
            1000000000000000000_u256 // 1 STRK placeholder
        }

        fn get_refund_deadline(self: @ContractState, payment_id: u256) -> u64 {
            let current_time = get_block_timestamp();
            let refund_window = self.refund_window_seconds.read();
            current_time + refund_window
        }

        fn set_refund_policy(ref self: ContractState, refund_window: u64, max_refund_percentage: u8) {
            self._only_admin();
            assert(max_refund_percentage <= 100, 'Invalid percentage');
            
            self.refund_window_seconds.write(refund_window);
            self.max_refund_percentage.write(max_refund_percentage);
            
            self.emit(Event::RefundPolicyUpdated(RefundPolicyUpdated {
                refund_window,
                max_percentage: max_refund_percentage,
                updated_by: get_caller_address(),
            }));
        }

        fn set_auto_approve_threshold(ref self: ContractState, threshold: u256) {
            self._only_admin();
            self.auto_approve_threshold.write(threshold);
        }

        fn bulk_process_refunds(ref self: ContractState, refund_ids: Array<u256>) -> u32 {
            self._only_admin();
            
            let mut processed_count = 0_u32;
            let mut total_amount = 0_u256;
            let mut i = 0_u32;
            
            while i < refund_ids.len() {
                let refund_id = *refund_ids.at(i);
                if self.process_refund(refund_id) {
                    processed_count += 1;
                    let refund = self.refund_requests.read(refund_id);
                    total_amount += refund.amount;
                }
                i += 1;
            };
            
            self.emit(Event::BulkRefundsProcessed(BulkRefundsProcessed {
                count: processed_count,
                total_amount,
                processed_by: get_caller_address(),
                timestamp: get_block_timestamp(),
            }));
            
            processed_count
        }

        fn set_admin(ref self: ContractState, admin: ContractAddress) {
            self._only_admin();
            self.admin.write(admin);
        }

        fn get_admin(self: @ContractState) -> ContractAddress {
            self.admin.read()
        }

        fn pause_refunds(ref self: ContractState) {
            self._only_admin();
            self.is_paused.write(true);
            
            self.emit(Event::RefundsPaused(RefundsPaused {
                paused_by: get_caller_address(),
                timestamp: get_block_timestamp(),
            }));
        }

        fn resume_refunds(ref self: ContractState) {
            self._only_admin();
            self.is_paused.write(false);
            
            self.emit(Event::RefundsResumed(RefundsResumed {
                resumed_by: get_caller_address(),
                timestamp: get_block_timestamp(),
            }));
        }

        fn is_refunds_paused(self: @ContractState) -> bool {
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

        fn _approve_refund_internal(ref self: ContractState, refund_id: u256, approver: ContractAddress) -> bool {
            assert(self.refund_exists.read(refund_id), 'Refund not found');
            
            let mut refund = self.refund_requests.read(refund_id);
            assert(refund.status == PaymentStatus::Pending, 'Not pending');
            
            refund.status = PaymentStatus::Completed;
            refund.approved_by = approver;
            self.refund_requests.write(refund_id, refund);
            
            // Update statistics
            let total_approved = self.total_refunds_approved.read();
            self.total_refunds_approved.write(total_approved + 1);
            
            self.emit(Event::RefundApproved(RefundApproved {
                refund_id,
                payment_id: refund.payment_id,
                amount: refund.amount,
                approved_by: approver,
                timestamp: get_block_timestamp(),
            }));
            
            true
        }
    }
} 