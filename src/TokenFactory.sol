// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.16;

import "@uma/core/contracts/common/implementation/ExpandedERC20.sol";

contract TokenFactory {
    function create(
        string memory name,
        string memory symbol
    ) external returns (ExpandedERC20) {
        ExpandedERC20 t =
            new ExpandedERC20(name, symbol, 18);

        t.addMinter(msg.sender);
        t.addBurner(msg.sender);

        return t;
    }
}
