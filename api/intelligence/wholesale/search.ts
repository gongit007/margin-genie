import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleWholesaleSearch } from '../../../server/intelligenceHandlers'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const query = typeof req.query.query === 'string' ? req.query.query : ''
  const limit = Number(req.query.limit ?? '15') || 15
  const platform = typeof req.query.platform === 'string' ? req.query.platform : 'ALL'
  const out = await handleWholesaleSearch(query, limit, platform)
  res.status(out.status).json(out.body)
}
