# Mystro-Shop — Cloudflare Worker production setup

The repository contains the current `worker.js` and `wrangler.toml` for the Mystro-Shop API.

## Public variables

- `APP_ORIGIN=https://castorlucjulesmichel.github.io`
- `FIREBASE_PROJECT_ID=mystroshop-eab92`
- `MONCASH_MODE=live` because the existing Mystro-Shop MonCash flow is intended to remain in production mode.
- `PAYM_BASE_URL` only when the NatCash provider is officially configured.

Live display/exchange rates are fetched server-side from an online FX feed. If the feed is unavailable, wallet exchange must fail instead of inventing a rate.

## Cloudflare secrets / protected variables

Never commit these values to GitHub, `index.html`, `checkout.html`, or `script.js`:

- `FIREBASE_WEB_API_KEY`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `MONCASH_CLIENT_ID`
- `MONCASH_CLIENT_SECRET`
- `PAYM_CLIENT_ID` when NatCash is enabled through that provider
- `MONCASH_PAYOUT_URL` and `MONCASH_PAYOUT_TOKEN` only if an authorized MonCash payout service is actually available to the account
- `NATCASH_PAYOUT_URL` and `NATCASH_PAYOUT_TOKEN` only if an authorized NatCash payout service is actually available

## API routes in the repository

- `GET /` — API health and configured MonCash mode
- `GET /fx/rates` — online FX rates
- `POST /moncash/deposit` — create MonCash wallet recharge
- `POST /moncash/verify` — verify and credit a MonCash recharge once
- `POST /natcash/deposit` — create NatCash recharge when its provider is configured
- `POST /natcash/verify` — verify and credit NatCash once
- `POST /moncash/withdraw` — authorized payout route only when a real payout endpoint/token is configured
- `POST /natcash/withdraw` — authorized payout route only when configured
- `POST /wallet/exchange` — exchange balances using an online FX rate
- `POST /orders/create` — recalculate product prices, stock and delivery server-side
- `POST /wallet/pay-order` — debit buyer, credit seller(s), update stock and record internal platform revenue
- `POST /payout/request` — record BNC/Unibank/Ria/MoneyGram requests for review; this is not itself a completed bank or money-transfer transaction

## Financial privacy

The buyer and seller interfaces do not display the platform's internal percentage split. Internal financial allocation is performed by the Worker and recorded in the protected platform ledger. Delivery remains separate from the product price.

## Before redeploying the Worker

1. Confirm all existing Firebase and MonCash secrets are still present in Cloudflare.
2. Do not overwrite working production secrets with placeholders.
3. If authorized payout credentials are not available, leave the payout variables unset; the API will return a clear `*_WITHDRAW_NOT_CONFIGURED` error rather than pretending a withdrawal succeeded.
4. Deploy `worker.js`.
5. Verify `GET /` reports `ok: true` and the expected MonCash mode.
6. Test a small recharge and confirm the balance changes only after provider verification.
7. Test a small order and confirm buyer debit, seller credit, stock decrement, delivery separation and `paid` status.
8. Test wallet FX with a very small amount.

A GitHub commit does not deploy the Cloudflare Worker by itself unless a Cloudflare/GitHub deployment integration is configured.

Deployment trigger note: the Cloudflare Git integration for `castorlucjulesmichel/Mystro-shop` was reconnected and this commit is intentionally used to start the first Git-based Worker build.

Second deployment trigger: GitHub-to-Cloudflare build connection rechecked on 2026-09-11.