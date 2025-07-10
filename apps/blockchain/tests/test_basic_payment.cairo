use starknet::contract_address_const;
use snforge_std::{declare, ContractClassTrait, DeclareResultTrait, cheat_caller_address, CheatSpan};

use strk_payment_handler::payment_handler::{ISTRKPaymentHandlerDispatcher, ISTRKPaymentHandlerDispatcherTrait};
use strk_payment_handler::payment_models::{PaymentStatus, PaymentType};

const ADMIN: felt252 = 'admin';
const USER1: felt252 = 'user1';
const USER2: felt252 = 'user2';

fn setup_payment_handler() -> ISTRKPaymentHandlerDispatcher {
    let admin_address = contract_address_const::<ADMIN>();
    
    let contract_class = declare("STRKPaymentHandler").unwrap().contract_class();
    let (contract_address, _) = contract_class.deploy(@array![admin_address.into()]).unwrap();
    
    ISTRKPaymentHandlerDispatcher { contract_address }
}

#[test]
fn test_basic_payment_processing() {
    let payment_handler = setup_payment_handler();
    let user1_address = contract_address_const::<USER1>();
    let user2_address = contract_address_const::<USER2>();
    
    // Process a basic payment
    cheat_caller_address(payment_handler.contract_address, user1_address, CheatSpan::TargetCalls(1));
    let payment_id = payment_handler.process_payment(
        user2_address,
        1000000000000000000_u256, // 1 STRK
        PaymentType::OneTime,
        'test_payment'
    );
    
    // Verify payment was created
    assert(payment_id == 1, 'Payment ID should be 1');
    
    let payment = payment_handler.get_payment(payment_id);
    assert(payment.payer == user1_address, 'Incorrect payer');
    assert(payment.recipient == user2_address, 'Incorrect recipient');
    assert(payment.status == PaymentStatus::Pending, 'Payment should be pending');
    assert(payment.amount == 1000000000000000000_u256, 'Incorrect amount');
}

#[test]
fn test_payment_completion() {
    let payment_handler = setup_payment_handler();
    let user1_address = contract_address_const::<USER1>();
    let user2_address = contract_address_const::<USER2>();
    let admin_address = contract_address_const::<ADMIN>();
    
    // Process a payment
    cheat_caller_address(payment_handler.contract_address, user1_address, CheatSpan::TargetCalls(1));
    let payment_id = payment_handler.process_payment(
        user2_address,
        1000000000000000000_u256,
        PaymentType::OneTime,
        'test_payment'
    );
    
    // Complete the payment
    cheat_caller_address(payment_handler.contract_address, admin_address, CheatSpan::TargetCalls(1));
    let success = payment_handler.complete_payment(payment_id);
    
    assert(success, 'Payment completion failed');
    
    let updated_payment = payment_handler.get_payment(payment_id);
    assert(updated_payment.status == PaymentStatus::Completed, 'Payment should be completed');
}

#[test]
fn test_payment_failure() {
    let payment_handler = setup_payment_handler();
    let user1_address = contract_address_const::<USER1>();
    let user2_address = contract_address_const::<USER2>();
    let admin_address = contract_address_const::<ADMIN>();
    
    // Process a payment
    cheat_caller_address(payment_handler.contract_address, user1_address, CheatSpan::TargetCalls(1));
    let payment_id = payment_handler.process_payment(
        user2_address,
        1000000000000000000_u256,
        PaymentType::OneTime,
        'test_payment'
    );
    
    // Fail the payment
    cheat_caller_address(payment_handler.contract_address, admin_address, CheatSpan::TargetCalls(1));
    let success = payment_handler.fail_payment(payment_id);
    
    assert(success, 'Payment failure failed');
    
    let updated_payment = payment_handler.get_payment(payment_id);
    assert(updated_payment.status == PaymentStatus::Failed, 'Payment should be failed');
}

#[test]
fn test_statistics() {
    let payment_handler = setup_payment_handler();
    let user1_address = contract_address_const::<USER1>();
    let user2_address = contract_address_const::<USER2>();
    
    // Initial statistics should be zero
    assert(payment_handler.get_total_payments() == 0, 'Initial payments should be 0');
    assert(payment_handler.get_total_volume() == 0, 'Initial volume should be 0');
    
    // Process some payments
    cheat_caller_address(payment_handler.contract_address, user1_address, CheatSpan::TargetCalls(2));
    
    payment_handler.process_payment(
        user2_address,
        1000000000000000000_u256, // 1 STRK
        PaymentType::OneTime,
        'payment1'
    );
    
    payment_handler.process_payment(
        user2_address,
        2000000000000000000_u256, // 2 STRK
        PaymentType::OneTime,
        'payment2'
    );
    
    // Check updated statistics
    assert(payment_handler.get_total_payments() == 2, 'Should have 2 payments');
    assert(payment_handler.get_total_volume() == 3000000000000000000_u256, 'Should have 3 STRK volume');
}

#[test]
fn test_admin_functions() {
    let payment_handler = setup_payment_handler();
    let admin_address = contract_address_const::<ADMIN>();
    let new_admin_address = contract_address_const::<'new_admin'>();
    
    // Check initial admin
    assert(payment_handler.get_admin() == admin_address, 'Initial admin incorrect');
    
    // Change admin
    cheat_caller_address(payment_handler.contract_address, admin_address, CheatSpan::TargetCalls(1));
    payment_handler.set_admin(new_admin_address);
    
    // Verify admin change
    assert(payment_handler.get_admin() == new_admin_address, 'Admin change failed');
}

#[test]
fn test_multiple_payment_types() {
    let payment_handler = setup_payment_handler();
    let user1_address = contract_address_const::<USER1>();
    let user2_address = contract_address_const::<USER2>();
    
    cheat_caller_address(payment_handler.contract_address, user1_address, CheatSpan::TargetCalls(3));
    
    // Test different payment types
    let payment_id1 = payment_handler.process_payment(
        user2_address,
        1000000000000000000_u256,
        PaymentType::OneTime,
        'one_time'
    );
    
    let payment_id2 = payment_handler.process_payment(
        user2_address,
        2000000000000000000_u256,
        PaymentType::Subscription,
        'subscription'
    );
    
    let payment_id3 = payment_handler.process_payment(
        user2_address,
        500000000000000000_u256,
        PaymentType::GasFee,
        'gas_fee'
    );
    
    // Verify payment types
    let payment1 = payment_handler.get_payment(payment_id1);
    let payment2 = payment_handler.get_payment(payment_id2);
    let payment3 = payment_handler.get_payment(payment_id3);
    
    assert(payment1.payment_type == PaymentType::OneTime, 'Payment1 type incorrect');
    assert(payment2.payment_type == PaymentType::Subscription, 'Payment2 type incorrect');
    assert(payment3.payment_type == PaymentType::GasFee, 'Payment3 type incorrect');
} 