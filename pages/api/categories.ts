import type { NextApiRequest, NextApiResponse } from "next";
import { readRange, appendRow } from "../../lib/googleSheets";
import { v4 as uuidv4 } from "uuid";

type CategoryRow = [string, string, string, string, string?]; // id,name,color,createdAt,deleted

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const includeDeleted = req.query.includeDeleted === 'true';
      const rows = await readRange("Categories!A2:E");
      const categories = (rows || []).map((r: any[]) => ({ id: r[0], name: r[1], color: r[2] || "#60a5fa", createdAt: r[3], deleted: r[4] === 'true' }));
      const out = includeDeleted ? categories : categories.filter((c:any)=>!c.deleted);
      return res.status(200).json({ ok: true, categories: out });
    }

    if (req.method === "POST") {
      const { name, color } = req.body;
      if (!name) return res.status(400).json({ ok: false, error: "name required" });
      const id = uuidv4();
      const createdAt = new Date().toISOString();
      await appendRow("Categories!A2:E", [id, name, color || "#60a5fa", createdAt, "false"]);
      return res.status(201).json({ ok: true, category: { id, name, color: color || "#60a5fa", createdAt } });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
