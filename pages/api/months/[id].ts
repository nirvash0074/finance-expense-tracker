import type { NextApiRequest, NextApiResponse } from "next";
import { readRange, updateRange, appendRow } from "../../../lib/googleSheets";

// GET /api/months (implemented already)
// This file handles actions on a specific month: PUT (rename) and DELETE (soft-delete or move expenses)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    if (!id || Array.isArray(id)) return res.status(400).json({ ok: false, error: "id required" });

    if (req.method === "PUT") {
      const { name } = req.body;
      const rows = await readRange("Months!A2:F");
      const idx = (rows || []).findIndex((r:any[])=>r[0]===id);
      if (idx === -1) return res.status(404).json({ ok: false, error: "month not found" });
      const rowIndex = idx + 2;
      const r = rows[idx];
      const newRow = [id, r[1], r[2], name ?? r[3], r[4] ?? new Date().toISOString(), r[5] ?? 'false'];
      await updateRange(`Months!A${rowIndex}`, newRow);
      return res.status(200).json({ ok: true, month: { id, year: Number(newRow[1]), month: Number(newRow[2]), name: newRow[3] } });
    }

    if (req.method === "DELETE") {
      // body may contain moveToMonthId to move expenses
      const { moveToMonthId, hard } = req.body || {};
      // find expenses and update their monthId
      const expRows = await readRange("Expenses!A2:H");
      for (let i=0;i<(expRows||[]).length;i++){
        const r = expRows[i];
        if (r[1] === id) {
          const rowIndex = i+2;
          if (moveToMonthId) {
            // set monthId cell (column B)
            await updateRange(`Expenses!B${rowIndex}`, [moveToMonthId]);
          } else if (hard) {
            // if hard delete requested, we could delete row - but safer to set monthId empty
            await updateRange(`Expenses!B${rowIndex}`, ['']);
          } else {
            // leave expenses but mark month as deleted
          }
        }
      }

      // soft-delete month: set deleted=true in column F
      const months = await readRange("Months!A2:F");
      const idx = (months || []).findIndex((r:any[])=>r[0]===id);
      if (idx !== -1) {
        const rowIndex = idx+2;
        await updateRange(`Months!F${rowIndex}`, ['true']);
      }

      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", ["PUT", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err:any) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
