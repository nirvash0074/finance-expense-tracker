# Sheets Expense Tracker (Starter)

This is a starter Next.js + TypeScript project that uses Google Sheets as the database via the Google Sheets API.

Quick start
1. Copy .env.example -> .env.local and fill in:
   - GOOGLE_SERVICE_ACCOUNT_EMAIL
   - GOOGLE_PRIVATE_KEY (replace real newlines with \n)
   - SHEET_ID

2. Create and share the Google Sheet with the service account email (view/edit).
   - Share the sheet (in Google Sheets) with the service account email.

3. Install & run:
   npm install
   npm run dev
   Open http://localhost:3000

Google Sheets schema (tabs & columns)
- Months (sheet/tab name: "Months")
  Columns row (A1..): id, year, month, name, createdAt, deleted
- Categories (sheet/tab name: "Categories")
  Columns: id, name, color, createdAt
- Budgets (sheet/tab name: "Budgets")
  Columns: id, monthId, categoryId, amount
- Expenses (sheet/tab name: "Expenses")
  Columns: id, monthId, categoryId, amount, date, note, receiptUrl, createdAt

You can add/remove columns freely; the API expects these column headers.

API routes
- GET /api/months
- POST /api/months
- GET /api/months/[id]/expenses
- POST /api/months/[id]/expenses

Extend:
- Add update/delete via batchUpdate (delete rows) or soft-delete flag.
- Add charts using Chart.js / Recharts in the frontend.
- Add Google OAuth if you prefer interactive user auth instead of a service account.
