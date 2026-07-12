/**
 * Trading Decision Lab - TradingView-Webhook-Server (Ausbaustufe 0.7)
 *
 * Empfängt Alerts von TradingView und stellt sie der App bereit.
 * Keine Abhängigkeiten - läuft mit purem Node.js.
 *
 * Start:            npm run webhooks
 * Webhook-Endpoint: POST http://localhost:3777/webhook
 * Signale abrufen:  GET  http://localhost:3777/signals
 *
 * Damit TradingView (aus dem Internet) deinen Rechner erreicht,
 * brauchst du einen Tunnel, z.B.:  npx ngrok http 3777
 * Die ngrok-URL + /webhook dann im TradingView-Alert eintragen.
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = process.env.WEBHOOK_PORT || 3777
const DATA_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'signals.json')

let signals = []
try {
  signals = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
} catch {
  signals = []
}

const save = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(signals, null, 2))
  } catch (e) {
    console.error('Speichern fehlgeschlagen:', e.message)
  }
}

const server = http.createServer((req, res) => {
  // CORS: die App (localhost:5173) darf lesen
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'content-type')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  // TradingView sendet POST mit JSON oder Text
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = ''
    req.on('data', (chunk) => { body += chunk; if (body.length > 64_000) req.destroy() })
    req.on('end', () => {
      let payload
      try { payload = JSON.parse(body) } catch { payload = { text: body } }

      const signal = {
        id: `tv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        receivedAt: new Date().toISOString(),
        payload
      }
      signals.push(signal)
      if (signals.length > 200) signals = signals.slice(-200)
      save()

      console.log(`[${signal.receivedAt}] Webhook empfangen:`, JSON.stringify(payload).slice(0, 200))
      res.writeHead(200, { 'content-type': 'text/plain' })
      res.end('ok')
    })
    return
  }

  // Die App holt sich hier die Signale ab
  if (req.method === 'GET' && req.url === '/signals') {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify(signals))
    return
  }

  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' })
    res.end(`Trading Decision Lab Webhook-Server läuft.\nPOST /webhook  - Signal senden\nGET  /signals  - Signale abrufen (${signals.length} gespeichert)\n`)
    return
  }

  res.writeHead(404)
  res.end('not found')
})

server.listen(PORT, () => {
  console.log('==============================================')
  console.log('  Trading Decision Lab - Webhook-Server')
  console.log(`  Endpoint:  http://localhost:${PORT}/webhook`)
  console.log(`  Signale:   http://localhost:${PORT}/signals`)
  console.log('  Für TradingView von außen erreichbar machen:')
  console.log(`  npx ngrok http ${PORT}`)
  console.log('==============================================')
})
