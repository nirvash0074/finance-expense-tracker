export async function onRequest(context) {
  const { request, env, params } = context;
  const monthId = params.id;
  try {
    if (request.method === 'GET') {
      const rows = await (await import('../../lib/googleSheetsWorker.js')).readRange('Expenses!A2:H', env);
      const expenses = (rows || []).map((r) => ({ id: r[0], monthId: r[1], categoryId: r[2], amount: Number(r[3]), date: r[4], note: r[5], receiptUrl: r[6], createdAt: r[7] }));
      const filtered = expenses.filter((e) => e.monthId === monthId);
      return new Response(JSON.stringify({ ok: true, expenses: filtered }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const { categoryId, amount, date, note, receiptUrl } = body;
      if (!categoryId || amount == null || !date) return new Response(JSON.stringify({ ok: false, error: 'categoryId, amount, date required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      await (await import('../../lib/googleSheetsWorker.js')).appendRow('Expenses!A2:H', [id, String(monthId), categoryId, String(amount), date, note || '', receiptUrl || '', createdAt], env);
      return new Response(JSON.stringify({ ok: true, expense: { id, monthId, categoryId, amount, date, note, receiptUrl, createdAt } }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: false, error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
