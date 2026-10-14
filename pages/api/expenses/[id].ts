import type { NextApiRequest, NextApiResponse } from "next";
import { readRange, updateRange, deleteRowByIndex } from "../../../lib/googleSheets";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    if (!id || Array.isArray(id)) return res.status(400).json({ ok: false, error: "id required" });

    if (req.method === "PUT") {
      // update expense fields
      const { categoryId, amount, date, note, receiptUrl } = req.body;
      const rows = await readRange("Expenses!A2:H");
      const idx = (rows || []).findIndex((r: any[]) => r[0] === id);
      if (idx === -1) return res.status(404).json({ ok: false, error: "expense not found" });
      const rowIndex = idx + 2;
      const r = rows[idx];
      const newRow = [
        id,
        r[1] || "",
        categoryId ?? r[2] || "",
        amount != null ? String(amount) : r[3] || "",
        date ?? r[4] || "",
        note ?? r[5] || "",
        receiptUrl ?? r[6] || "",
        r[7] || new Date().toISOString(),
      ];
      await updateRange(`Expenses!A${rowIndex}`, newRow);
      return res.status(200).json({ ok: true, expense: { id, ...newRow } });
    }

    if (req.method === "DELETE") {
      const rows = await readRange("Expenses!A2:A");
      const idx = (rows || []).findIndex((r: any[]) => r[0] === id);
      if (idx === -1) return res.status(404).json({ ok: false, error: "expense not found" });
      const rowIndex = idx + 2;
      await deleteRowByIndex("Expenses", rowIndex);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", ["PUT", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
