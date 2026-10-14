export async function onRequest(context) {
  const { request, env, params } = context;
  const id = params.id;
  try {
    const gs = await import('../../lib/googleSheetsWorker.js');
    const rows = await gs.readRange('Categories!A2:E', env);
    const idx = (rows || []).findIndex((r) => r[0] === id);
    if (idx === -1) return new Response(JSON.stringify({ ok: false, error: 'category not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    const rowIndex = idx + 2;
    const current = rows[idx];

    if (request.method === 'PUT') {
      const { name, color, deleted } = await request.json();
      const newRow = [id, name ?? current[1], color ?? current[2] ?? '#60a5fa', current[3] ?? new Date().toISOString(), deleted === true ? 'true' : deleted === false ? 'false' : (current[4] || 'false')];
      await gs.updateRange(`Categories!A${rowIndex}`, newRow, env);
      return new Response(JSON.stringify({ ok: true, category: { id, name: newRow[1], color: newRow[2], createdAt: newRow[3], deleted: newRow[4] === 'true' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (request.method === 'DELETE') {
      // soft-delete
      await gs.updateRange(`Categories!E${rowIndex}`, ['true'], env);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: false, error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
