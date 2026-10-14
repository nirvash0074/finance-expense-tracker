import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(501).json({ ok: false, error: 'This legacy API route is disabled. Use the Functions endpoints at /api/* (Cloudflare Pages Functions) instead.' });
}
