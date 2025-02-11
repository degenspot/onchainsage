#[starknet::contract]
mod STRKPaymentHandler {
    use core::traits::Into;
    use starknet::{
        ContractAddress,
        get_caller_address,
        get_contract_address,
    };
    use starknet::storage::Map;

    #[storage]
    struct Storage {
        payments_received: Map::<ContractAddress, u256>,
        owner: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        PaymentReceived: PaymentReceived,
    }

    #[derive(Drop, starknet::Event)]
    struct PaymentReceived {
        from: ContractAddress,
        amount: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.owner.write(get_caller_address());
    }

    #[external(v0)]
    fn receive_payment(ref self: ContractState, amount: u256) {
        let caller = get_caller_address();
        let current_amount = self.payments_received.read(caller);
        self.payments_received.write(caller, current_amount + amount);

        self.emit(Event::PaymentReceived(PaymentReceived { from: caller, amount }));
    }

    #[external(v0)]
    fn get_payment_received(self: @ContractState, address: ContractAddress) -> u256 {
        self.payments_received.read(address)
    }

    #[external(v0)]
    fn get_owner(self: @ContractState) -> ContractAddress {
        self.owner.read()
    }

    #[external(v0)]
    fn withdraw(ref self: ContractState, amount: u256) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'Only owner can withdraw');
        
        // For Starknet v0.13.0 and later, transfers are handled through L1 handler
        // This is a placeholder - actual implementation depends on network setup
        self.emit(Event::PaymentReceived(PaymentReceived { 
            from: self.owner.read(), 
            amount: amount 
        }));
    }
}