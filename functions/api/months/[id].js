export async function onRequest(context) {
  const { request, env, params } = context;
  const id = params.id;
  try {
    const gs = await import('../../lib/googleSheetsWorker.js');
    const rows = await gs.readRange('Months!A2:F', env);
    const idx = (rows || []).findIndex((r) => r[0] === id);
    if (idx === -1) return new Response(JSON.stringify({ ok: false, error: 'month not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    const rowIndex = idx + 2;
    const current = rows[idx];

    if (request.method === 'PUT') {
      const { name } = await request.json();
      const newRow = [id, current[1], current[2], name ?? current[3], current[4] ?? new Date().toISOString(), current[5] ?? 'false'];
      await gs.updateRange(`Months!A${rowIndex}`, newRow, env);
      return new Response(JSON.stringify({ ok: true, month: { id, year: Number(newRow[1]), month: Number(newRow[2]), name: newRow[3] } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (request.method === 'DELETE') {
      const body = await request.json().catch(()=>({}));
      const { moveToMonthId, hard } = body || {};
      const expRows = await gs.readRange('Expenses!A2:H', env);
      for (let i = 0; i < (expRows || []).length; i++) {
        const r = expRows[i];
        if (r[1] === id) {
          const rowIndexExp = i + 2;
          if (moveToMonthId) {
            await gs.updateRange(`Expenses!B${rowIndexExp}`, [moveToMonthId], env);
          } else if (hard) {
            await gs.updateRange(`Expenses!B${rowIndexExp}`, [''], env);
          }
        }
      }
      await gs.updateRange(`Months!F${rowIndex}`, ['true'], env);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: false, error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
