// src/UserProfile.cairo

use starknet::contract::ContractState;
use starknet::storage::LegacyMap;
use starknet::info::get_block_timestamp;

#[derive(Drop, Serde)]
struct User {
    wallet_address: felt252,
    username: felt252,
    registration_timestamp: u64,
    profile_metadata_hash: felt252,
    is_active: bool,
}

#[storage]
struct Storage {
    users: LegacyMap<felt252, User>,
    usernames: LegacyMap<felt252, bool>,
}

#[event]
fn UserRegistered(wallet: felt252, username: felt252);

#[external]
fn register_user(
    ref self: ContractState,
    wallet: felt252,
    username: felt252,
    profile_metadata_hash: felt252,
) {
    let maybe_existing_user = self.users.read(wallet);
    assert(maybe_existing_user.is_none(), 'User already registered');

    let username_taken = self.usernames.read(username).unwrap_or(false);
    assert(!username_taken, 'Username already taken');

    let timestamp = get_block_timestamp();

    let user = User {
        wallet_address: wallet,
        username,
        registration_timestamp: timestamp,
        profile_metadata_hash,
        is_active: true,
    };

    self.users.write(wallet, user);
    self.usernames.write(username, true);
    UserRegistered(wallet, username);
}

#[event]
fn ProfileUpdated(wallet: felt252, username: felt252);

#[external]
fn update_profile(
    ref self: ContractState,
    caller: felt252,
    new_username: felt252,
    new_profile_metadata_hash: felt252,
) {
    let mut user = self.users.read(caller).unwrap();
    assert(user.wallet_address == caller, 'Not profile owner');

    if user.username != new_username {
        let taken = self.usernames.read(new_username).unwrap_or(false);
        assert(!taken, 'Username taken');
        self.usernames.write(user.username, false);
        self.usernames.write(new_username, true);
        user.username = new_username;
    }

    user.profile_metadata_hash = new_profile_metadata_hash;
    self.users.write(caller, user);
    ProfileUpdated(caller, new_username);
}

#[event]
fn ProfileDeactivated(wallet: felt252);
#[event]
fn ProfileReactivated(wallet: felt252);

#[external]
fn deactivate_profile(ref self: ContractState, caller: felt252) {
    let mut user = self.users.read(caller).unwrap();
    assert(user.wallet_address == caller, 'Not profile owner');
    user.is_active = false;
    self.users.write(caller, user);
    ProfileDeactivated(caller);
}

#[external]
fn reactivate_profile(ref self: ContractState, caller: felt252) {
    let mut user = self.users.read(caller).unwrap();
    assert(user.wallet_address == caller, 'Not profile owner');
    user.is_active = true;
    self.users.write(caller, user);
    ProfileReactivated(caller);
}


#[view]
fn get_user(ref self: ContractState, wallet: felt252) -> User {
    self.users.read(wallet).unwrap()
}

#[view]
fn is_username_taken(ref self: ContractState, username: felt252) -> bool {
    self.usernames.read(username).unwrap_or(false)
}