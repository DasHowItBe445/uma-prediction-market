// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

interface IOptimisticOracleV3 {
    function settleAssertion(bytes32 assertionId) external;
    function getAssertion(bytes32 assertionId)
        external
        view
        returns (
            address,
            uint64,
            bool,
            bool,
            bool,
            address
        );
}

contract ResolveAssertions is Script {
    function run() external {
        address oracle = vm.envAddress("ORACLE");
        bytes32 aid = vm.envBytes32("AID");

        IOptimisticOracleV3 oo = IOptimisticOracleV3(oracle);

        (
            ,
            ,
            bool disputed,
            bool settled,
            ,
            
        ) = oo.getAssertion(aid);

        if (settled) {
            console2.log("Already settled");
            return;
        }

        console2.log("Settling assertion...");

        vm.startBroadcast();
        oo.settleAssertion(aid);
        vm.stopBroadcast();

        console2.log("Assertion settled");
    }
}