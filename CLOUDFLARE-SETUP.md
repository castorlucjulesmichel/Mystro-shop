# Mystro-Shop — Cloudflare Worker setup

The repository contains `worker.js` and `wrangler.toml` for the Mystro-Shop API.

## Public/non-secret variables

- `APP_ORIGIN=https://castorlucjulesmichel.github.io`
- `FIREBASE_PROJECT_ID=mystroshop-eab92`
- `MONCASH_MODE=sandbox` while testing
- `PAYM_BASE_URL` only if NatCash is configured through a supported provider
- `FX_USD_HTG`, `FX_EUR_HTG`, `FX_CAD_HTG`, `FX_GBP_HTG`, `FX_DOP_HTG`, `FX_XOF_HTG` must be valid server-side conversion rates before purchases in those currencies are accepted.

## Secrets — Cloudflare only

Never commit these values to GitHub or put them in `index.html`, `checkout.html`, or `script.js`.

- `FIREBASE_WEB_API_KEY`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `MONCASH_CLIENT_ID`
- `MONCASH_CLIENT_SECRET`
- `PAYM_CLIENT_ID` if NatCash is configured through that provider
- any future payment-provider secret

## Expected API routes

- `GET /` — API health
- `POST /moncash/deposit` — create MonCash wallet top-up
- `POST /moncash/verify` — verify and credit MonCash top-up once
- `POST /natcash/deposit` — create NatCash wallet top-up when provider is configured
- `POST /natcash/verify` — verify and credit NatCash top-up once
- `POST /orders/create` — server recalculates product price, stock, 10% commission, and delivery
- `POST /wallet/pay-order` — debit buyer wallet, credit seller(s) 90%, record Mystro-Shop 10%, update stock, mark order paid

## Financial rules

- Product sale price: seller receives 90%; Mystro-Shop receives 10%.
- The 10% commission is not added to the buyer's product price.
- Home delivery is separate: 1000 HTG per product in HTG checkout; equivalent configured rules can be presented in USD/EUR on the storefront.
- Browser code must never directly increase balances, mark a payment as paid, or credit a seller.

## Deployment safety

1. Keep `MONCASH_MODE=sandbox` until the complete flow is tested.
2. Configure Cloudflare secrets privately in the Worker dashboard.
3. Configure the required FX rates before allowing non-HTG products to be purchased through the wallet flow.
4. Deploy `worker.js`.
5. Test `GET /`.
6. Test authentication-protected routes with a test account.
7. Test a small top-up. Confirm the wallet is credited only after provider verification.
8. Test one small order. Confirm buyer debit, seller 90% credit, Mystro-Shop 10% commission, delivery separation, stock decrement, and `paid` order status.
9. Only after successful testing should MonCash be switched to live mode.

## Important

A GitHub commit does not deploy the Worker automatically unless a Cloudflare deployment integration is configured. The live endpoint must be verified separately after deployment.
