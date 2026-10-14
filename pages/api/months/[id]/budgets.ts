import type { NextApiRequest, NextApiResponse } from "next";
import { readRange, appendRow } from "../../../lib/googleSheets";
import { v4 as uuidv4 } from "uuid";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id: monthId } = req.query;
    if (!monthId || Array.isArray(monthId)) return res.status(400).json({ ok: false, error: "monthId required" });

    if (req.method === "GET") {
      const rows = await readRange("Budgets!A2:D");
      const budgets = (rows || []).map((r: any[]) => ({
        id: r[0],
        monthId: r[1],
        categoryId: r[2],
        amount: Number(r[3] || 0),
      }));
      const filtered = budgets.filter((b: any) => b.monthId === monthId);
      return res.status(200).json({ ok: true, budgets: filtered });
    }

    if (req.method === "POST") {
      const { categoryId, amount } = req.body;
      if (!categoryId || amount == null) return res.status(400).json({ ok: false, error: "categoryId and amount required" });
      const id = uuidv4();
      await appendRow("Budgets!A2:D", [id, String(monthId), categoryId, String(amount)]);
      return res.status(201).json({ ok: true, budget: { id, monthId, categoryId, amount } });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
