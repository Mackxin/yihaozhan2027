import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

// Dev-mode plugin: allows frontend to POST data.json directly to public/
function saveDataPlugin() {
  return {
    name: 'save-data',
    configureServer(server) {
      server.middlewares.use('/api/save-data', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        let body = ''
        req.on('data', chunk => body += chunk)
        req.on('end', () => {
          try {
            JSON.parse(body) // validate JSON
            const filePath = resolve(process.cwd(), 'public/data.json')
            writeFileSync(filePath, body, 'utf-8')
            console.log('✅ public/data.json 已更新')
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true }))
          } catch (e) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: e.message }))
          }
        })
      })
    }
  }
}

export default defineConfig({
  plugins: [vue(), saveDataPlugin()],
  base: './',
  build: {
    outDir: 'docs',
  },
})
