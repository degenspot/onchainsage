use dojo::event::EventStorage;
use dojo::model::{ModelStorage, ModelValueStorage};
use dojo::world::{WorldStorage, WorldStorageTrait};
use starknet::{ContractAddress, get_caller_address};
use super::models::{Direction, Moves, Position, Vec2, EmergencyState};

// Events
#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct Moved {
    #[key]
    pub player: ContractAddress,
    pub direction: Direction,
}

#[starknet::interface]
pub trait IActions<T> {
    fn global_pause(ref self: T, reason: felt252, by: felt252);
    fn global_unpause(ref self: T, by: felt252);
    fn spawn(ref self: T);
fn move(ref self: T, direction: Direction);
    fn check_emergency_state(ref self: T) -> bool;
}

#[dojo::contract]
pub mod actions {
    use starknet::{ContractAddress, get_caller_address};
    use super::{
        Direction, EventStorage, IActions, ModelStorage, Moved, Moves, Position, Vec2, EmergencyState, WorldStorage,
        WorldStorageTrait,
    };

    #[abi(embed_v0)]
impl ActionsImpl of IActions 3cContractState 3e {
    fn global_pause(ref self: ContractState, reason: felt252, by: felt252) {
        let mut world = self.world(@"onchainsage");
        let emergency_state = EmergencyState {
            is_paused: true,
            pause_reason: reason,
            paused_by: by,
            pause_timestamp: starknet::get_block_timestamp(),
            affected_functions: 0,
        };
        world.write_model(@emergency_state);
    }

    fn global_unpause(ref self: ContractState, by: felt252) {
        let mut world = self.world(@"onchainsage");
        let mut emergency_state: EmergencyState = world.read_model(by);
        emergency_state.is_paused = false;
        emergency_state.paused_by = by;
        emergency_state.pause_timestamp = starknet::get_block_timestamp();
        world.write_model(@emergency_state);
    }

    fn check_emergency_state(ref self: ContractState) -> bool {
        let mut world = self.world(@"onchainsage");
        let emergency_state: EmergencyState = world.read_model(starknet::get_caller_address());
        emergency_state.is_paused
    }
        fn spawn(ref self: ContractState) {
            let mut world = self.world(@"onchainsage");
            let player = get_caller_address();

            let position = Position { player, vec: Vec2 { x: 10, y: 10 } };

            let moves = Moves { player, remaining: 10, last_direction: Option::None };

            world.write_model(@position);
            world.write_model(@moves);
        }

        fn move(ref self: ContractState, direction: Direction) {
            let mut world = self.world(@"onchainsage");
            let player = get_caller_address();

            let mut position: Position = world.read_model(player);
            let mut moves: Moves = world.read_model(player);

            assert!(moves.remaining > 0, "No moves remaining");

            moves.remaining -= 1;
            moves.last_direction = Option::Some(direction);

            match direction {
                Direction::None => {},
                Direction::Left => { position.vec.x -= 1; },
                Direction::Right => { position.vec.x += 1; },
                Direction::Up => { position.vec.y -= 1; },
                Direction::Down => { position.vec.y += 1; },
            }

            world.write_model(@position);
            world.write_model(@moves);

            world.emit_event(@Moved { player, direction });
        }
    }
}
