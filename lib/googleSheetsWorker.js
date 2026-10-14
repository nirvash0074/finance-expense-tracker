import { importPKCS8, SignJWT } from 'jose';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

let cachedToken = null;
let cachedExpiry = 0;

async function getAccessToken(env) {
  const clientEmail = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = env.GOOGLE_PRIVATE_KEY;
  if (!clientEmail || !privateKey) throw new Error('Missing service account env (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY)');

  if (cachedToken && Date.now() < cachedExpiry - 60 * 1000) {
    return cachedToken;
  }

  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: clientEmail,
    scope: SCOPES.join(' '),
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  const pk = await importPKCS8(privateKey, 'RS256');
  const jwt = await new SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime('1h')
    .sign(pk);

  const body = new URLSearchParams();
  body.set('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
  body.set('assertion', jwt);

  const tokenRes = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const tokenJson = await tokenRes.json();
  if (!tokenJson.access_token) throw new Error('Failed to obtain access_token: ' + JSON.stringify(tokenJson));

  cachedToken = tokenJson.access_token;
  cachedExpiry = Date.now() + (tokenJson.expires_in || 3600) * 1000;
  return cachedToken;
}

async function sheetsFetch(pathSuffix, env, opts = {}) {
  const token = await getAccessToken(env);
  const sheetId = env.SHEET_ID;
  if (!sheetId) throw new Error('SHEET_ID missing in env');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/${pathSuffix}`;
  const headers = Object.assign({}, opts.headers || {});
  headers['Authorization'] = `Bearer ${token}`;
  if (opts.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  const res = await fetch(url, Object.assign({}, opts, { headers }));
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function readRange(range, env) {
  const encoded = encodeURIComponent(range);
  const data = await sheetsFetch(`values/${encoded}`, env, { method: 'GET' });
  return data.values || [];
}

export async function appendRow(range, values, env) {
  const encoded = encodeURIComponent(range);
  const res = await sheetsFetch(`values/${encoded}:append?valueInputOption=RAW`, env, {
    method: 'POST',
    body: JSON.stringify({ values: [values] }),
  });
  return res;
}

export async function updateRange(rangeStart, values, env) {
  const encoded = encodeURIComponent(rangeStart);
  const vals = Array.isArray(values[0]) ? values : [values];
  const res = await sheetsFetch(`values/${encoded}?valueInputOption=RAW`, env, {
    method: 'PUT',
    body: JSON.stringify({ values: vals }),
  });
  return res;
}

export async function getSpreadsheetMeta(env) {
  return await sheetsFetch('', env, { method: 'GET' });
}

export async function deleteRowByIndex(sheetName, rowIndex, env) {
  const meta = await getSpreadsheetMeta(env);
  const sheet = (meta.sheets || []).find((s) => s.properties && s.properties.title === sheetName);
  if (!sheet) throw new Error(`Sheet ${sheetName} not found`);
  const sid = sheet.properties.sheetId;
  const body = {
    requests: [
      {
        deleteDimension: {
          range: {
            sheetId: sid,
            dimension: 'ROWS',
            startIndex: rowIndex - 1,
            endIndex: rowIndex,
          },
        },
      },
    ],
  };
  const res = await sheetsFetch(`:batchUpdate`, env, { method: 'POST', body: JSON.stringify(body) });
  return res;
}

export async function findRowIndexById(sheetName, id, env) {
  const rows = await readRange(`${sheetName}!A2:A`, env);
  for (let i = 0; i < rows.length; i++) {
    const cell = rows[i][0];
    if (cell === id) return i + 2;
  }
  return -1;
}
