// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;
import "./PredictionMarket.Common.sol";

contract PredictionMarketAssertionTest is PredictionMarketTestCommon {
    bytes32 marketId;

    function setUp() public {
        _commonPredictionMarketSetUp();
        marketId = _initializeMarket();
    }

    function test_RevertIf_InvalidAssertionParameters() public {
        _fundAssertionBond();
        vm.expectRevert("Market does not exist");
        vm.prank(TestAddress.account1);
        predictionMarket.assertMarket(bytes32(0), outcome1);

        vm.expectRevert("Invalid outcome");
        vm.prank(TestAddress.account1);
        predictionMarket.assertMarket(marketId, "Invalid");
    }

    function test_RevertIf_DuplicateActiveAssertion() public {
        _fundAssertionBond();
        vm.prank(TestAddress.account1);
        predictionMarket.assertMarket(marketId, outcome1);

        _fundAssertionBond();
        vm.expectRevert("Assertion active or resolved");
        vm.prank(TestAddress.account1);
        predictionMarket.assertMarket(marketId, outcome1);
    }

    function test_AssertionMade() public {
        uint256 ooBalanceBefore = defaultCurrency.balanceOf(address(optimisticOracleV3));

        // Make assertion and verify bond posted to Optimistic Oracle V3.
        bytes32 assertionId = _assertMarket(marketId, outcome1);
        assertEq(defaultCurrency.balanceOf(address(optimisticOracleV3)), ooBalanceBefore + requiredBond);

        // Verify PredictionMarket storage.
        MyPredictionMarket.Market memory market = predictionMarket.getMarket(marketId);
        assertEq(market.assertedOutcomeId, keccak256(bytes(outcome1)));
        (address storedAsserter, bytes32 storedMarketId) = predictionMarket.assertedMarkets(assertionId);
        assertEq(storedAsserter, TestAddress.account1);
        assertEq(storedMarketId, marketId);

        // Verify OptimisticOracleV3 storage.
        OptimisticOracleV3Interface.Assertion memory assertion = optimisticOracleV3.getAssertion(assertionId);
        assertEq(assertion.asserter, TestAddress.account1);
        assertEq(assertion.callbackRecipient, address(predictionMarket));
        assertEq(address(assertion.currency), address(defaultCurrency));

        uint256 minBond = optimisticOracleV3.getMinimumBond(address(defaultCurrency));
        uint256 expectedBond = requiredBond > minBond ? requiredBond : minBond;

        assertEq(assertion.bond, expectedBond);
        assertEq(assertion.assertionTime, block.timestamp);
        assertEq(assertion.expirationTime, assertion.assertionTime + 120);
        assertEq(assertion.identifier, defaultIdentifier);
        assertEq(assertion.escalationManagerSettings.assertingCaller, address(predictionMarket));
    }

    function test_AssertMinimumBond() public {
        // Initialize second market with 0 required bond.
        _fundInitializationReward();
        vm.roll(block.number + 1);
        vm.prank(TestAddress.owner);
        bytes32 secondMarketId = predictionMarket.initializeMarket(outcome1, outcome2, description, reward, reward * 2, 7 days);
        uint256 ooBalanceBefore = defaultCurrency.balanceOf(address(optimisticOracleV3));
        uint256 minimumBond = optimisticOracleV3.getMinimumBond(address(defaultCurrency));

        // Make assertion and verify minimum bond posted to Optimistic Oracle V3.
        _assertMarket(secondMarketId, outcome1);
        uint256 expectedBond = reward * 2 > minimumBond ? reward * 2 : minimumBond;

        assertEq(
            defaultCurrency.balanceOf(address(optimisticOracleV3)),
            ooBalanceBefore + expectedBond
        );
    }

    function test_DisputeCallbackReceived() public {
        bytes32 assertionId = _assertMarket(marketId, outcome1);

        vm.expectCall(
            address(predictionMarket),
            abi.encodeCall(predictionMarket.assertionDisputedCallback, (assertionId))
        );
        _disputeAndGetOracleRequest(assertionId, requiredBond);
    }
}
