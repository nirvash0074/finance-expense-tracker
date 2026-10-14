import type { NextApiRequest, NextApiResponse } from "next";
import { readRange, updateRange } from "../../../lib/googleSheets";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    if (!id || Array.isArray(id)) return res.status(400).json({ ok: false, error: "id required" });

    const rows = await readRange("Categories!A2:E");
    const idx = (rows || []).findIndex((r: any[]) => r[0] === id);
    if (idx === -1) return res.status(404).json({ ok: false, error: "category not found" });
    const rowIndex = idx + 2;
    const current = rows[idx];

    if (req.method === "PUT") {
      const { name, color, deleted } = req.body;
      const newRow = [
        id,
        name ?? current[1],
        color ?? current[2] ?? "#60a5fa",
        current[3] ?? new Date().toISOString(),
        deleted === true ? 'true' : deleted === false ? 'false' : (current[4] || 'false'),
      ];
      await updateRange(`Categories!A${rowIndex}`, newRow);
      return res.status(200).json({ ok: true, category: { id, name: newRow[1], color: newRow[2], createdAt: newRow[3], deleted: newRow[4] === 'true' } });
    }

    if (req.method === "DELETE") {
      // soft-delete: set deleted=true in column E
      await updateRange(`Categories!E${rowIndex}`, ['true']);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", ["PUT", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
