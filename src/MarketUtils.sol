// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "@uma/core/contracts/optimistic-oracle-v3/implementation/ClaimData.sol";

library MarketUtils {
    function composeClaim(
        string memory outcome,
        bytes memory description,
        uint256 timestamp
    ) internal pure returns (bytes memory) {
        return abi.encodePacked(
            "As of ",
            ClaimData.toUtf8BytesUint(timestamp),
            ", outcome: ",
            outcome,
            ". Description: ",
            description
        );
    }

    function hash(string memory s) internal pure returns (bytes32) {
        return keccak256(bytes(s));
    }

    function hashBytes(bytes memory b) internal pure returns (bytes32) {
        return keccak256(b);
    }
}
