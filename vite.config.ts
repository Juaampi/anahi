import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

async function readRequestBody(req: IncomingMessage) {
  const chunks: Buffer[] = []

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  return chunks.length > 0 ? Buffer.concat(chunks).toString('utf8') : undefined
}

function createNetlifyFunctionsBridge() {
  return {
    name: 'netlify-functions-bridge',
    configureServer(server: {
      middlewares: {
        use: (path: string, handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>) => void
      }
      ssrLoadModule: (url: string) => Promise<{
        handler: (event: unknown, context: unknown) => Promise<{
          statusCode?: number
          headers?: Record<string, string | number | boolean>
          body?: string
        }>
      }>
    }) {
      server.middlewares.use('/.netlify/functions/api', async (req: IncomingMessage, res: ServerResponse) => {
        try {
          const { handler } = await server.ssrLoadModule('/netlify/functions/api.ts')
          const body = await readRequestBody(req)
          const origin = `http://${req.headers.host || 'localhost:5173'}`
          const rawUrl = new URL(req.url || '/.netlify/functions/api', origin).toString()

          const result = await handler(
            {
              httpMethod: req.method || 'GET',
              headers: Object.fromEntries(
                Object.entries(req.headers).map(([key, value]) => [key, Array.isArray(value) ? value.join(', ') : value || '']),
              ),
              body,
              rawUrl,
            } as never,
            {} as never,
          )

          res.statusCode = result?.statusCode || 200
          for (const [key, value] of Object.entries(result?.headers || {})) {
            if (value !== undefined) {
              res.setHeader(key, String(value))
            }
          }
          res.end(result?.body || '')
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              message: error instanceof Error ? error.message : 'Error interno en bridge local.',
            }),
          )
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), createNetlifyFunctionsBridge()],
  server: {
    port: 5173,
  },
})
