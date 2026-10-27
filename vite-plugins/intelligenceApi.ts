import type { Connect, Plugin } from 'vite'
import { loadEnv } from 'vite'
import {
  handleDomeggookItem,
  handleRetailSearch,
  handleWholesaleSearch,
} from '../server/intelligenceHandlers'

function json(res: Connect.ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

function intelligenceApiMiddleware(env: Record<string, string>): Connect.NextHandleFunction {
  return async (req, res, next) => {
    const url = req.url ?? ''

    const domeggook = url.match(/^\/api\/intelligence\/domeggook\/(\d{5,12})(?:\?.*)?$/)
    if (domeggook) {
      const out = await handleDomeggookItem(domeggook[1])
      json(res, out.status, out.body)
      return
    }

    if (url.startsWith('/api/intelligence/wholesale/search')) {
      const parsed = new URL(url, 'http://localhost')
      const query = parsed.searchParams.get('query')?.trim() ?? ''
      const limit = Number(parsed.searchParams.get('limit') ?? '15') || 15
      const platform = parsed.searchParams.get('platform') ?? 'ALL'
      const out = await handleWholesaleSearch(query, limit, platform)
      json(res, out.status, out.body)
      return
    }

    if (url.startsWith('/api/intelligence/retail/search')) {
      const out = await handleRetailSearch(url, env)
      json(res, out.status, out.body)
      return
    }

    next()
  }
}

/** dev/preview — CORS 우회용 Intelligence Adapter API */
export function intelligenceApiPlugin(): Plugin {
  const attach = (server: { config: { mode: string; envDir: string }; middlewares: Connect.Server }) => {
    const env = loadEnv(server.config.mode, server.config.envDir, '')
    server.middlewares.use(intelligenceApiMiddleware(env))
  }
  return {
    name: 'margin-genie-intelligence-api',
    configureServer: attach,
    configurePreviewServer: attach,
  }
}
