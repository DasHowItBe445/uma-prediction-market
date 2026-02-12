# Threat Model – UMA Prediction Market

## Overview

This document describes potential threats, risks, and mitigations
for the UMA-based prediction market system.

The system integrates:

- UMA Optimistic Oracle V3
- ERC20 collateral
- Outcome tokens
- Bond-based incentive mechanisms

---

## 1. Oracle Manipulation

### Threat
Malicious actor submits false outcome and attempts to avoid dispute.

### Mitigation
- UMA dispute window enforced
- Bond requirement
- Economic penalty on false assertion
- Re-assertion enabled after failed assertion

---

## 2. Unauthorized Oracle Callbacks

### Threat
Attacker attempts to call oracle resolution functions directly.

### Mitigation
- `require(msg.sender == address(oo))`
- Interface enforcement
- Callback recipient inheritance

---

## 3. Reentrancy Attacks

### Threat
Reentrant calls during settlement or redemption.

### Mitigation
- `nonReentrant` modifier
- Checks-effects-interactions pattern
- SafeERC20 transfers

---

## 4. ERC20 Allowance Exploitation

### Threat
Malicious ERC20 tokens exploiting approval race conditions.

### Mitigation
- Allowance reset to zero before approval
- SafeERC20 wrappers

---

## 5. Market ID Collisions

### Threat
Multiple markets overwrite each other.

### Mitigation
- Nonce-based hashing
- Sender + timestamp + nonce

---

## 6. Economic Attacks

### Threat
Attacker manipulates bonds/rewards to drain funds.

### Mitigation
- Minimum UMA bond enforced
- Reward escrow
- No early reward withdrawal

---

## 7. Front-Running

### Threat
Attacker front-runs market creation.

### Mitigation
- Unique ID generation
- Creator-bound market metadata

---

## 8. Denial of Service

### Threat
Market stuck in unresolved state.

### Mitigation
- UMA fallback resolution
- Reassertion support
- Dispute callbacks

---

## 9. Privilege Abuse

### Threat
Treasury misuses pause/unpause.

### Mitigation
- Limited admin scope
- Transparent on-chain state

---

## 10. Token Manipulation

### Threat
Malicious mint/burn abuse.

### Mitigation
- Controlled TokenFactory
- No external mint access

---

## Disclaimer

This threat model reflects current known risks.
New vulnerabilities may exist.
