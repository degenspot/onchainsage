use starknet::ContractAddress;

// Standard ERC20 interface for STRK token
#[starknet::interface]
pub trait IERC20<TContractState> {
    fn name(self: @TContractState) -> felt252;
    fn symbol(self: @TContractState) -> felt252;
    fn decimals(self: @TContractState) -> u8;
    fn total_supply(self: @TContractState) -> u256;
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
    fn allowance(self: @TContractState, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256) -> bool;
    fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;
}

// Extended STRK token interface with additional functionality
#[starknet::interface]
pub trait ISTRKToken<TContractState> {
    // Standard ERC20 functions
    fn name(self: @TContractState) -> felt252;
    fn symbol(self: @TContractState) -> felt252;
    fn decimals(self: @TContractState) -> u8;
    fn total_supply(self: @TContractState) -> u256;
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
    fn allowance(self: @TContractState, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256) -> bool;
    fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;
    
    // Extended functions for payment system
    fn safe_transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
    fn batch_transfer(ref self: TContractState, recipients: Array<ContractAddress>, amounts: Array<u256>) -> bool;
    fn is_transfer_allowed(self: @TContractState, from: ContractAddress, to: ContractAddress, amount: u256) -> bool;
    fn get_transfer_fee(self: @TContractState, amount: u256) -> u256;
}

// Payment-specific token operations
#[starknet::interface]
pub trait ISTRKPaymentToken<TContractState> {
    fn process_payment(ref self: TContractState, from: ContractAddress, to: ContractAddress, amount: u256, payment_id: u256) -> bool;
    fn process_subscription_payment(ref self: TContractState, subscriber: ContractAddress, amount: u256, subscription_id: u256) -> bool;
    fn process_refund(ref self: TContractState, to: ContractAddress, amount: u256, refund_id: u256) -> bool;
    fn lock_tokens(ref self: TContractState, account: ContractAddress, amount: u256, lock_duration: u64) -> bool;
    fn unlock_tokens(ref self: TContractState, account: ContractAddress, amount: u256) -> bool;
    fn get_locked_balance(self: @TContractState, account: ContractAddress) -> u256;
}

// Token utility functions
pub mod token_utils {
    use super::*;
    
    pub fn validate_transfer_amount(amount: u256) -> bool {
        amount > 0 && amount <= 1000000000000000000000000_u256 // Max 1M STRK
    }
    
    pub fn calculate_gas_fee(amount: u256, base_fee: u256) -> u256 {
        let fee_rate = 100_u256; // 0.01% fee rate
        (amount * base_fee) / (fee_rate * 10000_u256)
    }
    
    pub fn is_valid_address(address: ContractAddress) -> bool {
        address.into() != 0
    }
    
    pub fn format_token_amount(amount: u256, decimals: u8) -> u256 {
        let multiplier = pow(10_u256, decimals.into());
        amount * multiplier
    }
    
    fn pow(base: u256, exp: u256) -> u256 {
        if exp == 0 {
            return 1_u256;
        }
        let mut result = 1_u256;
        let mut base_power = base;
        let mut exponent = exp;
        
        loop {
            if exponent & 1 == 1 {
                result = result * base_power;
            }
            exponent = exponent / 2;
            if exponent == 0 {
                break;
            }
            base_power = base_power * base_power;
        };
        result
    }
}

// Events for token operations
#[derive(Drop, starknet::Event)]
pub struct TokenTransfer {
    pub from: ContractAddress,
    pub to: ContractAddress,
    pub amount: u256,
    pub payment_id: u256,
}

#[derive(Drop, starknet::Event)]
pub struct TokensLocked {
    pub account: ContractAddress,
    pub amount: u256,
    pub lock_duration: u64,
    pub timestamp: u64,
}

#[derive(Drop, starknet::Event)]
pub struct TokensUnlocked {
    pub account: ContractAddress,
    pub amount: u256,
    pub timestamp: u64,
}

#[derive(Drop, starknet::Event)]
pub struct BatchTransferCompleted {
    pub total_recipients: u32,
    pub total_amount: u256,
    pub timestamp: u64,
} 