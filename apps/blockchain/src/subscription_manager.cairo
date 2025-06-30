use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
use starknet::storage::{
    Map, StorageMapReadAccess, StorageMapWriteAccess,
    StoragePointerReadAccess, StoragePointerWriteAccess
};
use crate::payment_models::{
    Subscription, SubscriptionPlan, SubscriptionStatus,
    SubscriptionCreated
};

#[starknet::interface]
pub trait ISubscriptionManager<TContractState> {
    fn create_subscription_plan(
        ref self: TContractState,
        name: felt252,
        price: u256,
        duration: u64,
        max_users: u32,
        features_hash: felt252
    ) -> u256;
    
    fn update_subscription_plan(
        ref self: TContractState,
        plan_id: u256,
        price: u256,
        duration: u64,
        max_users: u32,
        is_active: bool
    ) -> bool;
    
    fn subscribe(
        ref self: TContractState,
        plan_id: u256,
        auto_renew: bool
    ) -> u256;
    
    fn renew_subscription(ref self: TContractState, subscription_id: u256) -> bool;
    fn cancel_subscription(ref self: TContractState, subscription_id: u256) -> bool;
    fn pause_subscription(ref self: TContractState, subscription_id: u256) -> bool;
    fn resume_subscription(ref self: TContractState, subscription_id: u256) -> bool;
    
    fn process_subscription_payment(
        ref self: TContractState,
        subscription_id: u256,
        amount: u256
    ) -> bool;
    
    fn get_subscription(self: @TContractState, subscription_id: u256) -> Subscription;
    fn get_subscription_plan(self: @TContractState, plan_id: u256) -> SubscriptionPlan;
    fn get_user_subscription_count(self: @TContractState, user: ContractAddress) -> u32;
    fn is_subscription_active(self: @TContractState, subscription_id: u256) -> bool;
    fn get_subscription_expiry(self: @TContractState, subscription_id: u256) -> u64;
    
    // Admin functions
    fn set_admin(ref self: TContractState, admin: ContractAddress);
    fn get_admin(self: @TContractState) -> ContractAddress;
}

#[starknet::contract]
pub mod SubscriptionManager {
    use super::*;

    #[storage]
    struct Storage {
        admin: ContractAddress,
        next_plan_id: u256,
        next_subscription_id: u256,
        subscription_plans: Map<u256, SubscriptionPlan>,
        subscriptions: Map<u256, Subscription>,
        user_subscription_count: Map<ContractAddress, u32>, // simplified tracking
        plan_subscriber_count: Map<u256, u32>,
        subscription_payment_count: Map<u256, u32>, // subscription_id -> payment_count
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        SubscriptionPlanCreated: SubscriptionPlanCreated,
        SubscriptionPlanUpdated: SubscriptionPlanUpdated,
        SubscriptionCreated: SubscriptionCreated,
        SubscriptionRenewed: SubscriptionRenewed,
        SubscriptionCancelled: SubscriptionCancelled,
        SubscriptionPaused: SubscriptionPaused,
        SubscriptionResumed: SubscriptionResumed,
        SubscriptionPaymentProcessed: SubscriptionPaymentProcessed,
    }

    #[derive(Drop, starknet::Event)]
    pub struct SubscriptionPlanCreated {
        pub plan_id: u256,
        pub name: felt252,
        pub price: u256,
        pub duration: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct SubscriptionPlanUpdated {
        pub plan_id: u256,
        pub price: u256,
        pub is_active: bool,
    }

    #[derive(Drop, starknet::Event)]
    pub struct SubscriptionRenewed {
        pub subscription_id: u256,
        pub subscriber: ContractAddress,
        pub new_end_time: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct SubscriptionCancelled {
        pub subscription_id: u256,
        pub subscriber: ContractAddress,
        pub cancelled_at: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct SubscriptionPaused {
        pub subscription_id: u256,
        pub subscriber: ContractAddress,
        pub paused_at: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct SubscriptionResumed {
        pub subscription_id: u256,
        pub subscriber: ContractAddress,
        pub resumed_at: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct SubscriptionPaymentProcessed {
        pub subscription_id: u256,
        pub payment_id: u256,
        pub amount: u256,
        pub timestamp: u64,
    }

    #[constructor]
    fn constructor(ref self: ContractState, admin: ContractAddress) {
        self.admin.write(admin);
        self.next_plan_id.write(1);
        self.next_subscription_id.write(1);
    }

    #[abi(embed_v0)]
    impl SubscriptionManagerImpl of super::ISubscriptionManager<ContractState> {
        fn create_subscription_plan(
            ref self: ContractState,
            name: felt252,
            price: u256,
            duration: u64,
            max_users: u32,
            features_hash: felt252
        ) -> u256 {
            self._only_admin();
            
            let plan_id = self.next_plan_id.read();
            let plan = SubscriptionPlan {
                id: plan_id,
                name,
                price,
                duration,
                max_users,
                features_hash,
                is_active: true,
            };
            
            self.subscription_plans.write(plan_id, plan);
            self.next_plan_id.write(plan_id + 1);
            
            self.emit(Event::SubscriptionPlanCreated(SubscriptionPlanCreated {
                plan_id,
                name,
                price,
                duration,
            }));
            
            plan_id
        }

        fn update_subscription_plan(
            ref self: ContractState,
            plan_id: u256,
            price: u256,
            duration: u64,
            max_users: u32,
            is_active: bool
        ) -> bool {
            self._only_admin();
            
            let mut plan = self.subscription_plans.read(plan_id);
            assert(plan.id != 0, 'Plan not found');
            
            plan.price = price;
            plan.duration = duration;
            plan.max_users = max_users;
            plan.is_active = is_active;
            
            self.subscription_plans.write(plan_id, plan);
            
            self.emit(Event::SubscriptionPlanUpdated(SubscriptionPlanUpdated {
                plan_id,
                price,
                is_active,
            }));
            
            true
        }

        fn subscribe(
            ref self: ContractState,
            plan_id: u256,
            auto_renew: bool
        ) -> u256 {
            let subscriber = get_caller_address();
            let plan = self.subscription_plans.read(plan_id);
            assert(plan.id != 0, 'Plan not found');
            assert(plan.is_active, 'Plan not active');
            
            let subscription_id = self.next_subscription_id.read();
            let start_time = get_block_timestamp();
            let end_time = start_time + plan.duration;
            
            let subscription = Subscription {
                id: subscription_id,
                subscriber,
                plan_id,
                status: SubscriptionStatus::Active,
                start_time,
                end_time,
                last_payment_time: start_time,
                total_paid: 0_u256,
                auto_renew,
            };
            
            self.subscriptions.write(subscription_id, subscription);
            self.next_subscription_id.write(subscription_id + 1);
            
            // Update counters
            let user_count = self.user_subscription_count.read(subscriber);
            self.user_subscription_count.write(subscriber, user_count + 1);
            
            let plan_count = self.plan_subscriber_count.read(plan_id);
            self.plan_subscriber_count.write(plan_id, plan_count + 1);
            
            self.emit(Event::SubscriptionCreated(SubscriptionCreated {
                subscription_id,
                subscriber,
                plan_id,
                start_time,
            }));
            
            subscription_id
        }

        fn renew_subscription(ref self: ContractState, subscription_id: u256) -> bool {
            let mut subscription = self.subscriptions.read(subscription_id);
            assert(subscription.id != 0, 'Subscription not found');
            assert(subscription.status == SubscriptionStatus::Active, 'Not active');
            
            let plan = self.subscription_plans.read(subscription.plan_id);
            let current_time = get_block_timestamp();
            
            subscription.end_time = current_time + plan.duration;
            subscription.last_payment_time = current_time;
            self.subscriptions.write(subscription_id, subscription);
            
            self.emit(Event::SubscriptionRenewed(SubscriptionRenewed {
                subscription_id,
                subscriber: subscription.subscriber,
                new_end_time: subscription.end_time,
            }));
            
            true
        }

        fn cancel_subscription(ref self: ContractState, subscription_id: u256) -> bool {
            let mut subscription = self.subscriptions.read(subscription_id);
            assert(subscription.id != 0, 'Subscription not found');
            
            let caller = get_caller_address();
            assert(caller == subscription.subscriber, 'Not subscriber');
            
            subscription.status = SubscriptionStatus::Cancelled;
            self.subscriptions.write(subscription_id, subscription);
            
            self.emit(Event::SubscriptionCancelled(SubscriptionCancelled {
                subscription_id,
                subscriber: subscription.subscriber,
                cancelled_at: get_block_timestamp(),
            }));
            
            true
        }

        fn pause_subscription(ref self: ContractState, subscription_id: u256) -> bool {
            let mut subscription = self.subscriptions.read(subscription_id);
            assert(subscription.id != 0, 'Subscription not found');
            assert(subscription.status == SubscriptionStatus::Active, 'Not active');
            
            let caller = get_caller_address();
            assert(caller == subscription.subscriber, 'Not subscriber');
            
            subscription.status = SubscriptionStatus::Paused;
            self.subscriptions.write(subscription_id, subscription);
            
            self.emit(Event::SubscriptionPaused(SubscriptionPaused {
                subscription_id,
                subscriber: subscription.subscriber,
                paused_at: get_block_timestamp(),
            }));
            
            true
        }

        fn resume_subscription(ref self: ContractState, subscription_id: u256) -> bool {
            let mut subscription = self.subscriptions.read(subscription_id);
            assert(subscription.id != 0, 'Subscription not found');
            assert(subscription.status == SubscriptionStatus::Paused, 'Not paused');
            
            let caller = get_caller_address();
            assert(caller == subscription.subscriber, 'Not subscriber');
            
            subscription.status = SubscriptionStatus::Active;
            self.subscriptions.write(subscription_id, subscription);
            
            self.emit(Event::SubscriptionResumed(SubscriptionResumed {
                subscription_id,
                subscriber: subscription.subscriber,
                resumed_at: get_block_timestamp(),
            }));
            
            true
        }

        fn process_subscription_payment(
            ref self: ContractState,
            subscription_id: u256,
            amount: u256
        ) -> bool {
            let mut subscription = self.subscriptions.read(subscription_id);
            assert(subscription.id != 0, 'Subscription not found');
            
            subscription.total_paid += amount;
            subscription.last_payment_time = get_block_timestamp();
            self.subscriptions.write(subscription_id, subscription);
            
            // Update payment count - ensure we're using the correct type
            let current_count = self.subscription_payment_count.read(subscription_id);
            self.subscription_payment_count.write(subscription_id, current_count + 1);
            
            self.emit(Event::SubscriptionPaymentProcessed(SubscriptionPaymentProcessed {
                subscription_id,
                payment_id: (current_count + 1).into(), // Convert u32 to u256
                amount,
                timestamp: get_block_timestamp(),
            }));
            
            true
        }

        fn get_subscription(self: @ContractState, subscription_id: u256) -> Subscription {
            let subscription = self.subscriptions.read(subscription_id);
            assert(subscription.id != 0, 'Subscription not found');
            subscription
        }

        fn get_subscription_plan(self: @ContractState, plan_id: u256) -> SubscriptionPlan {
            let plan = self.subscription_plans.read(plan_id);
            assert(plan.id != 0, 'Plan not found');
            plan
        }

        fn get_user_subscription_count(self: @ContractState, user: ContractAddress) -> u32 {
            self.user_subscription_count.read(user)
        }

        fn is_subscription_active(self: @ContractState, subscription_id: u256) -> bool {
            let subscription = self.subscriptions.read(subscription_id);
            if subscription.id == 0 {
                return false;
            }
            
            subscription.status == SubscriptionStatus::Active && 
            get_block_timestamp() <= subscription.end_time
        }

        fn get_subscription_expiry(self: @ContractState, subscription_id: u256) -> u64 {
            let subscription = self.subscriptions.read(subscription_id);
            assert(subscription.id != 0, 'Subscription not found');
            subscription.end_time
        }

        fn set_admin(ref self: ContractState, admin: ContractAddress) {
            self._only_admin();
            self.admin.write(admin);
        }

        fn get_admin(self: @ContractState) -> ContractAddress {
            self.admin.read()
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