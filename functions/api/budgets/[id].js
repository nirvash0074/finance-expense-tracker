export async function onRequest(context) {
  const { request, env, params } = context;
  const id = params.id;
  try {
    if (request.method === 'PUT') {
      const { amount, categoryId, monthId } = await request.json();
      const rows = await (await import('../../lib/googleSheetsWorker.js')).readRange('Budgets!A2:D', env);
      const idx = (rows || []).findIndex((r) => r[0] === id);
      if (idx === -1) return new Response(JSON.stringify({ ok: false, error: 'budget not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      const rowIndex = idx + 2;
      const newRow = [id, monthId ?? rows[idx][1], categoryId ?? rows[idx][2], String(amount ?? rows[idx][3] || 0)];
      await (await import('../../lib/googleSheetsWorker.js')).updateRange(`Budgets!A${rowIndex}`, newRow, env);
      return new Response(JSON.stringify({ ok: true, budget: { id, monthId: newRow[1], categoryId: newRow[2], amount: Number(newRow[3]) } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (request.method === 'DELETE') {
      const rows = await (await import('../../lib/googleSheetsWorker.js')).readRange('Budgets!A2:A', env);
      const idx = (rows || []).findIndex((r) => r[0] === id);
      if (idx === -1) return new Response(JSON.stringify({ ok: false, error: 'budget not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      const rowIndex = idx + 2;
      await (await import('../../lib/googleSheetsWorker.js')).deleteRowByIndex('Budgets', rowIndex, env);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: false, error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
