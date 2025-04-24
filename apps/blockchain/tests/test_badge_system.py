import pytest
# from starkware.starknet.testing.starknet import Starknet
from starkware.starknet.business_logic.execution.objects import Event, Starknet

@pytest.fixture
async def badge_system():
    # Deploy the BadgeSystem contract
    starknet = await Starknet.empty()
    contract = await starknet.deploy(
        source="./apps/blockchain/src/systems/badge_system.cairo"
    )
    return contract

@pytest.mark.asyncio
async def test_high_performing_post_awards_badge(badge_system):
    # Arrange
    user = 0x123  # Mock user address
    badge = 0x1   # Mock badge ID
    owner = await badge_system.owner().call()

    # Simulate high-performing post (mock ≥70% upvotes and ≥10% profitability)
    # This logic should be implemented in the contract if not already present.
    # For now, we directly award the badge.

    # Act
    await badge_system.award_badge(user, badge).invoke(caller_address=owner.result)

    # Assert
    badges = await badge_system.user_badges(user).call()
    assert badge in badges.result, "Badge was not awarded for a high-performing post."

@pytest.mark.asyncio
async def test_low_performing_post_removes_badge(badge_system):
    # Arrange
    user = 0x123  # Mock user address
    badge = 0x1   # Mock badge ID
    owner = await badge_system.owner().call()

    # Award the badge first
    await badge_system.award_badge(user, badge).invoke(caller_address=owner.result)

    # Simulate low-performing post (mock ≥50% negative votes)
    # This logic should be implemented in the contract if not already present.
    # For now, we directly remove the badge.

    # Act
    await badge_system.remove_badge(user, badge).invoke(caller_address=owner.result)

    # Assert
    badges = await badge_system.user_badges(user).call()
    assert badge not in badges.result, "Badge was not removed for a low-performing post."

@pytest.mark.asyncio
async def test_call_limit_enforcement(badge_system):
    # Arrange
    user = 0x123  # Mock user address

    # Increment call count 5 times
    for _ in range(5):
        await badge_system.increment_call_count(user).invoke()

    # Act
    can_submit = await badge_system.can_submit_call(user).call()

    # Assert
    assert can_submit.result == 0, "Non-badge holder should be restricted after 5 calls."

@pytest.mark.asyncio
async def test_badge_holder_unlimited_calls(badge_system):
    # Arrange
    user = 0x123  # Mock user address
    badge = 0x1   # Mock badge ID
    owner = await badge_system.owner().call()

    # Award the badge
    await badge_system.award_badge(user, badge).invoke(caller_address=owner.result)

    # Act
    can_submit = await badge_system.can_submit_call(user).call()

    # Assert
    assert can_submit.result == 1, "Badge holder should be allowed unlimited calls."