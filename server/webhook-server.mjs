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

// --- News-Feeds (RSS, serverseitig = kein CORS-Problem, kein API-Key) ---
const NEWS_FEEDS = (process.env.NEWS_FEEDS || 'https://www.tagesschau.de/wirtschaft/index~rss2.xml').split(',')
const BAFIN_RSS = process.env.BAFIN_RSS || 'https://www.bafin.de/SharedDocs/Downloads/DE/RSS/rss_verbraucher.xml'
const newsCache = { items: [], fetchedAt: 0 }
const bafinCache = { items: [], fetchedAt: 0, error: null }
const NEWS_TTL = 10 * 60 * 1000

function parseRss(xml, source) {
  const items = []
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/g) || []
  for (const block of itemBlocks.slice(0, 15)) {
    const pick = (tag) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
      return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim() : ''
    }
    const title = pick('title')
    if (title) {
      items.push({ title, link: pick('link'), pubDate: pick('pubDate'), source })
    }
  }
  return items
}

async function loadFeed(urls, cacheObj) {
  if (Date.now() - cacheObj.fetchedAt < NEWS_TTL) return cacheObj
  const all = []
  let lastError = null
  for (const url of urls) {
    try {
      const resp = await fetch(url.trim(), { signal: AbortSignal.timeout(10000) })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const xml = await resp.text()
      all.push(...parseRss(xml, new URL(url.trim()).hostname))
    } catch (e) {
      lastError = `${url.trim()}: ${e.message}`
      console.error('Feed-Fehler:', lastError)
    }
  }
  cacheObj.items = all
  cacheObj.fetchedAt = Date.now()
  cacheObj.error = all.length === 0 ? lastError : null
  return cacheObj
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

  // Wirtschafts-News (RSS, gecacht)
  if (req.method === 'GET' && req.url === '/news') {
    loadFeed(NEWS_FEEDS, newsCache).then(cache => {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ items: cache.items, error: cache.error }))
    })
    return
  }

  // BaFin-Warnungen (Best-Effort; URL via BAFIN_RSS anpassbar)
  if (req.method === 'GET' && req.url === '/bafin') {
    loadFeed([BAFIN_RSS], bafinCache).then(cache => {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ items: cache.items, error: cache.error }))
    })
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
