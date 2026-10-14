export async function onRequest(context) {
  const { request, env } = context;
  try {
    if (request.method === 'GET') {
      const url = new URL(request.url);
      const includeDeleted = url.searchParams.get('includeDeleted') === 'true';
      const rows = await (await import('../../lib/googleSheetsWorker.js')).readRange('Categories!A2:E', env);
      const categories = (rows || []).map((r) => ({ id: r[0], name: r[1], color: r[2] || '#60a5fa', createdAt: r[3], deleted: r[4] === 'true' }));
      const out = includeDeleted ? categories : categories.filter((c) => !c.deleted);
      return new Response(JSON.stringify({ ok: true, categories: out }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const { name, color } = body;
      if (!name) return new Response(JSON.stringify({ ok: false, error: 'name required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      await (await import('../../lib/googleSheetsWorker.js')).appendRow('Categories!A2:E', [id, name, color || '#60a5fa', createdAt, 'false'], env);
      return new Response(JSON.stringify({ ok: true, category: { id, name, color: color || '#60a5fa', createdAt } }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: false, error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
