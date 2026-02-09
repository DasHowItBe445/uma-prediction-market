// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "./common/CommonOptimisticOracleV3Test.sol";
import "../src/MyPredictionMarket.sol";

contract MyPredictionMarketTest is CommonOptimisticOracleV3Test {

    MyPredictionMarket public market;

    bytes32 marketId;

    function setUp() public {
    _commonSetup();

    market = new MyPredictionMarket(
        address(finder),
        address(defaultCurrency),
        address(optimisticOracleV3)
    );
}


    /* ================= NO DISPUTE ================= */

    function test_NoDispute_TeamAWins() public {

        marketId = market.initializeMarket(
            "TeamA",
            "TeamB",
            "TeamA vs TeamB match",
            0,
            0
        );

        defaultCurrency.allocateTo(TestAddress.account1, 1000 ether);

        vm.startPrank(TestAddress.account1);
        defaultCurrency.approve(address(market), type(uint256).max);

        bytes32 assertionId =
            market.assertMarket(marketId, "TeamA");

        vm.stopPrank();

        timer.setCurrentTime(
            timer.getCurrentTime() + market.assertionLiveness()
        );

        optimisticOracleV3.settleAssertion(assertionId);

        (
            bool resolved,
            ,
            bytes32 finalOutcome,
            ,
            ,
            ,
            ,
            ,
            ,

        ) = market.markets(marketId);

        assertTrue(resolved);
        assertEq(finalOutcome, keccak256(bytes("TeamA")));
    }

    /* ================= DISPUTE ================= */

    function test_WrongAssertion_Disputed_TeamAWins() public {

        marketId = market.initializeMarket(
            "TeamA",
            "TeamB",
            "TeamA vs TeamB match",
            0,
            0
        );

        defaultCurrency.allocateTo(TestAddress.account1, 1000 ether);
        defaultCurrency.allocateTo(TestAddress.account2, 1000 ether);

        vm.startPrank(TestAddress.account1);
        defaultCurrency.approve(address(market), type(uint256).max);

        bytes32 assertionId =
            market.assertMarket(marketId, "TeamB");

        vm.stopPrank();

        vm.startPrank(TestAddress.account2);

        OracleRequest memory request =
            _disputeAndGetOracleRequest(assertionId, defaultBond);

        vm.stopPrank();

        _mockOracleResolved(address(mockOracle), request, false);

        bool result =
            optimisticOracleV3.settleAndGetAssertionResult(assertionId);

        assertFalse(result);

        (
            bool resolved,
            bytes32 asserted,
            bytes32 finalOutcome,
            ,
            ,
            ,
            ,
            ,
            ,

        ) = market.markets(marketId);

        assertFalse(resolved);
        assertEq(asserted, bytes32(0));
        assertEq(finalOutcome, bytes32(0));
    }

    /* ================= REASSERT ================= */

    function test_ReassertAfterDispute_TeamAWins() public {

        marketId = market.initializeMarket(
            "TeamA",
            "TeamB",
            "TeamA vs TeamB match",
            0,
            0
        );

        defaultCurrency.allocateTo(TestAddress.account1, 1000 ether);
        defaultCurrency.allocateTo(TestAddress.account2, 1000 ether);

        vm.startPrank(TestAddress.account1);
        defaultCurrency.approve(address(market), type(uint256).max);

        bytes32 firstAssertion =
            market.assertMarket(marketId, "TeamB");

        vm.stopPrank();

        vm.startPrank(TestAddress.account2);

        OracleRequest memory request =
            _disputeAndGetOracleRequest(firstAssertion, defaultBond);

        vm.stopPrank();

        _mockOracleResolved(address(mockOracle), request, false);

        optimisticOracleV3.settleAndGetAssertionResult(firstAssertion);

        vm.startPrank(TestAddress.account2);
        defaultCurrency.approve(address(market), type(uint256).max);

        bytes32 secondAssertion =
            market.assertMarket(marketId, "TeamA");

        vm.stopPrank();

        timer.setCurrentTime(
            timer.getCurrentTime() + market.assertionLiveness()
        );

        optimisticOracleV3.settleAssertion(secondAssertion);

        (
            bool resolved,
            ,
            bytes32 finalOutcome,
            ,
            ,
            ,
            ,
            ,
            ,

        ) = market.markets(marketId);

        assertTrue(resolved);
        assertEq(finalOutcome, keccak256(bytes("TeamA")));
    }

    /* ================= MULTI MARKET ================= */

    function test_TwoMarkets_IsolatedResolution() public {

        bytes32 marketA =
            market.initializeMarket("Yes", "No", "Rain", 0, 0);

        bytes32 marketB =
            market.initializeMarket("Up", "Down", "BTC", 0, 0);

        defaultCurrency.allocateTo(TestAddress.account1, 2000 ether);

        vm.startPrank(TestAddress.account1);
        defaultCurrency.approve(address(market), type(uint256).max);

        bytes32 a = market.assertMarket(marketA, "Yes");
        bytes32 b = market.assertMarket(marketB, "Down");

        vm.stopPrank();

        timer.setCurrentTime(
            timer.getCurrentTime() + market.assertionLiveness()
        );

        optimisticOracleV3.settleAssertion(a);
        optimisticOracleV3.settleAssertion(b);

        (
            bool rA,
            ,
            bytes32 fA,
            ,
            ,
            ,
            ,
            ,
            ,

        ) = market.markets(marketA);

        (
            bool rB,
            ,
            bytes32 fB,
            ,
            ,
            ,
            ,
            ,
            ,

        ) = market.markets(marketB);

        assertTrue(rA);
        assertTrue(rB);

        assertEq(fA, keccak256(bytes("Yes")));
        assertEq(fB, keccak256(bytes("Down")));
    }

    /* ================= BOND LOSS ================= */

    function test_FakeAssertion_LosesBond() public {

        bytes32 id =
            market.initializeMarket("Win", "Lose", "Match", 0, 0);

        defaultCurrency.allocateTo(TestAddress.account1, 1000 ether);
        defaultCurrency.allocateTo(TestAddress.account2, 1000 ether);

        vm.startPrank(TestAddress.account1);
        defaultCurrency.approve(address(market), type(uint256).max);

        bytes32 assertionId =
            market.assertMarket(id, "Win");

        vm.stopPrank();

        vm.startPrank(TestAddress.account2);

        OracleRequest memory request =
            _disputeAndGetOracleRequest(assertionId, defaultBond);

        vm.stopPrank();

        _mockOracleResolved(address(mockOracle), request, false);

        bool result =
            optimisticOracleV3.settleAndGetAssertionResult(assertionId);

        assertFalse(result);

        (bool resolved,,,,,,,,,) = market.markets(id);

        assertFalse(resolved);
    }

    /* ================= PAYOUT ================= */

    function test_Payout_TeamAWins() public {

        bytes32 id =
            market.initializeMarket("TeamA", "TeamB", "Final", 0, 0);

        defaultCurrency.allocateTo(TestAddress.account1, 1000 ether);

        vm.startPrank(TestAddress.account1);
        defaultCurrency.approve(address(market), type(uint256).max);

        market.createOutcomeTokens(id, 100 ether);

        bytes32 assertionId =
            market.assertMarket(id, "TeamA");

        vm.stopPrank();

        timer.setCurrentTime(
            timer.getCurrentTime() + market.assertionLiveness()
        );

        optimisticOracleV3.settleAssertion(assertionId);

        uint256 before =
            defaultCurrency.balanceOf(TestAddress.account1);

        vm.startPrank(TestAddress.account1);
        market.settleOutcomeTokens(id);
        vm.stopPrank();

        uint256 afterBal =
            defaultCurrency.balanceOf(TestAddress.account1);

        assertGt(afterBal, before);
    }

    /* ================= DOUBLE PAYOUT ================= */

    function test_NoDoublePayout() public {

        bytes32 id =
            market.initializeMarket("Yes", "No", "Test", 0, 0);

        defaultCurrency.allocateTo(TestAddress.account1, 1000 ether);

        vm.startPrank(TestAddress.account1);
        defaultCurrency.approve(address(market), type(uint256).max);

        market.createOutcomeTokens(id, 100 ether);

        bytes32 assertionId =
            market.assertMarket(id, "Yes");

        vm.stopPrank();

        timer.setCurrentTime(
            timer.getCurrentTime() + market.assertionLiveness()
        );

        optimisticOracleV3.settleAssertion(assertionId);

        vm.startPrank(TestAddress.account1);

        market.settleOutcomeTokens(id);

        vm.expectRevert();
        market.settleOutcomeTokens(id);

        vm.stopPrank();
    }
    function test_CannotSettleBeforeResolved() public {

    bytes32 id =
        market.initializeMarket("Yes","No","Test",0,0);

    defaultCurrency.allocateTo(TestAddress.account1, 1000 ether);

    vm.startPrank(TestAddress.account1);
    defaultCurrency.approve(address(market), type(uint256).max);

    market.createOutcomeTokens(id, 100 ether);

    vm.expectRevert("Market not resolved");
    market.settleOutcomeTokens(id);

    vm.stopPrank();
}
function test_NoAssertAfterResolved() public {

    bytes32 id =
        market.initializeMarket("Yes","No","Test",0,0);

    defaultCurrency.allocateTo(TestAddress.account1, 1000 ether);

    vm.startPrank(TestAddress.account1);
    defaultCurrency.approve(address(market), type(uint256).max);

    bytes32 a = market.assertMarket(id,"Yes");

    vm.stopPrank();

    timer.setCurrentTime(
        timer.getCurrentTime() + market.assertionLiveness()
    );

    optimisticOracleV3.settleAssertion(a);

    vm.startPrank(TestAddress.account1);

    vm.expectRevert("Assertion active");
    market.assertMarket(id,"Yes");

    vm.stopPrank();
}
function test_NoMintAfterResolved() public {

    bytes32 id =
        market.initializeMarket("Yes","No","Test",0,0);

    defaultCurrency.allocateTo(TestAddress.account1, 1000 ether);

    vm.startPrank(TestAddress.account1);
    defaultCurrency.approve(address(market), type(uint256).max);

    bytes32 a = market.assertMarket(id,"Yes");

    vm.stopPrank();

    timer.setCurrentTime(
        timer.getCurrentTime() + market.assertionLiveness()
    );

    optimisticOracleV3.settleAssertion(a);

    vm.startPrank(TestAddress.account1);

    vm.expectRevert();
    market.createOutcomeTokens(id, 100 ether);

    vm.stopPrank();
}
function test_BondIsLostOnFalseAssertion() public {

    bytes32 id =
        market.initializeMarket("Yes","No","Test",0,0);

    defaultCurrency.allocateTo(TestAddress.account1, 1000 ether);
    defaultCurrency.allocateTo(TestAddress.account2, 1000 ether);

    uint256 before =
        defaultCurrency.balanceOf(TestAddress.account1);

    vm.startPrank(TestAddress.account1);
    defaultCurrency.approve(address(market), type(uint256).max);

    bytes32 a =
        market.assertMarket(id,"Yes");

    vm.stopPrank();

    vm.startPrank(TestAddress.account2);

    OracleRequest memory req =
        _disputeAndGetOracleRequest(a, defaultBond);

    vm.stopPrank();

    _mockOracleResolved(address(mockOracle), req, false);

    optimisticOracleV3.settleAndGetAssertionResult(a);

    uint256 afterBal =
        defaultCurrency.balanceOf(TestAddress.account1);

    assertLt(afterBal, before);
}

}
