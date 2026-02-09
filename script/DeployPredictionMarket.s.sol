// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.16;

import "forge-std/Script.sol";
import "../src/MyPredictionMarket.sol";

contract DeployPredictionMarket is Script {
    function run() external {
        vm.startBroadcast();

        address finder   = vm.envAddress("FINDER");
        address currency = vm.envAddress("CURRENCY");
        address oo       = vm.envAddress("OO_V3");

        new MyPredictionMarket(
            finder,
            currency,
            oo
        );

        vm.stopBroadcast();
    }
}
