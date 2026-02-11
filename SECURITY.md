# Security Policy

## Overview

This project implements a prediction market powered by UMA Optimistic Oracle V3.

Security has been considered in the following areas:

- Access control
- Oracle callback validation
- ERC20 allowance handling
- Reentrancy protection
- Market isolation
- Bond and reward economics

## Reporting Vulnerabilities

If you discover a security issue, please report it responsibly.

Contact:
- Maintainer: Sanjana S Das
- Email: (add if you want, optional)

Please do not open public issues for critical vulnerabilities.

## Security Measures

### 1. Access Control
- Treasury-only admin functions
- OracleAdapter bound to market
- Oracle callbacks validated

### 2. Economic Safety
- Minimum bond enforced
- Reward escrowed
- UMA dispute handling

### 3. Reentrancy Protection
- nonReentrant guard on payout functions

### 4. Allowance Safety
- Approvals reset before reuse

### 5. Oracle Safety
- Only UMA oracle may resolve assertions

## Disclaimer

This project is provided for educational and research purposes.
Not audited for mainnet deployment.
