struct Proposal {
    proposal_id: u32,
    proposer: felt252,
    title_hash: felt252,
    description_hash: felt252,
    proposal_type: ProposalType,
    voting_start: u64,
    voting_end: u64,
    status: ProposalStatus,
}

enum ProposalType {
    PlatformChange,
    ParameterUpdate,
    FeatureAddition,
}

enum ProposalStatus {
    Pending,
    Active,
    Executed,
    Rejected,
    Expired,
}

struct Vote {
    proposal_id: u32,
    voter: felt252,
    weight: u64,
    support: bool, // true = for, false = against
}

fn create_proposal(...) {
    // validate reputation >= MIN_REPUTATION
    // save proposal to storage
}

