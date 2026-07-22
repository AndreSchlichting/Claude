# TradingView-Webhooks (Ausbaustufe 0.7)

Eigene TradingView-Alerts landen direkt in der App (Dashboard-Karte „TradingView-Signale" + Ereignisprotokoll).

## 1. Webhook-Server starten

```bash
npm run webhooks
```

Der Server läuft auf `http://localhost:3777` und speichert Signale in `server/signals.json`.

## 2. Von außen erreichbar machen (Tunnel)

TradingView sendet aus dem Internet - dein Rechner braucht dafür eine öffentliche Adresse:

```bash
npx ngrok http 3777
```

ngrok zeigt dir eine URL wie `https://abc123.ngrok-free.app` an.

## 3. Alert in TradingView einrichten

1. Chart öffnen → Alarm erstellen (Wecker-Symbol)
2. Reiter **Benachrichtigungen** → **Webhook-URL** aktivieren
3. URL eintragen: `https://abc123.ngrok-free.app/webhook`
4. Als Nachricht am besten JSON verwenden:

```json
{
  "ticker": "{{ticker}}",
  "action": "buy",
  "price": "{{close}}",
  "message": "Ausbruch über Widerstand bestätigt"
}
```

## 4. In der App

- Dashboard → Karte **„TradingView-Signale"** zeigt die letzten Signale (aktualisiert alle 30 s)
- Jedes neue Signal wird im **Ereignisprotokoll** gespeichert

## Wichtig

- Webhook-Signale sind **Hinweise, keine Freigaben**: Jeder Trade läuft trotzdem
  durch das Trade-Gate (Warnstufen, Chance-Risiko, Brutal-Modus).
- Der Server speichert maximal die letzten 200 Signale.
