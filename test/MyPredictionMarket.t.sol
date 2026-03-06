// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "./common/CommonOptimisticOracleV3Test.sol";
import "../src/MyPredictionMarket.sol";

contract MyPredictionMarketTest is CommonOptimisticOracleV3Test {

    MyPredictionMarket public market;

    bytes32 marketId;

    uint256 constant TEST_BOND = 2e6;
    uint256 constant TEST_REWARD = 1e6;

    function setUp() public {
        _commonSetup();

        market = new MyPredictionMarket(
            address(finder),
            address(defaultCurrency),
            address(optimisticOracleV3)
        );
    }

    function _fundAndApprove(address user, uint256 amount) internal {
        defaultCurrency.allocateTo(user, amount);

        vm.startPrank(user);
        defaultCurrency.approve(address(market), type(uint256).max);
        vm.stopPrank();
    }



    /* ================= NO DISPUTE ================= */

    function test_NoDispute_TeamAWins() public {

        _fundAndApprove(address(this), 2e6);

        marketId = market.initializeMarket(
            "TeamA",
            "TeamB",
            "TeamA vs TeamB match",
            TEST_REWARD,
            TEST_BOND,
            7 days
        );

        uint256 minimumBond = optimisticOracleV3.getMinimumBond(address(defaultCurrency));
        _fundAndApprove(TestAddress.account1, minimumBond * 2);

        vm.startPrank(TestAddress.account1);

        bytes32 assertionId =
            market.assertMarket(marketId, "TeamA");

        vm.stopPrank();

        timer.setCurrentTime(
            timer.getCurrentTime() + market.assertionLiveness()
        );

        optimisticOracleV3.settleAssertion(assertionId);

        MyPredictionMarket.Market memory m = market.getMarket(marketId);

        assertTrue(m.resolved);
        assertEq(m.finalOutcomeId, keccak256(bytes("TeamA")));
    }

    /* ================= DISPUTE ================= */

    function test_WrongAssertion_Disputed_TeamAWins() public {

        _fundAndApprove(address(this), 2e6);

        marketId = market.initializeMarket(
            "TeamA",
            "TeamB",
            "TeamA vs TeamB match",
            TEST_REWARD,
            TEST_BOND,
            7 days
        );

        uint256 minimumBond = optimisticOracleV3.getMinimumBond(address(defaultCurrency));
        _fundAndApprove(TestAddress.account1, minimumBond * 2);
        _fundAndApprove(TestAddress.account2, minimumBond * 2);

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

        MyPredictionMarket.Market memory m = market.getMarket(marketId);

        assertFalse(m.resolved);
        assertEq(m.assertedOutcomeId, bytes32(0));
        assertEq(m.finalOutcomeId, bytes32(0));
    }

    /* ================= REASSERT ================= */

    function test_ReassertAfterDispute_TeamAWins() public {

        _fundAndApprove(address(this), 2e6);

        marketId = market.initializeMarket(
            "TeamA",
            "TeamB",
            "TeamA vs TeamB match",
            TEST_REWARD,
            TEST_BOND,
            7 days
        );

        uint256 minimumBond = optimisticOracleV3.getMinimumBond(address(defaultCurrency));
        _fundAndApprove(TestAddress.account1, minimumBond * 2);
        _fundAndApprove(TestAddress.account2, minimumBond * 2);

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

        MyPredictionMarket.Market memory m = market.getMarket(marketId);

        assertTrue(m.resolved);
        assertEq(m.finalOutcomeId, keccak256(bytes("TeamA")));
    }

    /* ================= MULTI MARKET ================= */

    function test_TwoMarkets_IsolatedResolution() public {

        _fundAndApprove(address(this), 4e6);

        bytes32 marketA =
            market.initializeMarket("Yes", "No", "Rain", TEST_REWARD, TEST_BOND, 7 days);

        bytes32 marketB =
            market.initializeMarket("Up", "Down", "BTC", TEST_REWARD, TEST_BOND, 7 days);

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

        MyPredictionMarket.Market memory mA = market.getMarket(marketA);
        bool rA = mA.resolved;
        bytes32 fA = mA.finalOutcomeId;

        MyPredictionMarket.Market memory mB = market.getMarket(marketB);
        bool rB = mB.resolved;
        bytes32 fB = mB.finalOutcomeId;

        assertTrue(rA);
        assertTrue(rB);

        assertEq(fA, keccak256(bytes("Yes")));
        assertEq(fB, keccak256(bytes("Down")));
    }

    /* ================= BOND LOSS ================= */

    function test_FakeAssertion_LosesBond() public {

        _fundAndApprove(address(this), 2e6);

        bytes32 id =
            market.initializeMarket("Win", "Lose", "Match", TEST_REWARD, TEST_BOND, 7 days);

        uint256 minimumBond = optimisticOracleV3.getMinimumBond(address(defaultCurrency));
        _fundAndApprove(TestAddress.account1, minimumBond * 2);
        _fundAndApprove(TestAddress.account2, minimumBond * 2);

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

        MyPredictionMarket.Market memory m = market.getMarket(id);

    assertFalse(m.resolved);
    }

    /* ================= PAYOUT ================= */

    function test_Payout_TeamAWins() public {

        _fundAndApprove(address(this), 2e6);

        bytes32 id =
            market.initializeMarket("TeamA", "TeamB", "Final", TEST_REWARD, TEST_BOND, 7 days);

        uint256 minimumBond = optimisticOracleV3.getMinimumBond(address(defaultCurrency));
        _fundAndApprove(TestAddress.account1, minimumBond * 2);

        vm.startPrank(TestAddress.account1);

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

        _fundAndApprove(address(this), 2e6);

        bytes32 id =
            market.initializeMarket("Yes", "No", "Test", TEST_REWARD, TEST_BOND, 7 days);

        uint256 minimumBond = optimisticOracleV3.getMinimumBond(address(defaultCurrency));
        _fundAndApprove(TestAddress.account1, minimumBond * 2);

        vm.startPrank(TestAddress.account1);

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

    _fundAndApprove(address(this), 2e6);
    
    bytes32 id =
        market.initializeMarket("Yes","No","Test", TEST_REWARD, TEST_BOND, 7 days);

    uint256 minimumBond = optimisticOracleV3.getMinimumBond(address(defaultCurrency));
    _fundAndApprove(TestAddress.account1, minimumBond * 2);

    vm.startPrank(TestAddress.account1);

    market.createOutcomeTokens(id, 100 ether);

    vm.stopPrank();

    vm.expectRevert("Market not resolved");
    market.settleOutcomeTokens(id);
}
function test_NoAssertAfterResolved() public {

    _fundAndApprove(address(this), 2e6);
    
    bytes32 id =
        market.initializeMarket("Yes","No","Test", TEST_REWARD, TEST_BOND, 7 days);

    uint256 minimumBond = optimisticOracleV3.getMinimumBond(address(defaultCurrency));
    _fundAndApprove(TestAddress.account1, minimumBond * 2);

    vm.startPrank(TestAddress.account1);
    
    bytes32 a = market.assertMarket(id,"Yes");

    vm.stopPrank();

    timer.setCurrentTime(
        timer.getCurrentTime() + market.assertionLiveness()
    );

    optimisticOracleV3.settleAssertion(a);

    vm.startPrank(TestAddress.account1);

    vm.expectRevert("Assertion active or resolved");
    market.assertMarket(id,"Yes");

    vm.stopPrank();
}
function test_NoMintAfterResolved() public {

    _fundAndApprove(address(this), 2e6);

    bytes32 id =
        market.initializeMarket("Yes","No","Test", TEST_REWARD, TEST_BOND, 7 days);

    uint256 minimumBond = optimisticOracleV3.getMinimumBond(address(defaultCurrency));
    _fundAndApprove(TestAddress.account1, minimumBond * 2);

    vm.startPrank(TestAddress.account1);
    
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

    _fundAndApprove(address(this), 2e6);

    bytes32 id =
        market.initializeMarket("Yes","No","Test", TEST_REWARD, TEST_BOND, 7 days);

    uint256 minimumBond = optimisticOracleV3.getMinimumBond(address(defaultCurrency));
    _fundAndApprove(TestAddress.account1, minimumBond * 2);
    _fundAndApprove(TestAddress.account2, minimumBond * 2);

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
