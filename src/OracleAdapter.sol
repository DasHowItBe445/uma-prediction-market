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

    address public market;

    modifier onlyMarket() {
        require(msg.sender == market, "Not market");
        _;
    }

    constructor(
        address _oo,
        address _currency
    ) {
        oo = OptimisticOracleV3Interface(_oo);
        currency = IERC20(_currency);
        identifier = oo.defaultIdentifier();
    }

    function setMarket(address _market) external {
        require(market == address(0), "Already set");
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
    {
        require(msg.sender == address(oo));

        IPredictionMarket(market)
            .onOracleResolve(id, ok);
    }

    function assertionDisputedCallback(bytes32) external {}
}
