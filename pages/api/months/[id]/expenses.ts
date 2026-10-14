import type { NextApiRequest, NextApiResponse } from "next";
import { readRange, appendRow } from "../../../../lib/googleSheets";
import { v4 as uuidv4 } from "uuid";

type ExpenseRow = [string, string, string, string, string, string, string, string?];
// id,monthId,categoryId,amount,date,note,receiptUrl,createdAt

function rowsToExpenses(rows: ExpenseRow[]) {
  return rows.map((r) => ({
    id: r[0],
    monthId: r[1],
    categoryId: r[2],
    amount: Number(r[3]),
    date: r[4],
    note: r[5],
    receiptUrl: r[6],
    createdAt: r[7],
  }));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id: monthId } = req.query;
    if (!monthId || Array.isArray(monthId)) return res.status(400).json({ ok: false, error: "monthId required" });

    if (req.method === "GET") {
      const rows = await readRange("Expenses!A2:H");
      const expenses = rowsToExpenses(rows as ExpenseRow[]);
      const filtered = expenses.filter((e) => e.monthId === monthId);
      return res.status(200).json({ ok: true, expenses: filtered });
    }

    if (req.method === "POST") {
      const { categoryId, amount, date, note, receiptUrl } = req.body;
      if (!categoryId || !amount || !date) {
        return res.status(400).json({ ok: false, error: "categoryId, amount, date required" });
      }
      const id = uuidv4();
      const createdAt = new Date().toISOString();
      await appendRow("Expenses!A2:H", [
        id,
        String(monthId),
        categoryId,
        String(amount),
        date,
        note || "",
        receiptUrl || "",
        createdAt,
      ]);
      return res.status(201).json({ ok: true, expense: { id, monthId, categoryId, amount, date, note, receiptUrl, createdAt } });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
