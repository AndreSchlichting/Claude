<template>
  <div class="card">
    <div class="flex justify-between items-start flex-wrap gap-2 mb-3">
      <div>
        <h2 class="text-lg font-bold">📋 Fundamental-Dashboard</h2>
        <p class="text-xs text-gray-500">Aufbau nach HKCM-Deep-Dive: Investmentpass → Canvas → Geschäftsmodell → Burggraben → Zahlen → Urteil</p>
      </div>
      <div class="flex gap-2">
        <button v-if="canAutoFill" @click="autoFill" :disabled="autoFilling" class="btn btn-secondary text-sm disabled:opacity-50">
          {{ autoFilling ? 'Lade...' : '📥 Kennzahlen laden (API)' }}
        </button>
        <button @click="editing = !editing" class="btn btn-secondary text-sm">
          {{ editing ? 'Ansicht' : '✏️ Bearbeiten' }}
        </button>
      </div>
    </div>
    <p v-if="autoFillMsg" class="text-xs mb-3" :class="autoFillMsg.startsWith('✓') ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-300'">{{ autoFillMsg }}</p>

    <!-- ============ ANSICHT ============ -->
    <template v-if="!editing">
      <div v-if="!hasData" class="text-center py-6">
        <p class="text-sm text-gray-500 mb-2">Noch keine Fundamentaldaten für {{ asset.symbol }} erfasst.</p>
        <p class="text-xs text-gray-400">„✏️ Bearbeiten" für manuelle Eingabe - oder „📥 Kennzahlen laden" mit Alpha-Vantage-Key (Aktien/ETFs).</p>
      </div>

      <template v-else>
        <!-- Investmentpass -->
        <div class="rounded-xl bg-white/40 dark:bg-white/5 p-3 mb-3">
          <div class="flex justify-between items-start flex-wrap gap-2">
            <div>
              <p class="text-xs font-bold text-gray-500">INVESTMENTPASS</p>
              <p class="font-bold">{{ asset.name }} <span class="text-gray-500 font-normal text-sm">· {{ asset.symbol }} · {{ asset.exchange || '' }}</span></p>
              <p v-if="fd.profil" class="text-sm text-gray-600 dark:text-gray-400">{{ fd.profil }}</p>
            </div>
            <div class="text-right">
              <span :class="['px-3 py-1 rounded-lg text-sm font-bold', verdictClass]">{{ verdictLabel }}</span>
              <p v-if="fd.bewertungLabel" class="text-xs text-gray-500 mt-1">Bewertung: {{ fd.bewertungLabel }}</p>
            </div>
          </div>
          <p v-if="fd.these" class="text-sm mt-2"><b>These:</b> {{ fd.these }}</p>
        </div>

        <!-- Kennzahlen-Kacheln -->
        <div v-if="kpis.length > 0" class="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
          <div v-for="kpi in kpis" :key="kpi.label" class="p-2.5 rounded-xl bg-white/40 dark:bg-white/5">
            <p class="text-xs text-gray-500">{{ kpi.label }}</p>
            <p class="font-bold text-sm">{{ kpi.value }}</p>
          </div>
        </div>

        <!-- Canvas: Chancen / Risiken -->
        <div v-if="fd.chancen.length || fd.risiken.length" class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div class="p-3 rounded-xl bg-green-50/60 dark:bg-green-950/30">
            <p class="text-xs font-bold text-green-800 dark:text-green-300 mb-1">CHANCEN</p>
            <ul class="text-sm space-y-0.5">
              <li v-for="(c, i) in fd.chancen" :key="i">• {{ c }}</li>
            </ul>
          </div>
          <div class="p-3 rounded-xl bg-red-50/60 dark:bg-red-950/30">
            <p class="text-xs font-bold text-red-800 dark:text-red-300 mb-1">RISIKEN</p>
            <ul class="text-sm space-y-0.5">
              <li v-for="(r, i) in fd.risiken" :key="i">• {{ r }}</li>
            </ul>
          </div>
        </div>

        <!-- Qualitative Abschnitte (HKCM-Fragen) -->
        <div class="space-y-2">
          <div v-if="fd.geschaeftsmodell" class="p-3 rounded-xl bg-white/40 dark:bg-white/5">
            <p class="text-xs font-bold text-gray-500 mb-1">WIE VERDIENT {{ asset.symbol }} GELD?</p>
            <p class="text-sm">{{ fd.geschaeftsmodell }}</p>
          </div>
          <div v-if="fd.burggraben" class="p-3 rounded-xl bg-white/40 dark:bg-white/5">
            <p class="text-xs font-bold text-gray-500 mb-1">WARUM GEWINNT {{ asset.symbol }}? (BURGGRABEN)</p>
            <p class="text-sm">{{ fd.burggraben }}</p>
          </div>
          <div v-if="fd.wachstumstreiber" class="p-3 rounded-xl bg-white/40 dark:bg-white/5">
            <p class="text-xs font-bold text-gray-500 mb-1">WOHER KOMMT ZUKÜNFTIGES WACHSTUM?</p>
            <p class="text-sm">{{ fd.wachstumstreiber }}</p>
          </div>
          <div v-if="fd.ersteinschaetzung" class="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30">
            <p class="text-xs font-bold text-blue-800 dark:text-blue-300 mb-1">EINSCHÄTZUNG</p>
            <p class="text-sm">{{ fd.ersteinschaetzung }}</p>
          </div>
        </div>
        <p v-if="fd.quellen" class="text-xs text-gray-400 mt-2">Quellen: {{ fd.quellen }}</p>
        <p class="text-xs text-gray-400 mt-1">Stand: {{ formatDate(fd.updatedAt) }} • Keine Anlageberatung</p>
      </template>
    </template>

    <!-- ============ BEARBEITEN ============ -->
    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium mb-1">Profil (z.B. "Fintech-Plattform · US Fintech")</label>
          <input v-model="form.profil" class="input-field w-full text-sm" />
        </div>
        <div>
          <label class="block text-xs font-medium mb-1">Bewertungs-Label (z.B. "fair bis attraktiv")</label>
          <input v-model="form.bewertungLabel" class="input-field w-full text-sm" />
        </div>
        <div class="md:col-span-2">
          <label class="block text-xs font-medium mb-1">Investmentthese (1 Satz)</label>
          <input v-model="form.these" class="input-field w-full text-sm" />
        </div>
      </div>

      <p class="text-xs font-bold text-gray-500 mt-3 mb-2">KENNZAHLEN</p>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
        <input v-model="form.marktkapitalisierung" placeholder="Marktkap." class="input-field text-sm" />
        <input v-model="form.umsatz" placeholder="Umsatz" class="input-field text-sm" />
        <input v-model="form.umsatzwachstum" placeholder="Wachstum" class="input-field text-sm" />
        <input v-model="form.bruttomarge" placeholder="Bruttomarge" class="input-field text-sm" />
        <input v-model="form.operativeMarge" placeholder="Op. Marge" class="input-field text-sm" />
        <input v-model="form.freeCashflow" placeholder="Free Cashflow" class="input-field text-sm" />
        <input v-model="form.liquiditaet" placeholder="Liquidität" class="input-field text-sm" />
        <input v-model="form.kgv" placeholder="KGV" class="input-field text-sm" />
        <input v-model="form.kuv" placeholder="KUV" class="input-field text-sm" />
        <input v-model="form.dividende" placeholder="Dividende" class="input-field text-sm" />
      </div>

      <p class="text-xs font-bold text-gray-500 mt-3 mb-2">QUALITATIVE ANALYSE (HKCM-Fragen)</p>
      <div class="space-y-2">
        <textarea v-model="form.geschaeftsmodell" rows="2" placeholder="Wie verdient das Unternehmen Geld? (Segmente, Monetarisierung)" class="input-field w-full text-sm"></textarea>
        <textarea v-model="form.burggraben" rows="2" placeholder="Warum gewinnt es? (Netzwerkeffekte, Wechselkosten, Daten, Marke)" class="input-field w-full text-sm"></textarea>
        <textarea v-model="form.wachstumstreiber" rows="2" placeholder="Woher kommt zukünftiges Wachstum? (Treiber)" class="input-field w-full text-sm"></textarea>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <textarea v-model="chancenText" rows="3" placeholder="Chancen (eine pro Zeile)" class="input-field w-full text-sm"></textarea>
          <textarea v-model="risikenText" rows="3" placeholder="Risiken (eine pro Zeile)" class="input-field w-full text-sm"></textarea>
        </div>
        <textarea v-model="form.ersteinschaetzung" rows="2" placeholder="Einschätzung / Fazit" class="input-field w-full text-sm"></textarea>
        <div class="flex flex-wrap gap-3 items-end">
          <div>
            <label class="block text-xs font-medium mb-1">Urteil</label>
            <select v-model="form.urteil" class="input-field text-sm">
              <option value="offen">Offen</option>
              <option value="kaufenswert">Kaufenswert</option>
              <option value="beobachten">Beobachten</option>
              <option value="halten">Halten</option>
              <option value="meiden">Meiden / Finger weg</option>
            </select>
          </div>
          <div class="flex-1">
            <label class="block text-xs font-medium mb-1">Quellen</label>
            <input v-model="form.quellen" placeholder="z.B. Geschäftsbericht 2026, IR-Präsentation, HKCM-Analyse" class="input-field w-full text-sm" />
          </div>
          <button @click="save" class="btn btn-primary">💾 Speichern</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAppStore } from '../stores'
import { apiService } from '../services/api'
import type { Asset, FundamentalData, FundamentalVerdict } from '../types'

const props = defineProps<{ asset: Asset }>()

const store = useAppStore()
const editing = ref(false)
const autoFilling = ref(false)
const autoFillMsg = ref('')

const emptyForm = (): FundamentalData => ({
  assetId: props.asset.id,
  updatedAt: new Date(),
  profil: '', bewertungLabel: '', these: '', ersteinschaetzung: '',
  geschaeftsmodell: '', burggraben: '', wachstumstreiber: '',
  chancen: [], risiken: [],
  urteil: 'offen' as FundamentalVerdict
})

const fd = computed<FundamentalData>(() => store.fundamentals[props.asset.id] || emptyForm())
const hasData = computed(() =>
  !!(fd.value.these || fd.value.geschaeftsmodell || fd.value.marktkapitalisierung || fd.value.chancen.length))

const form = ref<FundamentalData>({ ...emptyForm(), ...JSON.parse(JSON.stringify(fd.value)) })
const chancenText = ref(fd.value.chancen.join('\n'))
const risikenText = ref(fd.value.risiken.join('\n'))

watch(() => props.asset.id, () => {
  form.value = { ...emptyForm(), ...JSON.parse(JSON.stringify(fd.value)) }
  chancenText.value = fd.value.chancen.join('\n')
  risikenText.value = fd.value.risiken.join('\n')
  editing.value = false
  autoFillMsg.value = ''
})

const canAutoFill = computed(() => props.asset.assetClass !== 'crypto')

const kpis = computed(() => {
  const d = fd.value
  return [
    { label: 'Marktkap.', value: d.marktkapitalisierung },
    { label: 'Umsatz', value: d.umsatz },
    { label: 'Wachstum', value: d.umsatzwachstum },
    { label: 'Bruttomarge', value: d.bruttomarge },
    { label: 'Op. Marge', value: d.operativeMarge },
    { label: 'Free Cashflow', value: d.freeCashflow },
    { label: 'Liquidität', value: d.liquiditaet },
    { label: 'KGV', value: d.kgv },
    { label: 'KUV', value: d.kuv },
    { label: 'Dividende', value: d.dividende }
  ].filter(k => k.value)
})

const verdictLabel = computed(() => ({
  kaufenswert: 'KAUFENSWERT', beobachten: 'BEOBACHTEN',
  halten: 'HALTEN', meiden: 'MEIDEN', offen: 'OFFEN'
}[fd.value.urteil]))

const verdictClass = computed(() => ({
  kaufenswert: 'bg-green-600 text-white',
  beobachten: 'bg-blue-600 text-white',
  halten: 'bg-gray-500 text-white',
  meiden: 'bg-red-600 text-white',
  offen: 'bg-gray-300 text-gray-800'
}[fd.value.urteil]))

const save = () => {
  form.value.chancen = chancenText.value.split('\n').map(s => s.trim()).filter(Boolean)
  form.value.risiken = risikenText.value.split('\n').map(s => s.trim()).filter(Boolean)
  form.value.assetId = props.asset.id
  form.value.updatedAt = new Date()
  store.setFundamentals(JSON.parse(JSON.stringify(form.value)))
  editing.value = false
}

/** Kennzahlen automatisch via Alpha Vantage OVERVIEW laden */
const autoFill = async () => {
  autoFilling.value = true
  autoFillMsg.value = ''
  try {
    const data = await apiService.fetchFundamentalsOverview(props.asset.symbol)
    if (!data) {
      autoFillMsg.value = 'Keine Daten erhalten - Alpha-Vantage-Key in .env.local nötig (kostenlos auf alphavantage.co), oder Tageslimit erreicht.'
      return
    }
    form.value = { ...emptyForm(), ...JSON.parse(JSON.stringify(fd.value)) }
    if (data.profil) form.value.profil = data.profil
    if (data.marktkapitalisierung) form.value.marktkapitalisierung = data.marktkapitalisierung
    if (data.umsatz) form.value.umsatz = data.umsatz
    if (data.umsatzwachstum) form.value.umsatzwachstum = data.umsatzwachstum
    if (data.bruttomarge) form.value.bruttomarge = data.bruttomarge
    if (data.operativeMarge) form.value.operativeMarge = data.operativeMarge
    if (data.kgv) form.value.kgv = data.kgv
    if (data.kuv) form.value.kuv = data.kuv
    if (data.dividende) form.value.dividende = data.dividende
    if (data.beschreibung && !form.value.geschaeftsmodell) {
      form.value.geschaeftsmodell = data.beschreibung.slice(0, 500)
    }
    form.value.quellen = 'Alpha Vantage Company Overview' + (form.value.quellen ? `; ${form.value.quellen}` : '')
    save()
    autoFillMsg.value = '✓ Kennzahlen geladen und gespeichert - qualitative Abschnitte (These, Burggraben, Chancen/Risiken) über "Bearbeiten" ergänzen.'
  } finally {
    autoFilling.value = false
  }
}

const formatDate = (d: Date) => new Intl.DateTimeFormat('de-DE', {
  day: '2-digit', month: '2-digit', year: 'numeric'
}).format(new Date(d))
</script>
