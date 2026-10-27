import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleRetailSearch } from '../../../server/intelligenceHandlers'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const params = new URLSearchParams()
  const q = req.query
  if (typeof q.query === 'string') params.set('query', q.query)
  if (typeof q.display === 'string') params.set('display', q.display)
  if (typeof q.sort === 'string') params.set('sort', q.sort)
  const marketplaces = Array.isArray(q.marketplace) ? q.marketplace : q.marketplace ? [q.marketplace] : []
  for (const m of marketplaces) {
    if (typeof m === 'string') params.append('marketplace', m)
  }
  const out = await handleRetailSearch(
    `/api/intelligence/retail/search?${params}`,
    process.env as Record<string, string>,
  )
  res.status(out.status).json(out.body)
}
