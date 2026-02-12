// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "forge-std/Script.sol";
import "../src/MyPredictionMarket.sol";

contract Deploy is Script {
    function run() external {
        uint256 key = vm.envUint("PRIVATE_KEY");

        address finder = 0xf4C48eDAd256326086AEfbd1A53e1896815F8f13;
        address usdc   = 0xdd5A896C64f194fa0B1B5745ADcF18146A244372;
        address oracle = 0x9923D42eF695B5dd9911D05Ac944d4cAca3c4EAB;

        vm.startBroadcast(key);

        new MyPredictionMarket(finder, usdc, oracle);

        vm.stopBroadcast();
    }
}
