use core::traits::Into;
use core::option::OptionTrait;
use starknet::{ContractAddress, testing};
use strk_payment_handler::payment_handler::STRKPaymentHandler;

#[cfg(test)]
mod tests {
    use super::STRKPaymentHandler;
    use starknet::{ContractAddress, testing};

    fn setup() -> (STRKPaymentHandler::ContractState, ContractAddress) {
        // Create a test caller address
        let caller = starknet::contract_address_const::<1>();
        testing::set_caller_address(caller);
        
        // Initialize contract state
        let mut state = STRKPaymentHandler::contract_state_for_testing();
        STRKPaymentHandler::constructor(ref state);
        
        (state, caller)
    }

    #[test]
    fn test_constructor() {
        let (state, caller) = setup();
        let owner = STRKPaymentHandler::get_owner(@state);
        assert(owner == caller, 'Owner not set correctly');
    }

    #[test]
    fn test_receive_payment() {
        let (mut state, caller) = setup();
        
        // Set payment amount
        let amount: u256 = 1000;
        
        // Make payment
        STRKPaymentHandler::receive_payment(ref state, amount);
        
        // Verify payment recorded
        let recorded = STRKPaymentHandler::get_payment_received(@state, caller);
        assert(recorded == amount, 'Payment incorrect');
    }

    #[test]
    fn test_multiple_payments() {
        let (mut state, caller) = setup();
        
        // Make multiple payments
        let amount1: u256 = 1000;
        let amount2: u256 = 2000;
        STRKPaymentHandler::receive_payment(ref state, amount1);
        STRKPaymentHandler::receive_payment(ref state, amount2);
        
        // Verify total payments recorded
        let recorded = STRKPaymentHandler::get_payment_received(@state, caller);
        let expected = amount1 + amount2;
        assert(recorded == expected, 'Payments incorrect');
    }

    #[test]
    #[should_panic(expected: 'Only owner can withdraw')]
    fn test_withdraw_unauthorized() {
        let (mut state, _) = setup();
        
        // Change caller to non-owner
        testing::set_caller_address(starknet::contract_address_const::<2>());
        
        // Attempt withdraw
        STRKPaymentHandler::withdraw(ref state, 100_u256);
    }
}