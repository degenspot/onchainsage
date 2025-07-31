use starknet::ContractAddress;
use dojo::model::ModelStorage;
use super::models::{PlatformMetrics, UserMetrics, MetricsSnapshot, LeaderboardEntry};

// Constants for analytics
const PLATFORM_METRICS_ID: u32 = 1; // Singleton ID for platform metrics
const SECONDS_IN_24H: u64 = 86400; // 24 hours in seconds
const MAX_LEADERBOARD_SIZE: u32 = 100; // Top 100 users

#[starknet::interface]
pub trait IAnalyticsSystem<T> {
    // Platform metrics functions
    fn get_platform_metrics(ref self: T) -> PlatformMetrics;
    fn update_platform_metrics(ref self: T, new_call: bool, is_successful: bool, strk_amount: u256);
    fn create_metrics_snapshot(ref self: T);
    
    // User metrics functions
    fn get_user_metrics(ref self: T, user_address: ContractAddress) -> UserMetrics;
    fn update_user_metrics(ref self: T, user_address: ContractAddress, is_successful: bool, strk_amount: u256);
    fn get_user_rank(ref self: T, user_address: ContractAddress) -> u32;
    
    // Leaderboard functions
    fn get_leaderboard_entry(ref self: T, rank: u32) -> LeaderboardEntry;
    fn update_leaderboard(ref self: T);
    fn get_top_users(ref self: T, limit: u32) -> Array<LeaderboardEntry>;
    
    // Analytics query functions
    fn get_active_users_count(ref self: T) -> u32;
    fn get_success_rate_trend(ref self: T, days: u32) -> Array<u8>;
    fn get_volume_trend(ref self: T, days: u32) -> Array<u256>;
    fn calculate_user_score(ref self: T, user_address: ContractAddress) -> u256;
}

#[dojo::contract]
pub mod analytics_system {
    use starknet::{ContractAddress, get_block_timestamp, contract_address_const};
    use dojo::model::ModelStorage;
    use super::{
        PlatformMetrics, UserMetrics, MetricsSnapshot, LeaderboardEntry, IAnalyticsSystem,
        PLATFORM_METRICS_ID, SECONDS_IN_24H, MAX_LEADERBOARD_SIZE
    };

    #[abi(embed_v0)]
    impl AnalyticsSystemImpl of IAnalyticsSystem<ContractState> {
        fn get_platform_metrics(ref self: ContractState) -> PlatformMetrics {
            let world = self.world(@"onchainsage");
            let metrics: PlatformMetrics = world.read_model(PLATFORM_METRICS_ID);
            
            // If metrics don't exist, initialize them
            if metrics.last_updated == 0 {
                self._initialize_platform_metrics()
            } else {
                metrics
            }
        }

        fn update_platform_metrics(ref self: ContractState, new_call: bool, is_successful: bool, strk_amount: u256) {
            let mut world = self.world(@"onchainsage");
            let mut metrics = self.get_platform_metrics();
            let current_time = get_block_timestamp();

            if new_call {
                metrics.total_trading_calls += 1;
            }

            // Update success percentage
            if metrics.total_trading_calls > 0 {
                let successful_calls = if is_successful {
                    (metrics.total_trading_calls * metrics.successful_calls_percentage.into() / 100) + 1
                } else {
                    metrics.total_trading_calls * metrics.successful_calls_percentage.into() / 100
                };
                
                metrics.successful_calls_percentage = ((successful_calls * 100) / metrics.total_trading_calls).try_into().unwrap();
            }

            metrics.total_strk_processed += strk_amount;
            metrics.last_updated = current_time;

            world.write_model(@metrics);
        }

        fn create_metrics_snapshot(ref self: ContractState) {
            let mut world = self.world(@"onchainsage");
            let metrics = self.get_platform_metrics();
            let current_time = get_block_timestamp();

            let snapshot = MetricsSnapshot {
                timestamp: current_time,
                total_users: metrics.total_users,
                active_users_24h: metrics.active_users_24h,
                total_trading_calls: metrics.total_trading_calls,
                successful_calls_percentage: metrics.successful_calls_percentage,
                total_strk_processed: metrics.total_strk_processed,
            };

            world.write_model(@snapshot);
        }

        fn get_user_metrics(ref self: ContractState, user_address: ContractAddress) -> UserMetrics {
            let world = self.world(@"onchainsage");
            let mut user_metrics: UserMetrics = world.read_model(user_address);
            
            // If user doesn't exist, initialize
            if user_metrics.join_date == 0 {
                user_metrics = UserMetrics {
                    user_address,
                    total_calls: 0,
                    successful_calls: 0,
                    accuracy_percentage: 0,
                    total_strk_paid: 0,
                    rank: 0,
                    last_active: get_block_timestamp(),
                    join_date: get_block_timestamp(),
                };
            }
            
            user_metrics
        }

        fn update_user_metrics(ref self: ContractState, user_address: ContractAddress, is_successful: bool, strk_amount: u256) {
            let mut world = self.world(@"onchainsage");
            let mut user_metrics = self.get_user_metrics(user_address);
            let current_time = get_block_timestamp();
            
            // Check if this is a new user
            let is_new_user = user_metrics.total_calls == 0;
            
            user_metrics.total_calls += 1;
            if is_successful {
                user_metrics.successful_calls += 1;
            }
            
            // Update accuracy percentage
            if user_metrics.total_calls > 0 {
                user_metrics.accuracy_percentage = ((user_metrics.successful_calls * 100) / user_metrics.total_calls).try_into().unwrap();
            }
            
            user_metrics.total_strk_paid += strk_amount;
            user_metrics.last_active = current_time;
            
            world.write_model(@user_metrics);
            
            // Update platform metrics if new user
            if is_new_user {
                let mut platform_metrics = self.get_platform_metrics();
                platform_metrics.total_users += 1;
                world.write_model(@platform_metrics);
            }
            
            // Update active users count
            self._update_active_users_count();
        }

        fn get_user_rank(ref self: ContractState, user_address: ContractAddress) -> u32 {
            let user_metrics = self.get_user_metrics(user_address);
            user_metrics.rank
        }

        fn get_leaderboard_entry(ref self: ContractState, rank: u32) -> LeaderboardEntry {
            let world = self.world(@"onchainsage");
            let entry: LeaderboardEntry = world.read_model(rank);
            entry
        }

        fn update_leaderboard(ref self: ContractState) {
            // This is a simplified implementation
            // In a real system, you'd need to sort all users by their scores
            // For now, we'll implement a basic version that updates existing entries
            let mut world = self.world(@"onchainsage");
            
            // This would typically involve:
            // 1. Getting all users
            // 2. Calculating their scores
            // 3. Sorting by score
            // 4. Updating leaderboard entries
            // 
            // For simplicity, we'll just ensure the current implementation works
        }

        fn get_top_users(ref self: ContractState, limit: u32) -> Array<LeaderboardEntry> {
            let mut result = ArrayTrait::new();
            let actual_limit = if limit > MAX_LEADERBOARD_SIZE { MAX_LEADERBOARD_SIZE } else { limit };
            
            let mut i = 1_u32;
            loop {
                if i > actual_limit {
                    break;
                }
                
                let entry = self.get_leaderboard_entry(i);
                if entry.user_address.is_zero() {
                    break;
                }
                
                result.append(entry);
                i += 1;
            };
            
            result
        }

        fn get_active_users_count(ref self: ContractState) -> u32 {
            let metrics = self.get_platform_metrics();
            metrics.active_users_24h
        }

        fn get_success_rate_trend(ref self: ContractState, days: u32) -> Array<u8> {
            let mut result = ArrayTrait::new();
            let world = self.world(@"onchainsage");
            let current_time = get_block_timestamp();
            
            let mut day = 0_u32;
            loop {
                if day >= days {
                    break;
                }
                
                let snapshot_time = current_time - (day.into() * SECONDS_IN_24H);
                let snapshot: MetricsSnapshot = world.read_model(snapshot_time);
                
                if snapshot.timestamp > 0 {
                    result.append(snapshot.successful_calls_percentage);
                } else {
                    result.append(0_u8); // No data available
                }
                
                day += 1;
            };
            
            result
        }

        fn get_volume_trend(ref self: ContractState, days: u32) -> Array<u256> {
            let mut result = ArrayTrait::new();
            let world = self.world(@"onchainsage");
            let current_time = get_block_timestamp();
            
            let mut day = 0_u32;
            loop {
                if day >= days {
                    break;
                }
                
                let snapshot_time = current_time - (day.into() * SECONDS_IN_24H);
                let snapshot: MetricsSnapshot = world.read_model(snapshot_time);
                
                if snapshot.timestamp > 0 {
                    result.append(snapshot.total_strk_processed);
                } else {
                    result.append(0_u256); // No data available
                }
                
                day += 1;
            };
            
            result
        }

        fn calculate_user_score(ref self: ContractState, user_address: ContractAddress) -> u256 {
            let user_metrics = self.get_user_metrics(user_address);
            
            // Score calculation: (successful_calls * 100) + (accuracy_percentage * total_calls) + (total_strk_paid / 1000)
            let base_score = user_metrics.successful_calls.into() * 100_u256;
            let accuracy_bonus = user_metrics.accuracy_percentage.into() * user_metrics.total_calls.into();
            let volume_bonus = user_metrics.total_strk_paid / 1000_u256;
            
            base_score + accuracy_bonus + volume_bonus
        }
    }

    #[generate_trait]
    impl InternalAnalyticsFunctions of InternalAnalyticsFunctionsTrait {
        fn _initialize_platform_metrics(ref self: ContractState) -> PlatformMetrics {
            let mut world = self.world(@"onchainsage");
            let current_time = get_block_timestamp();
            
            let metrics = PlatformMetrics {
                id: PLATFORM_METRICS_ID,
                total_users: 0,
                active_users_24h: 0,
                total_trading_calls: 0,
                successful_calls_percentage: 0,
                total_strk_processed: 0,
                last_updated: current_time,
            };
            
            world.write_model(@metrics);
            metrics
        }

        fn _update_active_users_count(ref self: ContractState) {
            let mut world = self.world(@"onchainsage");
            let mut platform_metrics = self.get_platform_metrics();
            let current_time = get_block_timestamp();
            let cutoff_time = current_time - SECONDS_IN_24H;
            
            // This is a simplified implementation
            // In a real system, you'd need to query all users and count active ones
            // For now, we'll increment if it's a recent update
            if platform_metrics.last_updated >= cutoff_time {
                platform_metrics.active_users_24h += 1;
            }
            
            platform_metrics.last_updated = current_time;
            world.write_model(@platform_metrics);
        }
    }
}
