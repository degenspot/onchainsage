use starknet::ContractAddress;
use dojo::model::ModelStorage;
use super::models::{Reputation, ReputationHistory};

// --- Constants for reputation logic ---
// Points and Penalties
const POINTS_PER_SUCCESSFUL_CALL: u32 = 10;
const PENALTY_PER_FAILED_CALL: u32 = 5;
const INITIAL_SCORE_NUMERATOR: u256 = 100;
const INITIAL_SCORE_DENOMINATOR: u256 = 1;


// Decay
const DECAY_PERIOD: u64 = 604800; // 7 days in seconds (7 * 24 * 60 * 60)
const DECAY_PERCENTAGE: u8 = 5; // Decay 5%

// Boost
const BOOST_THRESHOLD_SUCCESSFUL_CALLS: u32 = 50;
const BOOST_THRESHOLD_ACCURACY: u8 = 80; // 80%
const BOOST_AMOUNT_PERCENTAGE: u8 = 10; // Boost 10%


#[starknet::interface]
pub trait IReputationSystem<T> {
    // Called by other systems to record a user's action
    fn record_action(ref self: T, user_address: ContractAddress, is_successful: bool);
    // Retrieves the current reputation for a user
    fn get_reputation(ref self: T, user_address: ContractAddress) -> Reputation;
    // Checks if a user has sufficient reputation
    fn has_sufficient_reputation(
        ref self: T, user_address: ContractAddress, required_score: u256
    ) -> bool;
    fn _get_or_init_reputation(
        ref self: T, user_address: ContractAddress
    ) -> Reputation;
}

#[dojo::contract]
pub mod reputation_system {
    use starknet::{ContractAddress, get_block_timestamp, contract_address_const};
    use dojo::model::ModelStorage;
    use super::{
        Reputation, ReputationHistory, IReputationSystem, POINTS_PER_SUCCESSFUL_CALL,
        PENALTY_PER_FAILED_CALL, INITIAL_SCORE_NUMERATOR, INITIAL_SCORE_DENOMINATOR, DECAY_PERIOD, DECAY_PERCENTAGE,
        BOOST_THRESHOLD_SUCCESSFUL_CALLS, BOOST_THRESHOLD_ACCURACY, BOOST_AMOUNT_PERCENTAGE
    };


    #[abi(embed_v0)]
    impl ReputationSystemImpl of IReputationSystem<ContractState> {
        fn record_action(ref self: ContractState, user_address: ContractAddress, is_successful: bool) {
            let mut world = self.world(@"onchainsage");
            let mut reputation = self._get_or_init_reputation(user_address);
            let current_timestamp = get_block_timestamp();

            // Apply decay before updating metrics if significant time has passed
            self._apply_reputation_decay(ref reputation, current_timestamp);

            reputation.total_calls += 1;
            if is_successful {
                reputation.successful_calls += 1;
            }

            self._recalculate_score_and_accuracy(ref reputation);
            self._apply_reputation_boost(ref reputation);

            reputation.last_updated = current_timestamp;
            self._create_reputation_snapshot(reputation);

            world.write_model(@reputation);
        }

        fn get_reputation(ref self: ContractState, user_address: ContractAddress) -> Reputation {
            let mut reputation = self._get_or_init_reputation(user_address);
            let current_timestamp = get_block_timestamp();
            
            // Apply decay if needed before returning, to reflect current state
            // This makes get_reputation potentially a write operation if decay occurs.
            // Consider if this is desired, or if decay is only applied on record_action.
            // For consistency, let's make it apply decay.
            self._apply_reputation_decay(ref reputation, current_timestamp);
            
            // If decay happened, the model needs to be saved.
            if reputation.last_updated < current_timestamp { // A bit of a heuristic
                 reputation.last_updated = current_timestamp;
                 let mut world = self.world(@"onchainsage");
                world.write_model(@reputation);
            }
            reputation
        }

        fn has_sufficient_reputation(
            ref self: ContractState, user_address: ContractAddress, required_score: u256
        ) -> bool {
            let reputation = self.get_reputation(user_address);
            reputation.current_score >= required_score
        }

        fn _get_or_init_reputation(
            ref self: ContractState, user_address: ContractAddress
        ) -> Reputation {
            let mut world = self.world(@"onchainsage");
            let mut reputation: Reputation = world.read_model(user_address);
            let zero_address = contract_address_const::<0x0>();

            if reputation.user_address == zero_address { // Assuming default/uninitialized address is zero
                // Initialize new user
                reputation = Reputation {
                    user_address,
                    current_score: INITIAL_SCORE_NUMERATOR / INITIAL_SCORE_DENOMINATOR,
                    total_calls: 0,
                    successful_calls: 0,
                    accuracy_percentage: 0,
                    last_updated: get_block_timestamp(),
                };
                world.write_model(@reputation);
            }
            reputation
        }
    }

    #[generate_trait]
    impl InternalFunctions of InternalFunctionsTrait {

        fn _recalculate_score_and_accuracy(ref self: ContractState, ref reputation: Reputation) {
            if reputation.total_calls == 0 {
                reputation.accuracy_percentage = 0;
                // Keep initial score or set to a base if total_calls is 0 after some actions (should not happen if init is correct)
            } else {
                reputation.accuracy_percentage = ((reputation.successful_calls * 100_u32) / reputation.total_calls)
                    .try_into()
                    .unwrap(); // u32 to u8, should be safe if 100 is max
            }

            let successful_score_part = reputation.successful_calls.into() * POINTS_PER_SUCCESSFUL_CALL.into();
            let failed_calls = reputation.total_calls - reputation.successful_calls;
            let penalty_part = failed_calls.into() * PENALTY_PER_FAILED_CALL.into();
            
            let mut new_score = 0; // Base score, can be initial score
            if successful_score_part >= penalty_part {
                new_score = successful_score_part - penalty_part;
            }

            // Add a base initial score to prevent starting from 0 immediately
            let initial_score_val = INITIAL_SCORE_NUMERATOR / INITIAL_SCORE_DENOMINATOR;
            reputation.current_score = new_score - initial_score_val;
        }

        fn _apply_reputation_decay(
            ref self: ContractState, ref reputation: Reputation, current_timestamp: u64
        ) {
            if reputation.last_updated == 0 { // Avoid decay on uninitialized record
                return;
            }
            let time_elapsed = current_timestamp - reputation.last_updated;
            if time_elapsed >= DECAY_PERIOD {
                let num_decay_periods = time_elapsed / DECAY_PERIOD;

                // Apply decay iteratively for each period.
                // This is a simplification; a more accurate formula might be needed for multiple periods.
                // For simplicity, apply decay percentage once if any decay period has passed.
                // A loop for num_decay_periods could be gas intensive.
                if num_decay_periods > 0 {
                     let decay_amount_numerator = reputation.current_score * DECAY_PERCENTAGE.into();
                     let decay_amount = decay_amount_numerator / 100.into();
                     
                     if reputation.current_score >= decay_amount {
                        reputation.current_score = reputation.current_score - decay_amount;
                     } else {
                        reputation.current_score = 0; // Score cannot be negative
                     }
                }
            }
        }

        fn _apply_reputation_boost(ref self: ContractState, ref reputation: Reputation) {
            if reputation.successful_calls >= BOOST_THRESHOLD_SUCCESSFUL_CALLS && reputation.accuracy_percentage >= BOOST_THRESHOLD_ACCURACY {
                let boost_numerator = reputation.current_score * BOOST_AMOUNT_PERCENTAGE.into();
                let boost_amount = boost_numerator / 100.into();
                reputation.current_score = reputation.current_score - boost_amount;

                // Potentially reset boost eligibility or make it harder to get next boost
                // For now, it's a simple check every time.
            }
        }

        fn _create_reputation_snapshot(ref self: ContractState, reputation: Reputation) {
            let mut world = self.world(@"onchainsage");
            let snapshot = ReputationHistory {
                user_address: reputation.user_address,
                timestamp: reputation.last_updated, // Use the last_updated timestamp for the snapshot
                score_snapshot: reputation.current_score,
                total_calls_snapshot: reputation.total_calls,
                successful_calls_snapshot: reputation.successful_calls,
                accuracy_percentage_snapshot: reputation.accuracy_percentage,
            };
            // Note: This will overwrite if a snapshot with the same user_address and timestamp exists.
            // Timestamps should generally be unique per update.
            world.write_model(@snapshot);
        }
    }
}
