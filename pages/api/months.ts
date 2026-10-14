import type { NextApiRequest, NextApiResponse } from "next";
import { readRange, appendRow } from "../../lib/googleSheets";
import { v4 as uuidv4 } from "uuid";

type MonthRow = [string, string, string, string, string, string?]; // id,year,month,name,createdAt,deleted

function rowsToMonths(rows: MonthRow[]) {
  return rows.map((r) => ({
    id: r[0],
    year: Number(r[1]),
    month: Number(r[2]),
    name: r[3],
    createdAt: r[4],
    deleted: r[5] === "true" ? true : false,
  }));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      // read Months!A2:F
      const rows = await readRange("Months!A2:F");
      const months = rowsToMonths(rows as MonthRow[]);
      // default: filter out deleted
      const active = months.filter((m) => !m.deleted);
      return res.status(200).json({ ok: true, months: active });
    }

    if (req.method === "POST") {
      const { year, month, name } = req.body;
      if (!year || !month) {
        return res.status(400).json({ ok: false, error: "year and month required" });
      }
      const id = uuidv4();
      const createdAt = new Date().toISOString();
      await appendRow("Months!A2:F", [id, String(year), String(month), name || `${month}/${year}`, createdAt, "false"]);
      return res.status(201).json({ ok: true, month: { id, year, month, name, createdAt } });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
