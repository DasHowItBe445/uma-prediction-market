// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uma/core/contracts/optimistic-oracle-v3/interfaces/OptimisticOracleV3Interface.sol";
import "@uma/core/contracts/optimistic-oracle-v3/interfaces/OptimisticOracleV3CallbackRecipientInterface.sol";

interface IPredictionMarket {
    function onOracleResolve(bytes32 assertionId, bool assertedTruthfully) external;
}

contract OracleAdapter is OptimisticOracleV3CallbackRecipientInterface {
    /// @notice UMA Optimistic Oracle V3
    OptimisticOracleV3Interface public immutable oo;

    /// @notice Bond currency used for assertions
    IERC20 public immutable currency;

    /// @notice UMA identifier (ASSERT_TRUTH by default)
    bytes32 public immutable identifier;

    /// @notice Assertion liveness (2 hours)
    uint64 public constant LIVENESS = 7200;

    /// @notice Prediction market bound to this adapter (immutable)
    address public immutable market;

    /// @dev Restricts calls to the bound prediction market
    modifier onlyMarket() {
        require(msg.sender == market, "OracleAdapter: not market");
        _;
    }

    constructor(
        address _oo,
        address _currency,
        address _market
    ) {
        require(_oo != address(0), "OracleAdapter: zero oracle");
        require(_currency != address(0), "OracleAdapter: zero currency");
        require(_market != address(0), "OracleAdapter: zero market");

        oo = OptimisticOracleV3Interface(_oo);
        currency = IERC20(_currency);
        identifier = oo.defaultIdentifier();
        market = _market;
    }

    /// @notice Submits an outcome assertion to UMA OOv3
    /// @dev Callable only by the bound prediction market
    function assertOutcome(
        bytes memory claim,
        uint256 bond,
        address asserter
    )
        external
        onlyMarket
        returns (bytes32 assertionId)
    {
        // NOTE: assumes the adapter already holds `bond` tokens
        // Approval is scoped exactly to the required bond
        currency.approve(address(oo), bond);

        assertionId = oo.assertTruth(
            claim,
            asserter,
            address(this), // callback recipient
            address(0),    // no sovereign security
            LIVENESS,
            currency,
            bond,
            identifier,
            bytes32(0)     // no domain
        );
    }

    /// @notice UMA callback when an assertion is resolved
    function assertionResolvedCallback(
        bytes32 assertionId,
        bool assertedTruthfully
    )
        external
        override
    {
        require(msg.sender == address(oo), "OracleAdapter: not oracle");

        IPredictionMarket(market).onOracleResolve(
            assertionId,
            assertedTruthfully
        );
    }

    /// @notice UMA callback when an assertion is disputed
    /// @dev Intentionally left empty; market handles resolution
    function assertionDisputedCallback(bytes32)
        external
        override
    {}
}
