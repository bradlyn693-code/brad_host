# Fluxytech

This complete application is also published in the `brad_host` repository.

nodeX is a Vite + Express + MongoDB WhatsApp bot hosting workspace with secure email authentication, an internal KES wallet, Paystack Redirect checkout, database-backed files, and Heroku Teams deployment.

## Local setup

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Set these values in `.env` before testing:

- `MONGODB_URI`
- `JWT_SECRET`
- `VITE_PAYSTACK_PUBLIC_KEY`
- `PAYSTACK_SECRET_KEY`
- `HEROKU_API_KEY` and `HEROKU_TEAM_NAME`
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, and optional `SMTP_FROM`
- `FRONTEND_URL`

The browser uses `VITE_PAYSTACK_PUBLIC_KEY`. `PAYSTACK_SECRET_KEY`, `HEROKU_API_KEY`, `MONGODB_URI`, `JWT_SECRET`, and SMTP credentials are server-only. Never expose them in frontend code or commit `.env`.

## Implemented APIs

### Authentication

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/verify-reset-code`
- `GET /api/auth/me`

Passwords are bcrypt-hashed. Sessions use JWTs stored in httpOnly cookies. Login email is remembered in `localStorage` under `rememberedEmail`.

### Wallet and Paystack

- `POST /api/wallet/paystack/initialize`
- `POST /api/wallet/paystack/verify`
- `GET /api/wallet/balance`

The frontend initializes a secure Paystack Redirect checkout through `/api/paystack/initialize`. Paystack returns the customer to `/wallet?verify=true&reference=...`; the backend verifies against Paystack using `PAYSTACK_SECRET_KEY`. A verified KES 70 payment credits exactly 70 to the internal, non-withdrawable wallet.

### Files

- `POST /api/files/upload` with `{ filename, content }`
- `GET /api/files`
- `PUT /api/files/:id` with `{ filename, content }`
- `DELETE /api/files/:id`

Files are stored in MongoDB with `userId`, `filename`, `content`, and `size`. The dashboard supports upload, editing, saving, downloading, and deletion. Files are limited to 5 MB each.

### Deployments

- `GET /api/deployments`
- `POST /api/deploy`

Deployment flow:

1. Require a MongoDB-backed file set containing `package.json`.
2. Require at least KES 70 and reserve the balance atomically.
3. Create a Heroku app through `POST https://api.heroku.com/teams/apps` for `HEROKU_TEAM_NAME` on stack `heroku-24`.
4. Set runtime config vars through the Heroku Config Vars API.
5. Create a temporary Git repository, write the user's files, add a default `Procfile` when `index.js` is present, and push to the Heroku Git URL.
6. Scale `web=1` through the Heroku Formation API.
7. Save app URL, team, stack, status, and deployment logs in MongoDB.
8. Refund KES 70 and save a failed deployment record if any stage fails.

The deploy pipeline does not print or persist the Heroku API key in application logs. The temporary Git credentials directory is deleted after each deployment.

## Dashboard pages

- `/` — Overview
- `/files` — My Files with upload, editor, save, download, and delete
- `/deployments` — Heroku release history and app links
- `/wallet` — Paystack Redirect funding
- `/settings` — Account and runtime details
- `/login`, `/signup`, `/forgot-password`

## Production

Build and run the API/static server with:

```bash
pnpm build
pnpm start
```

Set production environment variables in the hosting provider's Secrets, Config Vars, or Environment Variables panel. Use HTTPS so secure cookies work correctly. The Paystack dashboard must use the same live account that owns `PAYSTACK_SECRET_KEY`.


## NodeX Hosting bot catalog

The dashboard now includes `/bots` and featured cards on Overview. The MongoDB `Bot` model seeds two available catalog records: WOLFBOT and LITTLE FOXY. Legacy coming-soon catalog records are removed during startup. The two featured records use the supplied repositories and pair sites:

- WOLFBOT: `https://github.com/WOLVAREX/silentwolf`, pair site `https://pairwolf.wolvarex.com`
- LITTLE FOXY: `https://github.com/WOLVAREX/FOXY`, pair site `https://foxy.pairsite.space`

Public catalog APIs:

- `GET /api/bots/featured`
- `GET /api/bots/all`

Clicking Deploy opens the pair link and session-ID form. The authenticated `POST /api/deploy` accepts `botSlug`, `sessionId`, and `ownerNumber`, deducts KES 70 atomically, clones the selected public repository, sets secure runtime config vars including the runtime `MONGODB_URI`, pushes to Heroku, scales `web=1`, and refunds the wallet if deployment fails. Manage opens `/bots/:slug/logs`.

## Demo workspace

When no real JWT session is present, the frontend automatically opens a clearly labeled `Demo workspace` for UI and file-manager testing. The demo account starts with KES 0. Real Paystack payments and Heroku deployments are blocked in demo mode; authenticated production users retain the normal protected flows.
