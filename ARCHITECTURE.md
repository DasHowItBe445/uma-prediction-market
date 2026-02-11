# System Architecture – UMA Prediction Market

```mermaid
flowchart TD

    User -->|Create Market| MyPredictionMarket
    User -->|Assert Outcome| MyPredictionMarket
    User -->|Mint Outcome Tokens| MyPredictionMarket
    User -->|Redeem / Settle| MyPredictionMarket

    MyPredictionMarket -->|Creates Tokens| TokenFactory
    TokenFactory --> ExpandedERC20

    MyPredictionMarket -->|Submits Assertion| UMA_OO[Optimistic Oracle V3]
    UMA_OO -->|Callback| MyPredictionMarket

    MyPredictionMarket -->|Transfers Collateral| ERC20[Collateral Token]

    subgraph Oracle Layer
        UMA_OO
    end

    subgraph Market Layer
        MyPredictionMarket
        TokenFactory
        ExpandedERC20
    end

