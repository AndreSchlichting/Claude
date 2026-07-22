<template>
  <div class="space-y-3">
    <div class="card">
      <h1 class="text-xl font-bold mb-1">Trading-Training</h1>
      <div class="flex gap-2 mt-2">
        <button @click="area = 'kerzen'" :class="['glass-chip', area === 'kerzen' ? 'glass-chip-active' : 'glass-chip-inactive']">
          🕯 Kerzenmuster ({{ PATTERNS.length }})
        </button>
        <button @click="area = 'bewertung'" :class="['glass-chip', area === 'bewertung' ? 'glass-chip-active' : 'glass-chip-inactive']">
          📊 Bewertung - Band 2 ({{ VALUATION_LESSONS.length }})
        </button>
      </div>
    </div>

    <!-- ============ BEWERTUNGS-TRAINER (Boersenbibel Band 2) ============ -->
    <template v-if="area === 'bewertung'">
      <div v-for="(l, idx) in VALUATION_LESSONS" :key="l.id" class="card border-l-4 border-indigo-400">
        <div class="flex justify-between items-start flex-wrap gap-2">
          <div>
            <p class="text-xs text-gray-500">Lektion {{ idx + 1 }} / {{ VALUATION_LESSONS.length }} • {{ l.kategorie }}</p>
            <h3 class="font-bold">{{ l.title }}</h3>
            <p v-if="l.kurzformel" class="text-xs font-mono text-indigo-600 dark:text-indigo-300 mt-0.5">{{ l.kurzformel }}</p>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-sm">
          <div class="p-2.5 rounded-xl bg-white/40 dark:bg-white/5">
            <p class="text-xs font-bold text-gray-500">WAS IST DAS?</p>
            <p>{{ l.erklaerung }}</p>
          </div>
          <div class="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30">
            <p class="text-xs font-bold text-blue-800 dark:text-blue-300">SO LIEST MAN ES</p>
            <p>{{ l.interpretation }}</p>
          </div>
          <div class="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30">
            <p class="text-xs font-bold text-amber-800 dark:text-amber-300">STOLPERFALLE</p>
            <p>{{ l.stolperfalle }}</p>
          </div>
        </div>
        <!-- Mini-Quiz je Lektion -->
        <div class="mt-2 p-2.5 rounded-xl bg-white/40 dark:bg-white/5 text-sm">
          <p class="font-bold text-xs text-gray-500 mb-1.5">🎯 VERSTÄNDNISFRAGE: {{ l.quiz.frage }}</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            <button v-for="(opt, oi) in l.quiz.optionen" :key="oi"
              @click="valAnswers[l.id] = oi"
              :disabled="valAnswers[l.id] !== undefined"
              class="text-left p-2 rounded-lg text-xs font-medium transition-colors"
              :class="valAnswers[l.id] !== undefined
                ? (oi === l.quiz.richtig ? 'bg-green-600 text-white'
                   : oi === valAnswers[l.id] ? 'bg-red-600 text-white' : 'bg-white/40 dark:bg-white/5 opacity-50')
                : 'bg-white/60 dark:bg-white/10 hover:bg-primary/20'">
              {{ opt }}
            </button>
          </div>
          <p v-if="valAnswers[l.id] !== undefined" class="text-xs mt-2"
            :class="valAnswers[l.id] === l.quiz.richtig ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'">
            {{ valAnswers[l.id] === l.quiz.richtig ? '✓ Richtig! ' : '✗ ' }}{{ l.quiz.erklaerung }}
          </p>
        </div>
      </div>
    </template>

    <template v-if="area === 'kerzen'">
    <!-- Muster-Auswahl -->
    <div class="card">
      <div class="flex justify-between items-center flex-wrap gap-2 mb-3">
        <h2 class="text-lg font-bold">1. Muster auswählen</h2>
        <div class="flex gap-2">
          <button @click="selectAll" class="btn btn-secondary text-sm">Alle</button>
          <button @click="selectSignal('bullisch')" class="btn btn-secondary text-sm">Nur bullische</button>
          <button @click="selectSignal('bearisch')" class="btn btn-secondary text-sm">Nur bearische</button>
          <button @click="selected = []" class="btn btn-secondary text-sm">Keine</button>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
        <label v-for="p in PATTERNS" :key="p.id"
          class="flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm"
          :class="selected.includes(p.id) ? 'bg-primary/10 border border-primary/40' : 'bg-white/40 dark:bg-white/5 border border-transparent'">
          <input type="checkbox" :value="p.id" v-model="selected" class="rounded" />
          <span>
            {{ p.signal === 'bullisch' ? '▲' : p.signal === 'bearisch' ? '▼' : '◆' }}
            {{ p.name }}
          </span>
        </label>
      </div>
    </div>

    <!-- Modus wählen -->
    <div class="card flex flex-wrap gap-3 items-center">
      <h2 class="text-lg font-bold">2. Programm:</h2>
      <button @click="startLearning" :disabled="selected.length === 0" class="btn btn-primary disabled:opacity-50">
        📖 Trainingsprogramm generieren ({{ selected.length }} Muster)
      </button>
      <button @click="startQuiz" :disabled="selected.length < 4" class="btn btn-secondary disabled:opacity-50">
        🎯 Quiz starten {{ selected.length < 4 ? '(mind. 4 Muster)' : '' }}
      </button>
      <span v-if="quizStats.total > 0" class="text-sm text-gray-600 dark:text-gray-400 ml-auto">
        Quiz-Bilanz: <b class="text-green-600">{{ quizStats.correct }}</b> / {{ quizStats.total }} richtig
        ({{ Math.round(quizStats.correct / quizStats.total * 100) }}%)
      </span>
    </div>

    <!-- ============ LERNPROGRAMM ============ -->
    <template v-if="mode === 'lernen'">
      <div v-for="(p, idx) in selectedPatterns" :key="p.id" class="card border-l-4"
        :class="p.signal === 'bullisch' ? 'border-green-500' : p.signal === 'bearisch' ? 'border-red-500' : 'border-gray-400'">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p class="text-xs text-gray-500 mb-1">Lektion {{ idx + 1 }} / {{ selectedPatterns.length }}</p>
            <h3 class="font-bold text-lg">{{ p.name }}</h3>
            <p class="text-xs text-gray-500 mb-2">{{ p.talibName }} · {{ p.candles }} Kerze{{ p.candles > 1 ? 'n' : '' }}</p>
            <div class="flex gap-2 mb-3">
              <span :class="['text-xs px-2 py-0.5 rounded-lg font-bold',
                p.signal === 'bullisch' ? 'bg-green-600 text-white' :
                p.signal === 'bearisch' ? 'bg-red-600 text-white' : 'bg-gray-500 text-white']">
                {{ p.signal.toUpperCase() }}
              </span>
              <span class="text-xs px-2 py-0.5 rounded-lg bg-white/60 dark:bg-white/10">
                Zuverlässigkeit: {{ p.reliability }}
              </span>
            </div>
            <PatternSvg :sample="p.sample" :highlightCount="p.candles" />
          </div>
          <div class="md:col-span-2 space-y-2 text-sm">
            <div class="p-2.5 rounded-xl bg-white/40 dark:bg-white/5">
              <p class="text-xs font-bold text-gray-500">SO SIEHT ES AUS</p>
              <p>{{ p.description }}</p>
            </div>
            <div class="p-2.5 rounded-xl bg-white/40 dark:bg-white/5">
              <p class="text-xs font-bold text-gray-500">MARKTPSYCHOLOGIE</p>
              <p>{{ p.psychology }}</p>
            </div>
            <div class="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30">
              <p class="text-xs font-bold text-blue-800 dark:text-blue-300">WAS SAGT DIE THEORIE?</p>
              <p>{{ p.expectation }}</p>
            </div>
            <div class="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30">
              <p class="text-xs font-bold text-amber-800 dark:text-amber-300">SO IST DAS SIGNAL ZU WERTEN</p>
              <p>{{ p.tradingHint }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="card border-l-4 border-blue-400 text-sm">
        💡 <b>Merksatz:</b> Kein Kerzenmuster ist ein Automatik-Signal. Kontext schlägt Muster:
        Trend davor, Lage an Unterstützung/Widerstand, Volumen und die Bestätigungskerze entscheiden.
        Die Muster findest du live im Analyse-Chart über den Button „🕯 Muster".
      </div>
    </template>

    <!-- ============ QUIZ ============ -->
    <template v-if="mode === 'quiz' && quizQuestion">
      <div class="card">
        <div class="flex justify-between items-center mb-3">
          <h2 class="text-lg font-bold">🎯 Welches Muster ist das?</h2>
          <span class="text-sm text-gray-500">Frage {{ quizStats.total + 1 }}</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <PatternSvg :sample="quizQuestion.pattern.sample" :highlightCount="quizQuestion.pattern.candles" />
          <div class="space-y-2">
            <button v-for="opt in quizQuestion.options" :key="opt.id"
              @click="answer(opt.id)"
              :disabled="!!quizAnswer"
              class="w-full text-left p-2.5 rounded-xl text-sm font-medium transition-colors"
              :class="quizAnswer
                ? (opt.id === quizQuestion.pattern.id ? 'bg-green-600 text-white'
                   : opt.id === quizAnswer ? 'bg-red-600 text-white' : 'bg-white/40 dark:bg-white/5 opacity-50')
                : 'bg-white/60 dark:bg-white/10 hover:bg-primary/20'">
              {{ opt.name }}
            </button>
          </div>
        </div>
        <div v-if="quizAnswer" class="mt-3 p-3 rounded-xl text-sm"
          :class="quizAnswer === quizQuestion.pattern.id ? 'bg-green-50/70 dark:bg-green-950/40' : 'bg-red-50/70 dark:bg-red-950/40'">
          <p class="font-bold">{{ quizAnswer === quizQuestion.pattern.id ? '✓ Richtig!' : `✗ Das war: ${quizQuestion.pattern.name}` }}</p>
          <p class="text-xs mt-1"><b>Theorie:</b> {{ quizQuestion.pattern.expectation }}</p>
          <p class="text-xs mt-1"><b>Wertung:</b> {{ quizQuestion.pattern.tradingHint }}</p>
          <button @click="nextQuestion" class="btn btn-primary text-sm mt-3">Nächste Frage →</button>
        </div>
      </div>
    </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '../stores'
import { PATTERNS } from '../services/patternDb'
import type { CandlePattern, PatternSignal } from '../services/patternDb'
import PatternSvg from '../components/PatternSvg.vue'
import { VALUATION_LESSONS } from '../services/valuationDb'

const store = useAppStore()

const selected = ref<string[]>(PATTERNS.map(p => p.id))
const mode = ref<'' | 'lernen' | 'quiz'>('lernen')  // startet direkt im Lernprogramm
const area = ref<'kerzen' | 'bewertung'>('kerzen')

const selectedPatterns = computed(() => PATTERNS.filter(p => selected.value.includes(p.id)))

const selectAll = () => { selected.value = PATTERNS.map(p => p.id) }
const selectSignal = (s: PatternSignal) => { selected.value = PATTERNS.filter(p => p.signal === s).map(p => p.id) }

const startLearning = () => {
  mode.value = 'lernen'
  store.logEvent('modus_geaendert', `Kerzenmuster-Training generiert (${selected.value.length} Muster)`)
}

// --- Quiz ---
interface QuizQuestion { pattern: CandlePattern; options: CandlePattern[] }
const quizQuestion = ref<QuizQuestion | null>(null)
const quizAnswer = ref<string | null>(null)
const quizStats = ref({ correct: 0, total: 0 })
const valAnswers = ref<Record<string, number>>({})

const startQuiz = () => {
  mode.value = 'quiz'
  quizStats.value = { correct: 0, total: 0 }
  nextQuestion()
}

const nextQuestion = () => {
  quizAnswer.value = null
  const pool = selectedPatterns.value
  const pattern = pool[Math.floor(Math.random() * pool.length)]
  // 3 falsche Optionen aus allen Mustern ziehen
  const wrong = PATTERNS.filter(p => p.id !== pattern.id)
    .sort(() => Math.random() - 0.5).slice(0, 3)
  quizQuestion.value = {
    pattern,
    options: [pattern, ...wrong].sort(() => Math.random() - 0.5)
  }
}

const answer = (id: string) => {
  if (quizAnswer.value || !quizQuestion.value) return
  quizAnswer.value = id
  quizStats.value.total++
  if (id === quizQuestion.value.pattern.id) quizStats.value.correct++
}
</script>
