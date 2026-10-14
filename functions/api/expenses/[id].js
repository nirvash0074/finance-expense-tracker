export async function onRequest(context) {
  const { request, env, params } = context;
  const id = params.id;
  try {
    if (request.method === 'PUT') {
      const body = await request.json();
      const { categoryId, amount, date, note, receiptUrl } = body;
      const rows = await (await import('../../lib/googleSheetsWorker.js')).readRange('Expenses!A2:H', env);
      const idx = (rows || []).findIndex((r) => r[0] === id);
      if (idx === -1) return new Response(JSON.stringify({ ok: false, error: 'expense not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      const rowIndex = idx + 2;
      const r = rows[idx];
      const newRow = [id, r[1] || '', categoryId ?? r[2] || '', amount != null ? String(amount) : r[3] || '', date ?? r[4] || '', note ?? r[5] || '', receiptUrl ?? r[6] || '', r[7] || new Date().toISOString()];
      await (await import('../../lib/googleSheetsWorker.js')).updateRange(`Expenses!A${rowIndex}`, newRow, env);
      return new Response(JSON.stringify({ ok: true, expense: { id, ...newRow } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (request.method === 'DELETE') {
      const rows = await (await import('../../lib/googleSheetsWorker.js')).readRange('Expenses!A2:A', env);
      const idx = (rows || []).findIndex((r) => r[0] === id);
      if (idx === -1) return new Response(JSON.stringify({ ok: false, error: 'expense not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      const rowIndex = idx + 2;
      await (await import('../../lib/googleSheetsWorker.js')).deleteRowByIndex('Expenses', rowIndex, env);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: false, error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
