// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {

    constructor() ERC20("Prediction Market Token", "PMT") {
        _mint(msg.sender, 1_000_000 * 10 ** 18);
    }

}