import type { NextApiRequest, NextApiResponse } from "next";
import { readRange, appendRow, updateRange, findRowIndexById, deleteRowByIndex } from "../../lib/googleSheets";
import { v4 as uuidv4 } from "uuid";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query; // budget id
    if (!id || Array.isArray(id)) return res.status(400).json({ ok: false, error: "id required" });

    if (req.method === "PUT") {
      const { amount, categoryId, monthId } = req.body;
      const rows = await readRange("Budgets!A2:D");
      const idx = (rows || []).findIndex((r: any[]) => r[0] === id);
      if (idx === -1) return res.status(404).json({ ok: false, error: "budget not found" });
      const rowIndex = idx + 2;
      const newRow = [id, monthId ?? rows[idx][1], categoryId ?? rows[idx][2], String(amount ?? rows[idx][3] || 0)];
      await updateRange(`Budgets!A${rowIndex}`, newRow);
      return res.status(200).json({ ok: true, budget: { id, monthId: newRow[1], categoryId: newRow[2], amount: Number(newRow[3]) } });
    }

    if (req.method === "DELETE") {
      const rows = await readRange("Budgets!A2:A");
      const idx = (rows || []).findIndex((r: any[]) => r[0] === id);
      if (idx === -1) return res.status(404).json({ ok: false, error: "budget not found" });
      const rowIndex = idx + 2;
      await deleteRowByIndex("Budgets", rowIndex);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", ["PUT", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
