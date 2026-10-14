export async function onRequest(context) {
  const { request, env, params } = context;
  const monthId = params.id;
  try {
    if (request.method === 'GET') {
      const rows = await (await import('../../lib/googleSheetsWorker.js')).readRange('Budgets!A2:D', env);
      const budgets = (rows || []).map((r) => ({ id: r[0], monthId: r[1], categoryId: r[2], amount: Number(r[3] || 0) }));
      const filtered = budgets.filter((b) => b.monthId === monthId);
      return new Response(JSON.stringify({ ok: true, budgets: filtered }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const { categoryId, amount } = body;
      if (!categoryId || amount == null) return new Response(JSON.stringify({ ok: false, error: 'categoryId and amount required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      const id = crypto.randomUUID();
      await (await import('../../lib/googleSheetsWorker.js')).appendRow('Budgets!A2:D', [id, String(monthId), categoryId, String(amount)], env);
      return new Response(JSON.stringify({ ok: true, budget: { id, monthId, categoryId, amount } }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: false, error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
