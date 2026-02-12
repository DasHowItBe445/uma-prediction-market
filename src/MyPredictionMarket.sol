// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uma/core/contracts/common/implementation/ExpandedERC20.sol";

import "@uma/core/contracts/optimistic-oracle-v3/interfaces/OptimisticOracleV3Interface.sol";
import "@uma/core/contracts/optimistic-oracle-v3/interfaces/OptimisticOracleV3CallbackRecipientInterface.sol";

import "./MarketUtils.sol";
import "./TokenFactory.sol";

contract MyPredictionMarket is OptimisticOracleV3CallbackRecipientInterface {
    using SafeERC20 for IERC20;

    /* ---------------- Reentrancy Guard ---------------- */

    uint256 private locked = 1;

    modifier nonReentrant() {
        require(locked == 1, "Reentrancy");
        locked = 2;
        _;
        locked = 1;
    }


    /* ---------------- Storage ---------------- */

    address public treasury;
    bool public paused;

    address public immutable finder;

    IERC20 public immutable currency;
    OptimisticOracleV3Interface public immutable oo;

    TokenFactory public immutable factory;

    bytes32 public immutable defaultIdentifier;

    uint64 public constant assertionLiveness = 7200;

    bytes public constant unresolvable = "Unresolvable";

    uint256 private marketNonce;    

    /* ---------------- Structs ---------------- */

    struct Market {
        bool resolved;
        bytes32 assertedOutcomeId;
        bytes32 finalOutcomeId;

        ExpandedERC20 outcome1Token;
        ExpandedERC20 outcome2Token;

        uint256 reward;
        uint256 requiredBond;

        bytes outcome1;
        bytes outcome2;
        bytes description;
    }

    struct AssertedMarket {
        address asserter;
        bytes32 marketId;
    }

    /* ---------------- Mappings ---------------- */

    mapping(bytes32 => Market) public markets;
    mapping(bytes32 => AssertedMarket) public assertedMarkets;
    uint256 public marketCount;

    /* ---------------- Events ---------------- */

    event MarketInitialized(bytes32 id);
    event MarketResolved(bytes32 id);

    event OutcomeTokensCreated(
        bytes32 indexed marketId,
        address indexed user,
        uint256 amount
    );

    event OutcomeTokensRedeemed(
        bytes32 indexed marketId,
        address indexed user,
        uint256 amount
    );

    event AssertionSubmitted(
        bytes32 indexed marketId,
        bytes32 indexed assertionId,
        address indexed asserter,
        string outcome
    );

    event AssertionRejected(
        bytes32 indexed marketId,
        bytes32 indexed assertionId
    );

    /* ---------------- Modifiers ---------------- */

    modifier onlyTreasury() {
        require(msg.sender == treasury, "Not treasury");
        _;
    }

    modifier active() {
        require(!paused, "Paused");
        _;
    }

    /* ---------------- Constructor ---------------- */
    // ⚠️ MUST stay at 3 args (tests depend on this)

    constructor(
    address _finder,
    address _currency,
    address _oo
) {
    finder = _finder;
    currency = IERC20(_currency);
    oo = OptimisticOracleV3Interface(_oo);

    defaultIdentifier = bytes32("ASSERT_TRUTH");

    factory = new TokenFactory();
    treasury = msg.sender;
}


    /* ---------------- Admin ---------------- */

    function pause() external onlyTreasury {
        paused = true;
    }

    function unpause() external onlyTreasury {
        paused = false;
    }

    /**
     * @notice Initializes a new prediction market.
    *
    * @dev
    * Economic flow:
    * - Creator deposits `reward` tokens as incentive.
    * - These tokens are locked in the contract until resolution.
    * - Reward is paid to the truthful asserter after resolution.
    *
    * Market lifecycle starts after this call.
    *
    * @param o1 First outcome label.
    * @param o2 Second outcome label.
    * @param d Market description.
    * @param reward Incentive paid to correct asserter.
    * @param bond Bond required for assertions.
    *
    * @return id Unique market identifier.
    */

    function initializeMarket(
    string memory o1,
    string memory o2,
    string memory d,
    uint256 reward,
    uint256 bond
)
    external
    active
    returns (bytes32 id)
{
    require(bytes(o1).length > 0, "Empty first outcome");
    require(bytes(o2).length > 0, "Empty second outcome");
    require(bytes(d).length > 0, "Empty description");

    require(
        keccak256(bytes(o1)) != keccak256(bytes(o2)),
        "Outcomes are the same"
    );

    // Robust unique ID
    id = keccak256(
        abi.encode(
            msg.sender,
            d,
            block.timestamp,
            marketNonce
        )
    );

    marketNonce++;

    require(
        address(markets[id].outcome1Token) == address(0),
        "Market already exists"
    );

    ExpandedERC20 t1 =
        factory.create(
            string(abi.encodePacked(o1, " Token")),
            "O1"
        );

    ExpandedERC20 t2 =
        factory.create(
            string(abi.encodePacked(o2, " Token")),
            "O2"
        );

    markets[id] = Market(
        false,
        bytes32(0),
        bytes32(0),
        t1,
        t2,
        reward,
        bond,
        bytes(o1),
        bytes(o2),
        bytes(d)
    );

    if (reward > 0) {
        currency.safeTransferFrom(
            msg.sender,
            address(this),
            reward
        );
    }

    emit MarketInitialized(id);
}


    /**
     * @notice Submits an outcome assertion to the UMA Optimistic Oracle.
    *
    * @dev
    * Economic flow:
    * - Caller stakes `requiredBond` tokens.
    * - Bond is transferred to this contract.
    * - Contract approves UMA Oracle to pull the bond.
    * - If assertion is truthful:   
    *      → Bond is returned by UMA.
    *      → Caller receives `reward`.
    * - If assertion is false:
    *      → Bond is slashed by UMA.
    *      → Reward is not paid.
    *
    * Only one active assertion per market is allowed at a time.
    *
    * @param id Market identifier.
    * @param out Outcome being asserted.
    *
    * @return aid UMA assertion identifier.
    */


    function assertMarket(
        bytes32 id,
        string memory out
    )
        external
        active
        returns (bytes32 aid)
    {
        Market storage m = markets[id];

        require(
            address(m.outcome1Token) != address(0),
            "Market does not exist"
        );

        require(!m.resolved, "Assertion active");

        require(
            m.assertedOutcomeId == bytes32(0),
            "Assertion active or resolved"
        );

        bytes32 h = keccak256(bytes(out));

        bytes32 h1 = keccak256(m.outcome1);
        bytes32 h2 = keccak256(m.outcome2);
        bytes32 hu = keccak256(unresolvable);

        require(
            h == h1 || h == h2 || h == hu,
            "Invalid outcome"
        );

        m.assertedOutcomeId = h;

        uint256 minBond =
            oo.getMinimumBond(address(currency));

        uint256 bond =
            m.requiredBond > minBond
                ? m.requiredBond
                : minBond;

        bytes memory claim =
            MarketUtils.composeClaim(
                out,
                m.description,
                block.timestamp
            );

        currency.safeTransferFrom(
            msg.sender,
            address(this),
            bond
        );

        currency.safeApprove(address(oo), 0);
        currency.safeApprove(address(oo), bond);

        aid = oo.assertTruth(
            claim,
            msg.sender,
            address(this),
            address(0),
            assertionLiveness,
            currency,
            bond,
            defaultIdentifier,
            bytes32(0)
        );

        assertedMarkets[aid] =
            AssertedMarket(msg.sender, id);

        emit AssertionSubmitted(
            id,
            aid,
            msg.sender,
            out
        );  
    }

    /* ---------------- Oracle ---------------- */

    function assertionResolvedCallback(
        bytes32 aid,
        bool ok
    )
        external
        override
    {
        require(msg.sender == address(oo), "Not oracle");

        AssertedMarket memory a =
            assertedMarkets[aid];

        Market storage m =
            markets[a.marketId];

        if (ok) {
            m.resolved = true;
            m.finalOutcomeId = m.assertedOutcomeId;

            if (m.reward > 0) {
                currency.safeTransfer(
                    a.asserter,
                    m.reward
                );
            }

            emit MarketResolved(a.marketId);
        } else {
            m.assertedOutcomeId = bytes32(0);

            emit AssertionRejected(
                a.marketId,
                aid
                );
        }

        delete assertedMarkets[aid];
    }

    function assertionDisputedCallback(bytes32)
        external
        override
    {}

    /**
    * ------------------------------------------------------------
    * ECONOMIC MODEL OVERVIEW
     * ------------------------------------------------------------
    *
    * 1. Market Creation
    * ------------------
    * - Creator optionally deposits `reward` tokens.
    * - These tokens are held by this contract.
    * - Reward is paid to the truthful asserter after resolution.
    *
    * 2. Assertion Phase
    * ------------------
    * - An asserter stakes a `bond` (minimum enforced by UMA).
    * - Bond is transferred to this contract.
    * - Contract approves UMA to pull the bond.
    *
    * 3. Resolution
    * -------------
    * - If assertion is truthful:
    *     -> UMA returns bond to asserter.
    *     -> Contract pays `reward` to asserter.
    *
    * - If assertion is false:
    *     -> UMA slashes bond.
    *     -> No reward is paid.
    *     -> Market can be re-asserted.
    *
    * 4. Outcome Tokens
    * ----------------
    * - Users deposit collateral to mint paired outcome tokens.
    * - Tokens represent positions on each outcome.
    *
    * 5. Early Exit (Pre-Resolution)
    * -----------------------------
    * - Users may burn both outcome tokens before resolution.
    * - They receive their collateral back.
    *
    * 6. Settlement (Post-Resolution)
    * -------------------------------
    * - Winning token holders redeem full collateral.
    * - Losing side receives nothing.
    * - If outcome is "Unresolvable":
    *     -> Both sides receive half payout.
    */

    /* ---------------- Tokens ---------------- */

    function createOutcomeTokens(
        bytes32 id,
        uint256 amt
    )
        external
        active
    {
        Market storage m = markets[id];

        require(address(m.outcome1Token) != address(0), "Market does not exist");
        require(!m.resolved, "Market already resolved");

        currency.safeTransferFrom(
            msg.sender,
            address(this),
            amt
        );

        m.outcome1Token.mint(msg.sender, amt);
        m.outcome2Token.mint(msg.sender, amt);

        emit OutcomeTokensCreated(
            id,
            msg.sender,
            amt
        );

    }

    /**
     * @notice Redeem outcome tokens before market resolution.
    *
    * @dev
    * Allows users to exit positions early by burning both outcome tokens
    * and reclaiming collateral.
    *
    * This functions as a "pre-resolution unwind" mechanism and is
    * intentionally permitted before oracle resolution.
    *
    * Users forfeit any claim to future rewards when using this.
     */

    function redeemOutcomeTokens(
        bytes32 id,
        uint256 amt
    )
        external
        active
        nonReentrant
    {
        Market storage m = markets[id];

        require(
            address(m.outcome1Token) != address(0),
            "Market does not exist"
        );

        m.outcome1Token.burnFrom(msg.sender, amt);
        m.outcome2Token.burnFrom(msg.sender, amt);

        currency.safeTransfer(msg.sender, amt);

        emit OutcomeTokensRedeemed(
            id,
            msg.sender,
            amt
        );
    }

    function settleOutcomeTokens(bytes32 id)
        external
        active
        nonReentrant
        returns (uint256 out)
    {
        Market storage m = markets[id];

        require(m.resolved, "Market not resolved");

        uint256 b1 =
            m.outcome1Token.balanceOf(msg.sender);

        uint256 b2 =
            m.outcome2Token.balanceOf(msg.sender);

        require(b1 > 0 || b2 > 0, "No tokens");

        if (m.finalOutcomeId == keccak256(m.outcome1)) {
            out = b1;
        }
        else if (m.finalOutcomeId == keccak256(m.outcome2)) {
            out = b2;
        }
        else {
            out = (b1 + b2) / 2;
        }

        m.outcome1Token.burnFrom(msg.sender, b1);
        m.outcome2Token.burnFrom(msg.sender, b2);

        currency.safeTransfer(msg.sender, out);
    }

    /* ---------------- View ---------------- */

    function getMarket(bytes32 id)
        external
        view
        returns (Market memory)
    {
        return markets[id];
    }
}
