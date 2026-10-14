Deployment

You can deploy this app to Vercel. Add the following environment variables in your Vercel project settings (use the same names as .env.example):

- GOOGLE_SERVICE_ACCOUNT_EMAIL
- GOOGLE_PRIVATE_KEY  (paste the full private key; Vercel supports newlines in secret values so you can paste the raw private key)
- SHEET_ID

When configuring GOOGLE_PRIVATE_KEY in Vercel, you can paste the private key as-is (with newlines). Locally we use escaped \n in .env for convenience.

Notes on soft-delete
- Categories are now soft-deleted by setting a "deleted" flag in column E of the Categories sheet. You can view deleted categories by visiting /categories and toggling "Show deleted".
- Months are soft-deleted by setting the "deleted" flag in column F of the Months sheet.

