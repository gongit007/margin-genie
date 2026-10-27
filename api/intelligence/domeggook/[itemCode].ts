import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleDomeggookItem } from '../../../server/intelligenceHandlers'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const itemCode = typeof req.query.itemCode === 'string' ? req.query.itemCode : ''
  const out = await handleDomeggookItem(itemCode)
  res.status(out.status).json(out.body)
}
