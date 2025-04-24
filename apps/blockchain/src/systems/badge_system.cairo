#[starknet::contract]
mod BadgeSystem {
    use core::traits::Into;
    use starknet::{
        ContractAddress,
        get_caller_address,
    };
    use starknet::storage::Map;

    #[storage]
    struct Storage {
        user_badges: Map::<ContractAddress, Array<felt252>>,  // User's badges
        user_call_count: Map::<ContractAddress, u8>,          // User's trading call count
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        BadgeAwarded: BadgeAwarded,
        BadgeRemoved: BadgeRemoved,
    }

    #[derive(Drop, starknet::Event)]
    struct BadgeAwarded {
        user: ContractAddress,
        badge: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct BadgeRemoved {
        user: ContractAddress,
        badge: felt252,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {}

    #[external(v0)]
    fn award_badge(ref self: ContractState, user: ContractAddress, badge: felt252) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'Only owner can award badges');

        let mut badges = self.user_badges.read(user);
        badges.append(badge);
        self.user_badges.write(user, badges);

        self.emit(Event::BadgeAwarded(BadgeAwarded { user, badge }));
    }

    #[external(v0)]
    fn remove_badge(ref self: ContractState, user: ContractAddress, badge: felt252) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'Only owner can remove badges');

        let mut badges = self.user_badges.read(user);
        let index = badges.index_of(badge);
        badges.remove(index);
        self.user_badges.write(user, badges);

        self.emit(Event::BadgeRemoved(BadgeRemoved { user, badge }));
    }

    #[external(v0)]
    fn can_submit_call(self: @ContractState, user: ContractAddress) -> felt252 {
        let badges = self.user_badges.read(user);
        if badges.len() > 0 {
            return 1;  // Badge holders can submit unlimited calls
        }

        let call_count = self.user_call_count.read(user);
        if call_count < 5 {
            return 1;  // Non-badge holders can submit up to 5 calls
        }

        return 0;  // Restrict further calls
    }

    #[external(v0)]
    fn increment_call_count(ref self: ContractState, user: ContractAddress) {
        let mut call_count = self.user_call_count.read(user);
        call_count += 1;
        self.user_call_count.write(user, call_count);
    }
}