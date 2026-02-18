# Prediction Market Test Report

## Environment
- Network: Sepolia
- Currency: USDC (6 decimals)
- Oracle: UMA OOv3

---

## Market Creation

| Case | Input | Expected | Result |
|------|--------|----------|--------|
| Valid | 1 / 0.5 | Success | ✅ |
| Zero reward | 0 / 0.5 | Success | ✅ |
| Empty outcome | "" | Fail | ✅ |
| Negative | -1 | Fail | ✅ |

---

## Minting

| Case | Input | Expected | Result |
|------|--------|----------|--------|
| Normal | 1 | Success | ✅ |
| Over balance | 1000 | Fail | ✅ |

---

## Assertion

| Case | Input | Expected | Result |
|------|--------|----------|--------|
| Valid | Yes | Success | ✅ |
| Invalid | Random | Fail | ✅ |

---

## Redemption

| Case | Input | Expected | Result |
|------|--------|----------|--------|
| Before resolve | 1 | Success | ✅ |
| After resolve | 1 | Fail | ✅ |
