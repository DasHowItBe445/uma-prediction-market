// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "forge-std/console2.sol";
import "forge-std/Script.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "@uma/core/contracts/common/implementation/AddressWhitelist.sol";
import "@uma/core/contracts/data-verification-mechanism/implementation/Constants.sol";
import "@uma/core/contracts/data-verification-mechanism/implementation/Finder.sol";
import "@uma/core/contracts/data-verification-mechanism/implementation/IdentifierWhitelist.sol";
import "@uma/core/contracts/data-verification-mechanism/implementation/Store.sol";
import "@uma/core/contracts/data-verification-mechanism/test/MockOracleAncillary.sol";
import "@uma/core/contracts/optimistic-oracle-v3/implementation/OptimisticOracleV3.sol";

import "../src/MockToken.sol";

contract OracleSandboxScript is Script {

    bytes32 defaultIdentifier;
    uint256 minimumBond;
    uint64 defaultLiveness;
    address defaultCurrency;

    function run() external {

        defaultIdentifier = vm.envOr(
            "DEFAULT_IDENTIFIER",
            bytes32("ASSERT_TRUTH")
        );

        minimumBond = vm.envOr(
            "MINIMUM_BOND",
            uint256(100e18)
        );

        defaultLiveness = uint64(
            vm.envOr("DEFAULT_LIVENESS", uint64(7200))
        );

        defaultCurrency = vm.envOr(
            "DEFAULT_CURRENCY",
            address(0)
        );

        vm.startBroadcast();

        /* ---------------- UMA Core ---------------- */

        Finder finder = new Finder();
        console.log("Finder:", address(finder));

        Store store = new Store(
            FixedPoint.fromUnscaledUint(0),
            FixedPoint.fromUnscaledUint(0),
            address(0)
        );
        console.log("Store:", address(store));

        AddressWhitelist addressWhitelist =
            new AddressWhitelist();

        IdentifierWhitelist identifierWhitelist =
            new IdentifierWhitelist();

        MockOracleAncillary mockOracle =
            new MockOracleAncillary(address(finder), msg.sender);

        /* ---------------- Currency (MockToken) ---------------- */

        if (defaultCurrency == address(0)) {

            MockToken token = new MockToken();

            defaultCurrency = address(token);

            console.log("MockToken:", defaultCurrency);
        }

        /* ---------------- Register ---------------- */

        finder.changeImplementationAddress(
            OracleInterfaces.Store,
            address(store)
        );

        finder.changeImplementationAddress(
            OracleInterfaces.CollateralWhitelist,
            address(addressWhitelist)
        );

        finder.changeImplementationAddress(
            OracleInterfaces.IdentifierWhitelist,
            address(identifierWhitelist)
        );

        finder.changeImplementationAddress(
            OracleInterfaces.Oracle,
            address(mockOracle)
        );

        addressWhitelist.addToWhitelist(defaultCurrency);

        identifierWhitelist.addSupportedIdentifier(
            defaultIdentifier
        );

        store.setFinalFee(
            defaultCurrency,
            FixedPoint.Unsigned(minimumBond / 2)
        );

        /* ---------------- OOv3 ---------------- */

        OptimisticOracleV3 oo =
            new OptimisticOracleV3(
                finder,
                IERC20(defaultCurrency),
                defaultLiveness
            );

        console.log("OOv3:", address(oo));

        finder.changeImplementationAddress(
            OracleInterfaces.OptimisticOracleV3,
            address(oo)
        );

        vm.stopBroadcast();
    }
}
