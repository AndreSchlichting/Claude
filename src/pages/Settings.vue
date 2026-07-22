<template>
  <div class="space-y-3">
    <h1 class="text-xl font-bold">Einstellungen</h1>

    <!-- Display Settings -->
    <div class="card">
      <h2 class="text-lg font-bold mb-4">Anzeige-Einstellungen</h2>
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Sprache</label>
            <select v-model="tempSettings.language" class="input-field w-full">
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Währung</label>
            <select v-model="tempSettings.currency" class="input-field w-full">
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Trading Settings -->
    <div class="card">
      <h2 class="text-lg font-bold mb-4">Trading-Einstellungen</h2>
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Trading-Modus</label>
            <select v-model="tempSettings.tradingMode" class="input-field w-full">
              <option value="daytrading">Daytrading</option>
              <option value="swing">Swingtrading</option>
              <option value="investment">Investment</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Risiko pro Trade (%)</label>
            <input v-model.number="tempSettings.riskPerTrade" type="number" min="0" max="100" class="input-field w-full" />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Tages-Verlustlimit (€)</label>
            <input v-model.number="tempSettings.dailyLossLimit" type="number" class="input-field w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Wochen-Verlustlimit (€)</label>
            <input v-model.number="tempSettings.weeklyLossLimit" type="number" class="input-field w-full" />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Max. Krypto Quote (%)</label>
            <input v-model.number="tempSettings.maxCryptoQuota" type="number" min="0" max="100" class="input-field w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Max. offene Trades</label>
            <input v-model.number="tempSettings.maxOpenTrades" type="number" min="1" class="input-field w-full" />
          </div>
        </div>

        <div class="flex items-center gap-2">
          <input
            id="brutal-mode"
            v-model="tempSettings.brutalSuccessModeEnabled"
            type="checkbox"
            class="rounded"
          />
          <label for="brutal-mode" class="text-sm font-medium">
            Brutal-erfolgreich-Modus aktivieren (Strenge Anforderungen)
          </label>
        </div>
      </div>
    </div>

    <!-- Fee Profile -->
    <div class="card">
      <h2 class="text-lg font-bold mb-4">Gebühren-Profil</h2>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Broker Profil</label>
          <select v-model="tempSettings.feeProfile.name" class="input-field w-full">
            <option value="Trade Republic">Trade Republic</option>
            <option value="Interactive Brokers">Interactive Brokers</option>
            <option value="Kraken">Kraken</option>
            <option value="Binance">Binance</option>
            <option value="Custom">Benutzerdefiniert</option>
          </select>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Kaufgebühr (€)</label>
            <input v-model.number="tempSettings.feeProfile.buyFee" type="number" step="0.01" class="input-field w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Verkaufsgebühr (€)</label>
            <input v-model.number="tempSettings.feeProfile.sellFee" type="number" step="0.01" class="input-field w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Spread Annahme (%)</label>
            <input v-model.number="tempSettings.feeProfile.spreadAssumption" type="number" step="0.01" class="input-field w-full" />
          </div>
        </div>
      </div>
    </div>

    <!-- Tax Settings -->
    <div class="card">
      <h2 class="text-lg font-bold mb-4">Steuern (Deutschland)</h2>
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Kapitalertragsteuer (%)</label>
            <input v-model.number="tempSettings.taxAssumption.capitalGainsTax" type="number" step="0.01" class="input-field w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Solidaritätszuschlag (%)</label>
            <input v-model.number="tempSettings.taxAssumption.solidarityTax" type="number" step="0.01" class="input-field w-full" />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Sparer-Pauschbetrag (€)</label>
            <input v-model.number="tempSettings.taxAssumption.sparerPauschbetrag" type="number" class="input-field w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Krypto Haltedauer (Tage)</label>
            <input v-model.number="tempSettings.taxAssumption.cryptoHoldingPeriod" type="number" class="input-field w-full" />
          </div>
        </div>

        <div class="flex items-center gap-2">
          <input
            id="church-tax"
            v-model="tempSettings.taxAssumption.churchTax"
            type="checkbox"
            class="rounded"
          />
          <label for="church-tax" class="text-sm font-medium">
            Kirchensteuer berücksichtigen
          </label>
        </div>
      </div>
    </div>

    <!-- Warning Settings -->
    <div class="card">
      <h2 class="text-lg font-bold mb-4">Warnungen</h2>
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <input
            id="acoustic-warnings"
            v-model="tempSettings.acousticWarningsEnabled"
            type="checkbox"
            class="rounded"
          />
          <label for="acoustic-warnings" class="text-sm font-medium">
            Akustische Warnungen aktivieren
          </label>
        </div>

        <!-- Konfigurierbare Warnschwellen (§129.3) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label class="block text-sm font-medium mb-2">Kursbewegung-Schwelle (%)</label>
            <input v-model.number="tempSettings.warningThresholds.strongMovePercent" type="number" step="0.5" min="0.5" class="input-field w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Volumen-Spike (x-fach)</label>
            <input v-model.number="tempSettings.warningThresholds.volumeSpikeRatio" type="number" step="0.1" min="1" class="input-field w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Stop-Nähe-Warnung (%)</label>
            <input v-model.number="tempSettings.warningThresholds.stopProximityPercent" type="number" step="0.1" min="0.1" class="input-field w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Gap-Schwelle (%)</label>
            <input v-model.number="tempSettings.warningThresholds.gapPercent" type="number" step="0.5" min="0.5" class="input-field w-full" />
          </div>
        </div>

        <!-- BaFin-Watchlist (§119.3) -->
        <div class="pt-2">
          <label class="block text-sm font-medium mb-2">BaFin-/Behörden-Watchlist (ein Symbol pro Zeile)</label>
          <textarea
            v-model="bafinListText"
            rows="3"
            placeholder="Symbole von Assets mit Behördenwarnung, z.B. aus bafin.de → Verbraucher → Warnungen"
            class="input-field w-full text-sm"
          ></textarea>
          <p class="text-xs text-gray-500 mt-1">
            Assets auf dieser Liste erhalten Warnstufe SCHWARZ (Scam-Verdacht) und werden für Live-Trading gesperrt.
            Quelle: <span class="underline">bafin.de → Verbraucher → Warnungen &amp; Meldungen</span>
          </p>
        </div>

        <div class="flex items-center gap-2 pt-2">
          <input id="learning-hints" v-model="tempSettings.learningHints" type="checkbox" class="rounded" />
          <label for="learning-hints" class="text-sm font-medium">
            Lernhinweise anzeigen (Wissens- und Transparenzmodus §128)
          </label>
        </div>

        <div v-if="tempSettings.acousticWarningsEnabled">
          <label class="block text-sm font-medium mb-2">Lautstärke</label>
          <input
            v-model.number="tempSettings.soundVolume"
            type="range"
            min="0"
            max="100"
            class="w-full"
          />
          <div class="flex justify-between items-center mt-1">
            <p class="text-xs text-gray-600 dark:text-gray-400">{{ tempSettings.soundVolume }}%</p>
            <button @click="playTestSound" class="text-xs text-primary font-medium hover:underline">
              🔊 Testton abspielen
            </button>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Nur kritische Warnungen (Warnung/Alarm/Notfall) werden akustisch gemeldet. Kein Daueralarm.
          </p>
        </div>
      </div>
    </div>

    <!-- Daten-Backup -->
    <div class="card">
      <h2 class="text-lg font-bold mb-2">Daten-Backup</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Alle App-Daten (Portfolios, Journal, Protokoll, Einstellungen) als JSON-Datei sichern oder wiederherstellen.
      </p>
      <div class="flex flex-wrap gap-3">
        <button @click="exportData" class="btn btn-secondary">💾 Daten exportieren</button>
        <label class="btn btn-secondary cursor-pointer">
          📂 Daten importieren
          <input type="file" accept=".json" @change="importData" class="hidden" />
        </label>
      </div>
      <p v-if="backupMessage" class="mt-3 text-sm font-medium text-green-700 dark:text-green-300">{{ backupMessage }}</p>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-4">
      <button @click="saveSettings" class="btn btn-primary flex-1">
        Einstellungen speichern
      </button>
      <button @click="resetSettings" class="btn btn-secondary flex-1">
        Zurücksetzen
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useAppStore } from '../stores'
import { WarningEngine } from '../services/warningEngine'
import type { Settings } from '../types'

const store = useAppStore()

const tempSettings = reactive<Settings>(JSON.parse(JSON.stringify(store.settings)))
const bafinListText = ref((store.settings.bafinWatchlist || []).join('\n'))

const playTestSound = () => {
  WarningEngine.playTestSound(tempSettings.soundVolume)
}

const saveSettings = () => {
  tempSettings.bafinWatchlist = bafinListText.value
    .split('\n').map(s => s.trim().toUpperCase()).filter(Boolean)
  store.updateSettings(tempSettings)
  store.logEvent('modus_geaendert', `Einstellungen gespeichert (Brutal-Modus: ${tempSettings.brutalSuccessModeEnabled ? 'AN' : 'AUS'})`)
  alert('Einstellungen gespeichert!')
}

const resetSettings = () => {
  Object.assign(tempSettings, store.settings)
}

const backupMessage = ref('')

const exportData = () => {
  const data = localStorage.getItem('tdl_state_v1') || '{}'
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `trading-lab-backup_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
  backupMessage.value = '✓ Backup heruntergeladen'
  setTimeout(() => { backupMessage.value = '' }, 3000)
}

const importData = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const text = String(reader.result || '')
      JSON.parse(text) // Validierung
      localStorage.setItem('tdl_state_v1', text)
      backupMessage.value = '✓ Backup importiert - Seite wird neu geladen...'
      setTimeout(() => location.reload(), 1000)
    } catch {
      backupMessage.value = 'Fehler: Datei ist kein gültiges Backup'
    }
  }
  reader.readAsText(file)
}
</script>
