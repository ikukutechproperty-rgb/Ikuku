# Ikuku

Ikuku is a responsive crypto-fintech **demo workspace** built with React, Tailwind CSS, Express, and Supabase. It includes Supabase Auth, live indicative crypto prices from CoinGecko, a protected user dashboard, demo transaction requests, and an admin approval console.

> **Demo only:** cryptocurrency market prices are requested from CoinGecko and may be delayed. Portfolio values, returns, deposits, withdrawals, and plan rates are illustrative. This application does not connect to a wallet, execute trades, move money, or guarantee returns. Do not use it as a production investment or payment platform.

## Requirements

- Node.js 20+ and npm
- A Supabase project

## Local setup

1. Install root and app dependencies:

   ```sh
   npm install
   npm install --prefix client
   npm install --prefix server
   ```

2. In the Supabase SQL Editor, run [`server/supabase/migrations/001_initial_schema.sql`](server/supabase/migrations/001_initial_schema.sql).

3. Configure the API:

   ```powershell
   Copy-Item server\.env.example server\.env
   ```

   Fill in `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from Supabase project settings. Keep the service-role key private and only in `server/.env`. Set `CLIENT_ORIGIN` if the client uses a different origin.

4. Configure the browser client in `client/.env.local`:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_API_URL=http://localhost:3001
   ```

   The anon/publishable key is intended for browser use; never put the service-role key in a `VITE_` variable. Supabase Auth email confirmation can be enabled in the Supabase dashboard.

5. (Optional) Seed the admin account after setting a unique admin password in `server/.env`:

   ```powershell
   npm run seed:admin
   ```

   The admin email defaults to `ikukusdomain@gmail.com` and can be changed with `ADMIN_EMAIL`. Set `ADMIN_PASSWORD` to a unique password of at least 14 characters in the private server environment. Admin credentials are deliberately not hardcoded or shipped as a default login.

6. Start both apps:

   ```sh
   npm run dev
   ```

   - Client: http://localhost:5173
   - API: http://localhost:3001/api/health

   Build the client with `npm run build`; run the API in production with `npm start`.

## Security notes

- The browser uses only the Supabase anon key. The server validates bearer tokens with Supabase Auth and uses the service-role key only for authorized API operations.
- Admin routes check the database role on every request. Never accept role claims from user-editable metadata.
- Row-level security is enabled for user profiles, transactions, and investments. Users can read their own rows; writes and admin actions go through the API.
- The seed command requires a private password provided at runtime. Rotate it using Supabase Auth if needed.
- The included server is a demo foundation, not a financial-services compliance or custody implementation. Add production-grade monitoring, review, and jurisdiction-specific controls before any real-money use.
