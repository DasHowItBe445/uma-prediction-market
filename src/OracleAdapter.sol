// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uma/core/contracts/optimistic-oracle-v3/interfaces/OptimisticOracleV3Interface.sol";
import "@uma/core/contracts/optimistic-oracle-v3/interfaces/OptimisticOracleV3CallbackRecipientInterface.sol";

interface IPredictionMarket {
    function onOracleResolve(bytes32, bool) external;
}

contract OracleAdapter is OptimisticOracleV3CallbackRecipientInterface {
    OptimisticOracleV3Interface public immutable oo;
    IERC20 public immutable currency;
    bytes32 public immutable identifier;

    uint64 public constant LIVENESS = 7200;

    /// @notice Bound prediction market (immutable)
    address public immutable market;

    modifier onlyMarket() {
        require(msg.sender == market, "OracleAdapter: not market");
        _;
    }

    constructor(
        address _oo,
        address _currency,
        address _market
    ) {
        require(_market != address(0), "OracleAdapter: zero market");

        oo = OptimisticOracleV3Interface(_oo);
        currency = IERC20(_currency);
        identifier = oo.defaultIdentifier();

        market = _market;
    }

    function assertOutcome(
        bytes memory claim,
        uint256 bond,
        address asserter
    )
        external
        onlyMarket
        returns (bytes32 id)
    {
        currency.approve(address(oo), bond);

        id = oo.assertTruth(
            claim,
            asserter,
            address(this),
            address(0),
            LIVENESS,
            currency,
            bond,
            identifier,
            bytes32(0)
        );
    }

    function assertionResolvedCallback(
        bytes32 id,
        bool ok
    )
        external
        override
    {
        require(msg.sender == address(oo), "OracleAdapter: not oracle");

        IPredictionMarket(market).onOracleResolve(id, ok);
    }

    function assertionDisputedCallback(bytes32)
        external
        override
    {}
}
