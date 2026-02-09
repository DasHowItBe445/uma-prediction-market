// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "./common/CommonOptimisticOracleV3Test.sol";
import "../src/Insurance.sol";

contract InsuranceTest is CommonOptimisticOracleV3Test {
    Insurance public insurance;

    bytes insuredEvent = bytes("insuredEvent");
    uint256 insuranceAmount = 100;

    function setUp() public {
        _commonSetup();
        insurance = new Insurance(
            address(defaultCurrency),
            address(optimisticOracleV3)
        );
    }

    function test_InsuranceNoDispute() public {
        vm.recordLogs();

        defaultCurrency.allocateTo(TestAddress.account1, insuranceAmount);

        vm.startPrank(TestAddress.account1);

        defaultCurrency.approve(address(insurance), insuranceAmount);

        bytes32 policyId =
            insurance.issueInsurance(
                insuranceAmount,
                TestAddress.account3,
                insuredEvent
            );

        uint256 bond =
            optimisticOracleV3.getMinimumBond(address(defaultCurrency));

        defaultCurrency.allocateTo(TestAddress.account1, bond);
        defaultCurrency.approve(address(insurance), bond);

        bytes32 assertionId = insurance.requestPayout(policyId);

        vm.stopPrank();

        timer.setCurrentTime(
            timer.getCurrentTime() + insurance.assertionLiveness()
        );

        uint256 beforeBalance =
            defaultCurrency.balanceOf(TestAddress.account3);

        optimisticOracleV3.settleAssertion(assertionId);

        assertEq(
            defaultCurrency.balanceOf(TestAddress.account3) - beforeBalance,
            insuranceAmount
        );

        _assertOutcome(assertionId, 1);
    }

    function test_InsuranceWithWrongDispute() public {
        vm.recordLogs();

        defaultCurrency.allocateTo(TestAddress.account1, insuranceAmount);

        vm.startPrank(TestAddress.account1);

        defaultCurrency.approve(address(insurance), insuranceAmount);

        bytes32 policyId =
            insurance.issueInsurance(
                insuranceAmount,
                TestAddress.account3,
                insuredEvent
            );

        uint256 bond =
            optimisticOracleV3.getMinimumBond(address(defaultCurrency));

        defaultCurrency.allocateTo(TestAddress.account1, bond);
        defaultCurrency.approve(address(insurance), bond);

        bytes32 assertionId = insurance.requestPayout(policyId);

        vm.stopPrank();

        OracleRequest memory oracleRequest =
            _disputeAndGetOracleRequest(assertionId, defaultBond);

        uint256 beforeBalance =
            defaultCurrency.balanceOf(TestAddress.account3);

        _mockOracleResolved(address(mockOracle), oracleRequest, true);

        assertTrue(
            optimisticOracleV3.settleAndGetAssertionResult(assertionId)
        );

        assertEq(
            defaultCurrency.balanceOf(TestAddress.account3) - beforeBalance,
            insuranceAmount
        );

        _assertOutcome(assertionId, 1);
    }

    function test_InsuranceWithCorrectDispute() public {
        vm.recordLogs();

        defaultCurrency.allocateTo(TestAddress.account1, insuranceAmount);

        vm.startPrank(TestAddress.account1);

        defaultCurrency.approve(address(insurance), insuranceAmount);

        bytes32 policyId =
            insurance.issueInsurance(
                insuranceAmount,
                TestAddress.account3,
                insuredEvent
            );

        uint256 bond =
            optimisticOracleV3.getMinimumBond(address(defaultCurrency));

        defaultCurrency.allocateTo(TestAddress.account1, bond);
        defaultCurrency.approve(address(insurance), bond);

        bytes32 assertionId = insurance.requestPayout(policyId);

        vm.stopPrank();

        OracleRequest memory oracleRequest =
            _disputeAndGetOracleRequest(assertionId, defaultBond);

        uint256 beforeBalance =
            defaultCurrency.balanceOf(TestAddress.account3);

        _mockOracleResolved(address(mockOracle), oracleRequest, false);

        assertFalse(
            optimisticOracleV3.settleAndGetAssertionResult(assertionId)
        );

        assertEq(
            defaultCurrency.balanceOf(TestAddress.account3),
            beforeBalance
        );

        _assertOutcome(assertionId, 0);
    }

    function test_RevertIf_PolicyAlreadyExists() public {
        defaultCurrency.allocateTo(TestAddress.account1, insuranceAmount);

        vm.startPrank(TestAddress.account1);

        defaultCurrency.approve(address(insurance), insuranceAmount);

        insurance.issueInsurance(
            insuranceAmount,
            TestAddress.account2,
            insuredEvent
        );

        vm.expectRevert("Policy already exists");

        insurance.issueInsurance(
            insuranceAmount,
            TestAddress.account2,
            insuredEvent
        );
    }

    // ------------------------------------------------------
    // Helper
    // ------------------------------------------------------

    function _assertOutcome(
        bytes32 assertionId,
        uint256 expectedOutcome
    ) internal {
        Vm.Log[] memory logs = vm.getRecordedLogs();

        bool found;
        uint256 outcome;

        for (uint256 i = 0; i < logs.length; i++) {
            if (
                logs[i].topics[0] ==
                keccak256("OutcomeResolved(bytes32,uint256)")
            ) {
                bytes32 loggedId = bytes32(logs[i].topics[1]);

                if (loggedId == assertionId) {
                    outcome = abi.decode(logs[i].data, (uint256));
                    found = true;
                    break;
                }
            }
        }

        assertTrue(found, "OutcomeResolved not found");
        assertEq(outcome, expectedOutcome, "Wrong outcome");
    }
}
