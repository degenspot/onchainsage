use starknet::ContractAddress;

// Core payment status enumeration
#[derive(Drop, Copy, PartialEq, Serde, starknet::Store)]
pub enum PaymentStatus {
    #[default]
    Pending,
    Completed,
    Failed,
    Cancelled,
    Refunded,
}

// Payment type enumeration
#[derive(Drop, Copy, PartialEq, Serde, starknet::Store)]
pub enum PaymentType {
    #[default]
    OneTime,
    Subscription,
    GasFee,
    Refund,
}

// Subscription status enumeration
#[derive(Drop, Copy, PartialEq, Serde, starknet::Store)]
pub enum SubscriptionStatus {
    #[default]
    Active,
    Paused,
    Cancelled,
    Expired,
}

// Core payment data structure
#[derive(Drop, Clone, Copy, Serde, starknet::Store)]
pub struct Payment {
    pub id: u256,
    pub payer: ContractAddress,
    pub recipient: ContractAddress,
    pub amount: u256,
    pub timestamp: u64,
    pub status: PaymentStatus,
    pub payment_type: PaymentType,
    pub expiration_time: u64, // 0 means no expiration
    pub gas_fee: u256,
    pub metadata_hash: felt252,
}

// Subscription plan definition
#[derive(Drop, Clone, Copy, Serde, starknet::Store)]
pub struct SubscriptionPlan {
    pub id: u256,
    pub name: felt252,
    pub price: u256,
    pub duration: u64, // Duration in seconds
    pub max_users: u32,
    pub features_hash: felt252, // Hash of features JSON
    pub is_active: bool,
}

// User subscription information
#[derive(Drop, Clone, Copy, Serde, starknet::Store)]
pub struct Subscription {
    pub id: u256,
    pub subscriber: ContractAddress,
    pub plan_id: u256,
    pub status: SubscriptionStatus,
    pub start_time: u64,
    pub end_time: u64,
    pub last_payment_time: u64,
    pub total_paid: u256,
    pub auto_renew: bool,
}

// Refund request structure
#[derive(Drop, Clone, Copy, Serde, starknet::Store)]
pub struct RefundRequest {
    pub id: u256,
    pub payment_id: u256,
    pub requester: ContractAddress,
    pub amount: u256,
    pub reason_hash: felt252,
    pub timestamp: u64,
    pub status: PaymentStatus,
    pub approved_by: ContractAddress,
}

// Gas fee record for tracking gas payments
#[derive(Drop, Clone, Copy, Serde, starknet::Store)]
pub struct GasFeeRecord {
    pub transaction_hash: felt252,
    pub payer: ContractAddress,
    pub amount: u256,
    pub timestamp: u64,
    pub operation_type: felt252,
}

// Trait for payment validation
#[starknet::interface]
pub trait IPaymentValidation<TContractState> {
    fn validate_payment_amount(self: @TContractState, amount: u256) -> bool;
    fn validate_payment_recipient(self: @TContractState, recipient: ContractAddress) -> bool;
    fn validate_subscription_eligibility(self: @TContractState, subscriber: ContractAddress, plan_id: u256) -> bool;
}

// Event structures for contract emissions
#[derive(Drop, starknet::Event)]
pub struct PaymentCreated {
    #[key]
    pub payment_id: u256,
    pub payer: ContractAddress,
    pub recipient: ContractAddress,
    pub amount: u256,
    pub payment_type: PaymentType,
}

#[derive(Drop, starknet::Event)]
pub struct PaymentStatusUpdated {
    pub payment_id: u256,
    pub old_status: PaymentStatus,
    pub new_status: PaymentStatus,
    pub updated_by: ContractAddress,
}

#[derive(Drop, starknet::Event)]
pub struct SubscriptionCreated {
    #[key]
    pub subscription_id: u256,
    pub subscriber: ContractAddress,
    pub plan_id: u256,
    pub start_time: u64,
}

#[derive(Drop, starknet::Event)]
pub struct RefundRequested {
    #[key]
    pub refund_id: u256,
    pub payment_id: u256,
    pub requester: ContractAddress,
    pub amount: u256,
}

#[derive(Drop, starknet::Event)]
pub struct RefundProcessed {
    #[key]
    pub refund_id: u256,
    pub payment_id: u256,
    pub amount: u256,
    pub approved_by: ContractAddress,
} 