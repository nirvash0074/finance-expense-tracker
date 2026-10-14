import type { NextApiRequest, NextApiResponse } from "next";
import { readRange, updateRange, appendRow, deleteRowByIndex } from "../../../lib/googleSheets";
import { v4 as uuidv4 } from "uuid";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    if (!id || Array.isArray(id)) return res.status(400).json({ ok: false, error: "id required" });

    if (req.method === "PUT") {
      const { name, color } = req.body;
      const rows = await readRange("Categories!A2:D");
      const idx = (rows || []).findIndex((r: any[]) => r[0] === id);
      if (idx === -1) return res.status(404).json({ ok: false, error: "category not found" });
      const rowIndex = idx + 2;
      const r = rows[idx];
      const newRow = [id, name ?? r[1], color ?? r[2], r[3] ?? new Date().toISOString()];
      await updateRange(`Categories!A${rowIndex}`, newRow);
      return res.status(200).json({ ok: true, category: { id, name: newRow[1], color: newRow[2], createdAt: newRow[3] } });
    }

    if (req.method === "DELETE") {
      // Reassign expenses to 'Uncategorized' then delete the category row
      const catRows = await readRange("Categories!A2:D");
      const idx = (catRows || []).findIndex((r: any[]) => r[0] === id);
      if (idx === -1) return res.status(404).json({ ok: false, error: "category not found" });
      // find or create uncategorized
      const unc = (catRows || []).find((r: any[]) => (r[1] || "").toLowerCase() === "uncategorized");
      let uncId: string;
      if (unc) {
        uncId = unc[0];
      } else {
        uncId = uuidv4();
        await appendRow("Categories!A2:D", [uncId, "Uncategorized", "#9ca3af", new Date().toISOString()]);
      }

      // reassign expenses
      const expRows = await readRange("Expenses!A2:H");
      for (let i = 0; i < (expRows || []).length; i++) {
        const r = expRows[i];
        if (r[2] === id) {
          const rowIndex = i + 2;
          // update only the categoryId cell (column C). We'll write starting at C{rowIndex}
          await updateRange(`Expenses!C${rowIndex}`, [uncId]);
        }
      }

      // delete category row
      const rowIndexCat = idx + 2;
      await deleteRowByIndex("Categories", rowIndexCat);
      return res.status(200).json({ ok: true, reassignedTo: uncId });
    }

    res.setHeader("Allow", ["PUT", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
