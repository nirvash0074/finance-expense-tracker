Cloudflare Pages deployment (added)

This repository is prepared to deploy to Cloudflare Pages with Pages Functions.

Quick deploy steps

1) Install additional dependencies locally:
   npm install jose
   npm install -D @cloudflare/next-on-pages

2) Build the project (this will run the postbuild adapter that prepares Pages output):
   npm run build

   - The postbuild script runs `next-on-pages` to generate a Pages-compatible output in `.cloudflare_pages`.

3) Create a Cloudflare Pages project and connect your GitHub repo.

4) In the Pages project settings, set the build command and output directory (if not auto-detected):
   - Build command: npm run build
   - Output directory: .cloudflare_pages

5) Add required environment variables (Project → Settings → Environment Variables & Secrets):
   - GOOGLE_SERVICE_ACCOUNT_EMAIL  (service account client_email)
   - GOOGLE_PRIVATE_KEY           (paste the full PEM private key; Cloudflare supports multiline secrets)
   - SHEET_ID                     (your Google Sheet ID)

6) Deploy. Cloudflare will publish your site and expose Functions from the `functions/` folder as `/api/*` endpoints.

Local testing of Pages Functions (optional)
- Install Wrangler (if you want local Functions dev):
  npm i -g @cloudflare/wrangler
- Run local Pages dev (example):
  npx wrangler pages dev . --bindings "GOOGLE_SERVICE_ACCOUNT_EMAIL=..." --bindings "SHEET_ID=..." 
  For the private key, you can create a .dev.vars file and use `wrangler pages dev . --env varfile` or pass secrets via wrangler.

Notes
- Make sure the Google Sheet is shared with the service account email (Editor) and contains the tabs: Months, Categories, Budgets, Expenses (see README for headers).
- Do NOT commit the private key. Use Cloudflare Pages secrets.
