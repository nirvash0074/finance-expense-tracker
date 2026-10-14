export async function onRequest(context) {
  const { request, env } = context;
  try {
    const gs = await import('../../lib/googleSheetsWorker.js');
    const rows = await gs.readRange('Expenses!A2:H', env);
    const expenses = (rows || []).map((r) => ({ id: r[0], monthId: r[1], categoryId: r[2], amount: Number(r[3] || 0), date: r[4], note: r[5], receiptUrl: r[6], createdAt: r[7] }));
    const byMonth = {};
    expenses.forEach((e) => {
      if (!byMonth[e.monthId]) byMonth[e.monthId] = { total: 0, count: 0 };
      byMonth[e.monthId].total += e.amount || 0;
      byMonth[e.monthId].count += 1;
    });
    return new Response(JSON.stringify({ ok: true, summary: byMonth }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
