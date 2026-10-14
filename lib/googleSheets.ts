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

async function sheetsClient() {
  const auth = getJwtClient();
  await auth.authorize();
  return google.sheets({ version: "v4", auth });
}

export async function readRange(range: string) {
  const s = await sheetsClient();
  const sheetId = process.env.SHEET_ID;
  if (!sheetId) throw new Error("SHEET_ID missing in env");
  const res = await s.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });
  return res.data.values || [];
}

export async function appendRow(range: string, values: (string | number)[]) {
  const s = await sheetsClient();
  const sheetId = process.env.SHEET_ID!;
  const res = await s.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [values] },
  });
  return res.data;
}

export async function updateRange(rangeStart: string, values: (string | number)[] | (string | number)[][]) {
  // rangeStart e.g. "Expenses!A5"; values: array or array of arrays
  const s = await sheetsClient();
  const sheetId = process.env.SHEET_ID!;
  const bodyValues = Array.isArray(values[0]) ? (values as (string | number)[][]) : [values as (string | number)[]];
  const res = await s.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: rangeStart,
    valueInputOption: "RAW",
    requestBody: { values: bodyValues },
  });
  return res.data;
}

export async function findRowIndexById(sheetName: string, id: string) {
  // searches column A for the id; returns 1-based row index in the sheet (including header), or -1 if not found
  const rows = await readRange(`${sheetName}!A2:A`);
  for (let i = 0; i < rows.length; i++) {
    const cell = rows[i][0];
    if (cell === id) return i + 2; // +2 because A2 is index 0
  }
  return -1;
}

export async function deleteRowByIndex(sheetName: string, rowIndex: number) {
  // rowIndex is 1-based within sheet (including header). We'll compute zero-based indices for batchUpdate.
  const s = await sheetsClient();
  const sheetId = process.env.SHEET_ID!;

  // fetch spreadsheet metadata to find sheetId for the sheetName
  const meta = await s.spreadsheets.get({ spreadsheetId: sheetId });
  const sheet = (meta.data.sheets || []).find((sh) => sh.properties?.title === sheetName);
  if (!sheet) throw new Error(`Sheet ${sheetName} not found`);
  const sid = sheet.properties!.sheetId!;

  const requests = [
    {
      deleteDimension: {
        range: {
          sheetId: sid,
          dimension: "ROWS",
          startIndex: rowIndex - 1,
          endIndex: rowIndex,
        },
      },
    },
  ];

  const res = await s.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: { requests },
  });
  return res.data;
}
