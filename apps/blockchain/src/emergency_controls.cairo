use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
use starknet::storage::{
    Map, StorageMapReadAccess, StorageMapWriteAccess,
    StoragePointerReadAccess, StoragePointerWriteAccess
};

#[starknet::interface]
pub trait IEmergencyControls<TContractState> {
    fn emergency_pause(ref self: TContractState, reason: felt252) -> bool;
    fn emergency_unpause(ref self: TContractState) -> bool;
    fn force_pause_payments(ref self: TContractState) -> bool;
    fn force_pause_subscriptions(ref self: TContractState) -> bool;
    fn force_pause_refunds(ref self: TContractState) -> bool;
    fn force_pause_gas_collection(ref self: TContractState) -> bool;
    
    fn is_emergency_paused(self: @TContractState) -> bool;
    fn are_payments_paused(self: @TContractState) -> bool;
    fn are_subscriptions_paused(self: @TContractState) -> bool;
    fn are_refunds_paused(self: @TContractState) -> bool;
    fn is_gas_collection_paused(self: @TContractState) -> bool;
    
    fn get_pause_reason(self: @TContractState) -> felt252;
    fn get_pause_timestamp(self: @TContractState) -> u64;
    fn get_pause_duration(self: @TContractState) -> u64;
    
    // Recovery mode functions
    fn enable_recovery_mode(ref self: TContractState, reason: felt252) -> bool;
    fn disable_recovery_mode(ref self: TContractState) -> bool;
    fn is_recovery_mode_active(self: @TContractState) -> bool;
    
    // Fund emergency functions  
    fn emergency_withdraw(ref self: TContractState, amount: u256, recipient: ContractAddress) -> bool;
    fn emergency_transfer_ownership(ref self: TContractState, new_owner: ContractAddress) -> bool;
    
    // Admin functions
    fn add_emergency_admin(ref self: TContractState, admin: ContractAddress) -> bool;
    fn remove_emergency_admin(ref self: TContractState, admin: ContractAddress) -> bool;
    fn is_emergency_admin(self: @TContractState, admin: ContractAddress) -> bool;
    fn get_emergency_admin_count(self: @TContractState) -> u32;
    
    fn set_owner(ref self: TContractState, new_owner: ContractAddress);
    fn get_owner(self: @TContractState) -> ContractAddress;
}

#[starknet::contract]
pub mod EmergencyControls {
    use super::*;
    #[storage]
    struct Storage {
        owner: ContractAddress,
        is_emergency_paused: bool,
        pause_timestamp: u64,
        pause_reason: felt252,
        paused_by: ContractAddress,
        
        // Individual system pause states
        payments_paused: bool,
        subscriptions_paused: bool,
        refunds_paused: bool,
        gas_collection_paused: bool,
        
        // Recovery mode
        recovery_mode_active: bool,
        recovery_reason: felt252,
        recovery_activated_by: ContractAddress,
        recovery_activation_time: u64,
        
        // Emergency admins (simplified storage)
        is_emergency_admin: Map<ContractAddress, bool>,
        emergency_admin_count: u32,
        
        // Emergency action tracking
        daily_emergency_actions: Map<u64, u32>, // day -> action_count
        max_daily_emergency_actions: u32,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        EmergencyPauseActivated: EmergencyPauseActivated,
        EmergencyPauseDeactivated: EmergencyPauseDeactivated,
        RecoveryModeActivated: RecoveryModeActivated,
        RecoveryModeDeactivated: RecoveryModeDeactivated,
        EmergencyAdminAdded: EmergencyAdminAdded,
        EmergencyAdminRemoved: EmergencyAdminRemoved,
        EmergencyWithdrawal: EmergencyWithdrawal,
        OwnershipTransferred: OwnershipTransferred,
        SystemPaused: SystemPaused,
        SystemResumed: SystemResumed,
    }

    #[derive(Drop, starknet::Event)]
    pub struct EmergencyPauseActivated {
        pub paused_by: ContractAddress,
        pub reason: felt252,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct EmergencyPauseDeactivated {
        pub unpaused_by: ContractAddress,
        pub pause_duration: u64,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct RecoveryModeActivated {
        pub activated_by: ContractAddress,
        pub reason: felt252,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct RecoveryModeDeactivated {
        pub deactivated_by: ContractAddress,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct EmergencyAdminAdded {
        pub admin: ContractAddress,
        pub added_by: ContractAddress,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct EmergencyAdminRemoved {
        pub admin: ContractAddress,
        pub removed_by: ContractAddress,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct EmergencyWithdrawal {
        pub amount: u256,
        pub recipient: ContractAddress,
        pub withdrawn_by: ContractAddress,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct OwnershipTransferred {
        pub old_owner: ContractAddress,
        pub new_owner: ContractAddress,
        pub transferred_by: ContractAddress,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct SystemPaused {
        pub system: felt252,
        pub paused_by: ContractAddress,
        pub timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct SystemResumed {
        pub system: felt252,
        pub resumed_by: ContractAddress,
        pub timestamp: u64,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.owner.write(owner);
        self.max_daily_emergency_actions.write(10); // Default max 10 emergency actions per day
        
        // Add owner as emergency admin
        self.is_emergency_admin.write(owner, true);
        self.emergency_admin_count.write(1);
    }

    #[abi(embed_v0)]
    impl EmergencyControlsImpl of super::IEmergencyControls<ContractState> {
        fn emergency_pause(ref self: ContractState, reason: felt252) -> bool {
            self._only_emergency_admin();
            self._check_daily_action_limit();
            
            let caller = get_caller_address();
            let timestamp = get_block_timestamp();
            
            self.is_emergency_paused.write(true);
            self.pause_timestamp.write(timestamp);
            self.pause_reason.write(reason);
            self.paused_by.write(caller);
            
            // Pause all systems
            self.payments_paused.write(true);
            self.subscriptions_paused.write(true);
            self.refunds_paused.write(true);
            self.gas_collection_paused.write(true);
            
            self._increment_daily_actions();
            
            self.emit(Event::EmergencyPauseActivated(EmergencyPauseActivated {
                paused_by: caller,
                reason,
                timestamp,
            }));
            
            true
        }

        fn emergency_unpause(ref self: ContractState) -> bool {
            self._only_emergency_admin();
            assert(self.is_emergency_paused.read(), 'Not paused');
            
            let caller = get_caller_address();
            let timestamp = get_block_timestamp();
            let pause_duration = timestamp - self.pause_timestamp.read();
            
            self.is_emergency_paused.write(false);
            self.pause_timestamp.write(0);
            self.pause_reason.write(0);
            self.paused_by.write(caller);
            
            // Resume all systems
            self.payments_paused.write(false);
            self.subscriptions_paused.write(false);
            self.refunds_paused.write(false);
            self.gas_collection_paused.write(false);
            
            self.emit(Event::EmergencyPauseDeactivated(EmergencyPauseDeactivated {
                unpaused_by: caller,
                pause_duration,
                timestamp,
            }));
            
            true
        }

        fn force_pause_payments(ref self: ContractState) -> bool {
            self._only_emergency_admin();
            self.payments_paused.write(true);
            
            self.emit(Event::SystemPaused(SystemPaused {
                system: 'payments',
                paused_by: get_caller_address(),
                timestamp: get_block_timestamp(),
            }));
            
            true
        }

        fn force_pause_subscriptions(ref self: ContractState) -> bool {
            self._only_emergency_admin();
            self.subscriptions_paused.write(true);
            
            self.emit(Event::SystemPaused(SystemPaused {
                system: 'subscriptions',
                paused_by: get_caller_address(),
                timestamp: get_block_timestamp(),
            }));
            
            true
        }

        fn force_pause_refunds(ref self: ContractState) -> bool {
            self._only_emergency_admin();
            self.refunds_paused.write(true);
            
            self.emit(Event::SystemPaused(SystemPaused {
                system: 'refunds',
                paused_by: get_caller_address(),
                timestamp: get_block_timestamp(),
            }));
            
            true
        }

        fn force_pause_gas_collection(ref self: ContractState) -> bool {
            self._only_emergency_admin();
            self.gas_collection_paused.write(true);
            
            self.emit(Event::SystemPaused(SystemPaused {
                system: 'gas_collection',
                paused_by: get_caller_address(),
                timestamp: get_block_timestamp(),
            }));
            
            true
        }

        fn is_emergency_paused(self: @ContractState) -> bool {
            self.is_emergency_paused.read()
        }

        fn are_payments_paused(self: @ContractState) -> bool {
            self.payments_paused.read()
        }

        fn are_subscriptions_paused(self: @ContractState) -> bool {
            self.subscriptions_paused.read()
        }

        fn are_refunds_paused(self: @ContractState) -> bool {
            self.refunds_paused.read()
        }

        fn is_gas_collection_paused(self: @ContractState) -> bool {
            self.gas_collection_paused.read()
        }

        fn get_pause_reason(self: @ContractState) -> felt252 {
            self.pause_reason.read()
        }

        fn get_pause_timestamp(self: @ContractState) -> u64 {
            self.pause_timestamp.read()
        }

        fn get_pause_duration(self: @ContractState) -> u64 {
            let pause_time = self.pause_timestamp.read();
            if pause_time == 0 {
                0
            } else {
                get_block_timestamp() - pause_time
            }
        }

        fn enable_recovery_mode(ref self: ContractState, reason: felt252) -> bool {
            assert(self.is_emergency_paused.read() || self.recovery_mode_active.read(), 'Emergency required');
            
            let caller = get_caller_address();
            let timestamp = get_block_timestamp();
            
            self.recovery_mode_active.write(true);
            self.recovery_reason.write(reason);
            self.recovery_activated_by.write(caller);
            self.recovery_activation_time.write(timestamp);
            
            self.emit(Event::RecoveryModeActivated(RecoveryModeActivated {
                activated_by: caller,
                reason,
                timestamp,
            }));
            
            true
        }

        fn disable_recovery_mode(ref self: ContractState) -> bool {
            self._only_owner();
            
            self.recovery_mode_active.write(false);
            self.recovery_reason.write(0);
            
            self.emit(Event::RecoveryModeDeactivated(RecoveryModeDeactivated {
                deactivated_by: get_caller_address(),
                timestamp: get_block_timestamp(),
            }));
            
            true
        }

        fn is_recovery_mode_active(self: @ContractState) -> bool {
            self.recovery_mode_active.read()
        }

        fn emergency_withdraw(ref self: ContractState, amount: u256, recipient: ContractAddress) -> bool {
            self._only_owner();
            
            // Emergency withdrawal logic would go here
            // This is a placeholder implementation
            
            self.emit(Event::EmergencyWithdrawal(EmergencyWithdrawal {
                amount,
                recipient,
                withdrawn_by: get_caller_address(),
                timestamp: get_block_timestamp(),
            }));
            
            true
        }

        fn emergency_transfer_ownership(ref self: ContractState, new_owner: ContractAddress) -> bool {
            let old_owner = self.owner.read();
            
            // Allow transfer if current owner or if in recovery mode
            let caller = get_caller_address();
            if caller != old_owner {
                assert(self.recovery_mode_active.read(), 'Recovery required');
                self._only_emergency_admin();
                
                // Add additional safeguards for emergency ownership transfer
                let recovery_time = self.recovery_activation_time.read();
                let current_time = get_block_timestamp();
                assert(current_time - recovery_time >= 86400, 'Wait 24h in recovery'); // 24 hour wait
            }
            
            self.owner.write(new_owner);
            
            // Add new owner as emergency admin
            if !self.is_emergency_admin.read(new_owner) {
                self.is_emergency_admin.write(new_owner, true);
                let count = self.emergency_admin_count.read();
                self.emergency_admin_count.write(count + 1);
            }
            
            self.emit(Event::OwnershipTransferred(OwnershipTransferred {
                old_owner,
                new_owner,
                transferred_by: caller,
                timestamp: get_block_timestamp(),
            }));
            
            true
        }

        fn add_emergency_admin(ref self: ContractState, admin: ContractAddress) -> bool {
            self._only_owner();
            
            if !self.is_emergency_admin.read(admin) {
                self.is_emergency_admin.write(admin, true);
                let count = self.emergency_admin_count.read();
                self.emergency_admin_count.write(count + 1);
                
                self.emit(Event::EmergencyAdminAdded(EmergencyAdminAdded {
                    admin,
                    added_by: get_caller_address(),
                    timestamp: get_block_timestamp(),
                }));
                
                true
            } else {
                false
            }
        }

        fn remove_emergency_admin(ref self: ContractState, admin: ContractAddress) -> bool {
            self._only_owner();
            
            if self.is_emergency_admin.read(admin) {
                self.is_emergency_admin.write(admin, false);
                let count = self.emergency_admin_count.read();
                if count > 0 {
                    self.emergency_admin_count.write(count - 1);
                }
                
                self.emit(Event::EmergencyAdminRemoved(EmergencyAdminRemoved {
                    admin,
                    removed_by: get_caller_address(),
                    timestamp: get_block_timestamp(),
                }));
                
                true
            } else {
                false
            }
        }

        fn is_emergency_admin(self: @ContractState, admin: ContractAddress) -> bool {
            self.is_emergency_admin.read(admin)
        }

        fn get_emergency_admin_count(self: @ContractState) -> u32 {
            self.emergency_admin_count.read()
        }

        fn set_owner(ref self: ContractState, new_owner: ContractAddress) {
            self._only_owner();
            self.owner.write(new_owner);
        }

        fn get_owner(self: @ContractState) -> ContractAddress {
            self.owner.read()
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _only_owner(self: @ContractState) {
            let caller = get_caller_address();
            let owner = self.owner.read();
            assert(caller == owner, 'Only owner');
        }

        fn _only_emergency_admin(self: @ContractState) {
            let caller = get_caller_address();
            assert(self.is_emergency_admin.read(caller), 'Only emergency admin');
        }

        fn _check_daily_action_limit(self: @ContractState) {
            let current_day = get_block_timestamp() / 86400; // Current day in epoch seconds
            let actions_today = self.daily_emergency_actions.read(current_day);
            let max_actions = self.max_daily_emergency_actions.read();
            assert(actions_today < max_actions, 'Daily limit exceeded');
        }

        fn _increment_daily_actions(ref self: ContractState) {
            let current_day = get_block_timestamp() / 86400;
            let actions_today = self.daily_emergency_actions.read(current_day);
            self.daily_emergency_actions.write(current_day, actions_today + 1);
        }
    }
} 