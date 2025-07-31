#[cfg(test)]
mod tests {
    use dojo::model::{ModelStorage, ModelStorageTest};
    use dojo::world::WorldStorageTrait;
    use dojo_cairo_test::{
        ContractDef, ContractDefTrait, NamespaceDef, TestResource, WorldStorageTestTrait,
        spawn_test_world,
    };
    use dojo_starter::models::{Direction, Moves, Position, EmergencyState, PlatformMetrics, UserMetrics, MetricsSnapshot, LeaderboardEntry, m_Moves, m_Position, m_EmergencyState, m_PlatformMetrics, m_UserMetrics, m_MetricsSnapshot, m_LeaderboardEntry};
    use dojo_starter::systems::actions::{IActionsDispatcher, IActionsDispatcherTrait, actions};
    use dojo_starter::analytics_system::{IAnalyticsSystemDispatcher, IAnalyticsSystemDispatcherTrait, analytics_system};

    fn namespace_def() -> NamespaceDef {
        let ndef = NamespaceDef {
            namespace: "dojo_starter",
            resources: [
                TestResource::Model(m_Position::TEST_CLASS_HASH),
                TestResource::Model(m_Moves::TEST_CLASS_HASH),
                TestResource::Model(m_EmergencyState::TEST_CLASS_HASH),
                TestResource::Model(m_PlatformMetrics::TEST_CLASS_HASH),
                TestResource::Model(m_UserMetrics::TEST_CLASS_HASH),
                TestResource::Model(m_MetricsSnapshot::TEST_CLASS_HASH),
                TestResource::Model(m_LeaderboardEntry::TEST_CLASS_HASH),
                TestResource::Event(actions::e_Moved::TEST_CLASS_HASH),
                TestResource::Contract(actions::TEST_CLASS_HASH),
                TestResource::Contract(analytics_system::TEST_CLASS_HASH),
            ]
                .span(),
        };

        ndef
    }

    fn contract_defs() -> Span<ContractDef> {
        [
            ContractDefTrait::new(@"dojo_starter", @"actions")
                .with_writer_of([dojo::utils::bytearray_hash(@"dojo_starter")].span()),
            ContractDefTrait::new(@"dojo_starter", @"analytics_system")
                .with_writer_of([dojo::utils::bytearray_hash(@"dojo_starter")].span())
        ]
            .span()
    }

    #[test]
    fn test_world_test_set() {
        // Initialize test environment
        let caller = starknet::contract_address_const::<0x0>();
        let ndef = namespace_def();

        // Register the resources.
        let mut world = spawn_test_world([ndef].span());

        // Ensures permissions and initializations are synced.
        world.sync_perms_and_inits(contract_defs());

        // Test initial position
        let mut position: Position = world.read_model(caller);
        assert(position.vec.x == 0 && position.vec.y == 0, 'initial position wrong');

        // Test write_model_test
        position.vec.x = 122;
        position.vec.y = 88;

        world.write_model_test(@position);

        let mut position: Position = world.read_model(caller);
        assert(position.vec.y == 88, 'write_value_from_id failed');

        // Test model deletion
        world.erase_model(@position);
        let position: Position = world.read_model(caller);
        assert(position.vec.x == 0 && position.vec.y == 0, 'erase_model failed');
    }

    #[test]
    #[available_gas(30000000)]
    fn test_move() {
        let caller = starknet::contract_address_const::<0x0>();

        let ndef = namespace_def();
        let mut world = spawn_test_world([ndef].span());
        world.sync_perms_and_inits(contract_defs());

        let (contract_address, _) = world.dns(@"actions").unwrap();
        let actions_system = IActionsDispatcher { contract_address };

        actions_system.spawn();
        let initial_moves: Moves = world.read_model(caller);
        let initial_position: Position = world.read_model(caller);

        assert(
            initial_position.vec.x == 10 && initial_position.vec.y == 10, 'wrong initial position',
        );

        actions_system.move(Direction::Right(()).into());

        let moves: Moves = world.read_model(caller);
        let right_dir_felt: felt252 = Direction::Right(()).into();

        assert(moves.remaining == initial_moves.remaining - 1, 'moves is wrong');
        assert(moves.last_direction.unwrap().into() == right_dir_felt, 'last direction is wrong');

        let new_position: Position = world.read_model(caller);
        assert(new_position.vec.x == initial_position.vec.x + 1, 'position x is wrong');
        assert(new_position.vec.y == initial_position.vec.y, 'position y is wrong');
    }

    #[test]
    #[available_gas(50000000)]
    fn test_emergency_controls() {
        let caller = starknet::contract_address_const::<0x123>();
        let admin = starknet::contract_address_const::<0x456>();

        let ndef = namespace_def();
        let mut world = spawn_test_world([ndef].span());
        world.sync_perms_and_inits(contract_defs());

        let (contract_address, _) = world.dns(@"actions").unwrap();
        let actions_system = IActionsDispatcher { contract_address };

        // Test initial emergency state (should not be paused)
        let initial_emergency_state = actions_system.check_emergency_state();
        assert(initial_emergency_state == false, 'initial state should not be paused');

        // Test global pause
        let pause_reason = 'SECURITY_BREACH';
        actions_system.global_pause(pause_reason, admin.into());
        
        // Check if system is now paused
        let paused_state = actions_system.check_emergency_state();
        assert(paused_state == true, 'system should be paused');

        // Test global unpause
        actions_system.global_unpause(admin.into());
        
        // Check if system is now unpaused
        let unpaused_state = actions_system.check_emergency_state();
        assert(unpaused_state == false, 'system should be unpaused');
    }

    #[test]
    #[available_gas(50000000)]
    fn test_analytics_system() {
        let user1 = starknet::contract_address_const::[0;0m0x111[0;0m[0;0m();
        let user2 = starknet::contract_address_const::[0;0m0x222[0;0m[0;0m();

        let ndef = namespace_def();
        let mut world = spawn_test_world([ndef].span());
        world.sync_perms_and_inits(contract_defs());

        let (contract_address, _) = world.dns(@"analytics_system").unwrap();
        let analytics_system = IAnalyticsSystemDispatcher { contract_address };

        // Update user metrics for user1
        analytics_system.update_user_metrics(user1, true, 150_u256.into());
        let user1_metrics = analytics_system.get_user_metrics(user1);
        assert(user1_metrics.total_calls == 1, 'user1 calls should be 1');
        assert(user1_metrics.successful_calls == 1, 'user1 successful calls should be 1');

        // Update user metrics for user2
        analytics_system.update_user_metrics(user2, false, 100_u256.into());
        let user2_metrics = analytics_system.get_user_metrics(user2);
        assert(user2_metrics.total_calls == 1, 'user2 calls should be 1');
        assert(user2_metrics.successful_calls == 0, 'user2 successful calls should be 0');

        // Update platform metrics
        analytics_system.update_platform_metrics(true, true, 250_u256.into());
        let platform_metrics = analytics_system.get_platform_metrics();
        assert(platform_metrics.total_users == 2, 'total users should be 2');
        assert(platform_metrics.total_trading_calls == 1, 'total trading calls should be 1');

        // Test creating a snapshot
        analytics_system.create_metrics_snapshot();

        // Check active users count
        let active_users = analytics_system.get_active_users_count();
        assert(active_users [0;0m>=[0;0m 1, 'active users should be at least 1');
    }
}
