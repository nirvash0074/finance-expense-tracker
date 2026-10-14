# Sheets Expense Tracker (Starter)

This project uses Google Sheets as the database via the Google Sheets API. I added edit/delete support for expenses, categories, and budgets and a budget editor UI + charts.

Quick start
1. Copy .env.example -> .env.local and fill in:
   - GOOGLE_SERVICE_ACCOUNT_EMAIL
   - GOOGLE_PRIVATE_KEY (replace real newlines with \n)
   - SHEET_ID

2. Create and share the Google Sheet with the service account email (view/edit).

3. Install & run:
   npm install
   npm run dev
   Open http://localhost:3000

Notes on edit/delete
- Expenses: PUT /api/expenses/:id to update, DELETE /api/expenses/:id to delete the row from the sheet.
- Categories: PUT /api/categories/:id to rename/update color, DELETE /api/categories/:id will reassign existing expenses to an "Uncategorized" category (created if missing) and then delete the category row.
- Budgets: PUT /api/budgets/:id to update, DELETE /api/budgets/:id to remove.

Sheet schema (tabs & columns)
- Months: id | year | month | name | createdAt | deleted
- Categories: id | name | color | createdAt
- Budgets: id | monthId | categoryId | amount
- Expenses: id | monthId | categoryId | amount | date | note | receiptUrl | createdAt

If you run into errors about credentials or permissions, check that your service account email is copied to GOOGLE_SERVICE_ACCOUNT_EMAIL and the sheet is shared with that email.
