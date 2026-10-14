export async function onRequest(context) {
  const { request, env } = context;
  try {
    if (request.method === 'GET') {
      const rows = await (await import('../lib/googleSheetsWorker.js')).readRange('Months!A2:F', env);
      const months = (rows || []).map((r) => ({ id: r[0], year: Number(r[1]), month: Number(r[2]), name: r[3], createdAt: r[4], deleted: r[5] === 'true' }));
      const active = months.filter((m) => !m.deleted);
      return new Response(JSON.stringify({ ok: true, months: active }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const { year, month, name } = body;
      if (!year || !month) return new Response(JSON.stringify({ ok: false, error: 'year and month required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      await (await import('../lib/googleSheetsWorker.js')).appendRow('Months!A2:F', [id, String(year), String(month), name || `${month}/${year}`, createdAt, 'false'], env);
      return new Response(JSON.stringify({ ok: true, month: { id, year, month, name, createdAt } }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: false, error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
