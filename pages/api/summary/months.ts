import type { NextApiRequest, NextApiResponse } from "next";
import { readRange } from "../../lib/googleSheets";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
    const rows = await readRange("Expenses!A2:H");
    const expenses = (rows || []).map((r: any[]) => ({
      id: r[0],
      monthId: r[1],
      categoryId: r[2],
      amount: Number(r[3] || 0),
      date: r[4],
      note: r[5],
      receiptUrl: r[6],
      createdAt: r[7],
    }));

    // return aggregated summary by month
    const byMonth: Record<string, { total: number; count: number }> = {};
    expenses.forEach((e) => {
      if (!byMonth[e.monthId]) byMonth[e.monthId] = { total: 0, count: 0 };
      byMonth[e.monthId].total += e.amount || 0;
      byMonth[e.monthId].count += 1;
    });

    return res.status(200).json({ ok: true, summary: byMonth });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
