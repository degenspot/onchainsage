use starknet::ContractAddress;
use dojo::model::Model; // Required for u256 type

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Moves {
    #[key]
    pub player: ContractAddress,
    pub remaining: u8,
    pub last_direction: Option<Direction>,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Position {
    #[key]
    pub player: ContractAddress,
    pub vec: Vec2,
}

#[derive(Copy, Drop, Serde, Introspect)]
pub struct Vec2 {
    pub x: u32,
    pub y: u32,
}

#[derive(Serde, Copy, Drop, Introspect, PartialEq)]
pub enum Direction {
    None,
    Left,
    Right,
    Up,
    Down,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Reputation {
    #[key]
    pub user_address: ContractAddress,
    pub current_score: u256,
    pub total_calls: u32,
    pub successful_calls: u32,
    pub accuracy_percentage: u8,
    pub last_updated: u64, // Timestamp of the last update
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct ReputationHistory {
    #[key]
    pub user_address: ContractAddress,
    #[key]
    pub timestamp: u64, // Timestamp of the snapshot
    pub score_snapshot: u256,
    pub total_calls_snapshot: u32,
    pub successful_calls_snapshot: u32,
    pub accuracy_percentage_snapshot: u8,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct EmergencyState {
    #[key]
    pub is_paused: bool,
    pub pause_reason: felt252,
    pub paused_by: felt252,
    pub pause_timestamp: u64,
    pub affected_functions: u256, // Bitmask
}

impl DirectionIntoFelt252 of Into<Direction, felt252> {
    fn into(self: Direction) -> felt252 {
        match self {
            Direction::None => 0,
            Direction::Left => 1,
            Direction::Right => 2,
            Direction::Up => 3,
            Direction::Down => 4,
        }
    }
}
