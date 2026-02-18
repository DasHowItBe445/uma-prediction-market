// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "forge-std/Script.sol";
import "../src/MyPredictionMarket.sol";

contract Deploy is Script {
    function run() external {
        uint256 key = vm.envUint("PRIVATE_KEY");

        address finder   = vm.envAddress("FINDER");
        address currency = vm.envAddress("CURRENCY");
        address oracle   = vm.envAddress("OO_V3");

        vm.startBroadcast(key);

        new MyPredictionMarket(
            finder,
            currency,
            oracle
        );

        vm.stopBroadcast();
    }
}
