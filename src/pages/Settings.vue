<template>
  <div class="space-y-6">
    <h1 class="text-3xl font-bold">Einstellungen</h1>

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

        <div v-if="tempSettings.acousticWarningsEnabled">
          <label class="block text-sm font-medium mb-2">Lautstärke</label>
          <input
            v-model.number="tempSettings.soundVolume"
            type="range"
            min="0"
            max="100"
            class="w-full"
          />
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">{{ tempSettings.soundVolume }}%</p>
        </div>
      </div>
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
import { reactive } from 'vue'
import { useAppStore } from '../stores'
import type { Settings } from '../types'

const store = useAppStore()

const tempSettings = reactive<Settings>({ ...store.settings })

const saveSettings = () => {
  store.updateSettings(tempSettings)
  alert('Einstellungen gespeichert!')
}

const resetSettings = () => {
  Object.assign(tempSettings, store.settings)
}
</script>
