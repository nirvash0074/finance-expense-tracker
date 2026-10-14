// Lightweight helper for Google Sheets access (server-side).
import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

function getJwtClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Missing Google service account credentials in env (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY)"
    );
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
  });
}

async function sheets() {
  const auth = getJwtClient();
  await auth.authorize();
  return google.sheets({ version: "v4", auth });
}

export async function readRange(range: string) {
  const s = await sheets();
  const sheetId = process.env.SHEET_ID;
  if (!sheetId) throw new Error("SHEET_ID missing in env");
  const res = await s.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });
  return res.data.values || [];
}

export async function appendRow(range: string, values: (string | number)[]) {
  const s = await sheets();
  const sheetId = process.env.SHEET_ID!;
  const res = await s.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [values] },
  });
  return res.data;
}
