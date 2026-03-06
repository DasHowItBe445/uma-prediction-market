// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.16;

import "forge-std/Test.sol";
import "./PredictionMarket.Common.sol";

contract SecurityTests is PredictionMarketTestCommon {

    bytes32 marketId;

    function setUp() public {
        _commonPredictionMarketSetUp();
        marketId = _initializeMarket();
    }

    /* ---------------------------------------------------------- */
    /* 1. Reentrancy Protection                                   */
    /* ---------------------------------------------------------- */

    function test_ReentrancyProtection() public {
        _fundAssertionBond();

        vm.prank(TestAddress.account1);

        predictionMarket.assertMarket(marketId, outcome1);

        // Try asserting again immediately (should fail)
        _fundAssertionBond();

        vm.expectRevert("Assertion active or resolved");

        vm.prank(TestAddress.account1);

        predictionMarket.assertMarket(marketId, outcome1);
    }

    /* ---------------------------------------------------------- */
    /* 2. Oracle Spoof Protection                                 */
    /* ---------------------------------------------------------- */

    function test_RevertIf_FakeOracleCallback() public {

        vm.expectRevert("Not oracle");

        predictionMarket.assertionResolvedCallback(
            bytes32("fakeAssertion"),
            true
        );
    }

    /* ---------------------------------------------------------- */
    /* 3. Duplicate Assertion Attack                              */
    /* ---------------------------------------------------------- */

    function test_RevertIf_DuplicateAssertion() public {

        _assertMarket(marketId, outcome1);

        _fundAssertionBond();

        vm.expectRevert("Assertion active or resolved");

        vm.prank(TestAddress.account1);

        predictionMarket.assertMarket(marketId, outcome2);
    }

    /* ---------------------------------------------------------- */
    /* 4. Market Creation Spam Protection                         */
    /* ---------------------------------------------------------- */

    function test_RevertIf_MarketLimitExceeded() public {

        uint256 max = predictionMarket.MAX_MARKETS_PER_USER();

        for (uint256 i = 1; i < max; i++) {

            vm.roll(block.number + 1);

            _fundInitializationReward();

            vm.prank(TestAddress.owner);

            predictionMarket.initializeMarket(
                outcome1,
                outcome2,
                description,
                reward,
                requiredBond,
                7 days
            );
        }

        vm.roll(block.number + 1);

        _fundInitializationReward();

        vm.expectRevert("Market limit reached");

        vm.prank(TestAddress.owner);

        predictionMarket.initializeMarket(
            outcome1,
            outcome2,
            description,
            reward,
            requiredBond,
            7 days
        );
    }

    /* ---------------------------------------------------------- */
    /* 5. Bond Manipulation Protection                            */
    /* ---------------------------------------------------------- */

    function test_BondCannotBeLowerThanMinimum() public {

        uint256 minBond = optimisticOracleV3.getMinimumBond(address(defaultCurrency));

        vm.roll(block.number + 1);

        _fundInitializationReward();

        vm.prank(TestAddress.owner);

        bytes32 id = predictionMarket.initializeMarket(
            outcome1,
            outcome2,
            description,
            reward,
            reward * 2,
            7 days
        );

        _fundAssertionBond();

        vm.prank(TestAddress.account1);

        bytes32 aid = predictionMarket.assertMarket(id, outcome1);

        OptimisticOracleV3Interface.Assertion memory assertion =
            optimisticOracleV3.getAssertion(aid);

        assertGe(assertion.bond, minBond);
    }

}