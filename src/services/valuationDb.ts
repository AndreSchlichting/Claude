/**
 * Bewertungs-Wissen nach Börsenbibel Band 2 (Unternehmens- und Assetbewertung).
 * Lektionen + Quizfragen für das Training - erweiterbar wie die Kerzenmuster-DB.
 */
export interface ValuationLesson {
  id: string
  title: string
  kategorie: 'Kennzahl' | 'Methode' | 'Qualität'
  kurzformel?: string
  erklaerung: string
  interpretation: string   // Wie ist der Wert zu lesen?
  stolperfalle: string     // Wo liegt der typische Denkfehler?
  quiz: { frage: string; optionen: string[]; richtig: number; erklaerung: string }
}

export const VALUATION_LESSONS: ValuationLesson[] = [
  {
    id: 'kgv', title: 'KGV - Kurs-Gewinn-Verhältnis', kategorie: 'Kennzahl',
    kurzformel: 'KGV = Aktienkurs ÷ Gewinn je Aktie (EPS)',
    erklaerung: 'Das KGV sagt, wie viele Jahresgewinne man für die Aktie bezahlt. KGV 15 = der aktuelle Jahresgewinn müsste 15 Jahre fließen, um den Kaufpreis zu verdienen.',
    interpretation: 'Niedrig ist nicht automatisch billig, hoch nicht automatisch teuer: Wachstumsunternehmen verdienen höhere KGVs. Immer im Branchen- und Historienvergleich lesen.',
    stolperfalle: 'Bei zyklischen Unternehmen ist das KGV am Gewinnhöhepunkt optisch niedrig - genau dann ist die Aktie oft am teuersten (Zykliker-Falle).',
    quiz: {
      frage: 'Eine Zykliker-Aktie hat auf dem Gewinnhöhepunkt ein KGV von 6. Was bedeutet das meist?',
      optionen: ['Klarer Kauf - extrem billig', 'Vorsicht: Zykliker-Falle, Gewinne könnten einbrechen', 'Das KGV ist bei Zyklikern irrelevant', 'Das Unternehmen macht Verluste'],
      richtig: 1,
      erklaerung: 'Am Zyklushoch sind Gewinne maximal → KGV wirkt billig. Brechen die Gewinne ein, explodiert das KGV. Zykliker kauft man antizyklisch bei optisch HOHEM KGV.'
    }
  },
  {
    id: 'kuv', title: 'KUV - Kurs-Umsatz-Verhältnis', kategorie: 'Kennzahl',
    kurzformel: 'KUV = Marktkapitalisierung ÷ Umsatz',
    erklaerung: 'Bewertet den Preis je Euro Umsatz. Nützlich bei Unternehmen ohne (stabile) Gewinne, z.B. Wachstumsfirmen.',
    interpretation: 'Nur mit der Marge zusammen sinnvoll: KUV 2 bei 30% Marge ist günstiger als KUV 1 bei 3% Marge - entscheidend ist, wie viel vom Umsatz als Gewinn ankommt.',
    stolperfalle: 'Ein niedriges KUV bei dauerhaft margenschwachem Geschäft ist kein Schnäppchen, sondern angemessen.',
    quiz: {
      frage: 'Firma A: KUV 1, Nettomarge 2%. Firma B: KUV 3, Nettomarge 25%. Wer ist gewinnbezogen günstiger?',
      optionen: ['Firma A (niedrigeres KUV)', 'Firma B (KGV ≈ 12 vs. ≈ 50 bei A)', 'Beide gleich', 'Nicht bestimmbar'],
      richtig: 1,
      erklaerung: 'KUV ÷ Marge ≈ KGV: A = 1/0,02 = 50, B = 3/0,25 = 12. Das KUV allein täuscht - die Marge macht den Unterschied.'
    }
  },
  {
    id: 'kbv', title: 'KBV & Buchwert', kategorie: 'Kennzahl',
    kurzformel: 'KBV = Aktienkurs ÷ Buchwert je Aktie',
    erklaerung: 'Der Buchwert ist das bilanzielle Eigenkapital. KBV < 1 heißt: Die Börse bewertet das Unternehmen unter seiner Substanz.',
    interpretation: 'Stark bei Banken, Versicherern und Substanzunternehmen. Bei Software/Marken fast bedeutungslos, weil immaterielle Werte kaum in der Bilanz stehen.',
    stolperfalle: 'KBV < 1 kann berechtigt sein: Wenn das Unternehmen dauerhaft weniger als seine Eigenkapitalkosten verdient, vernichtet es Wert - dann ist der Abschlag verdient.',
    quiz: {
      frage: 'Wann ist ein KBV unter 1 KEIN Kaufsignal?',
      optionen: ['Nie - unter Buchwert ist immer billig', 'Wenn die Eigenkapitalrendite dauerhaft unter den Kapitalkosten liegt', 'Bei Banken', 'Wenn die Dividende hoch ist'],
      richtig: 1,
      erklaerung: 'Verdient ein Unternehmen dauerhaft weniger als seine Kapitalkosten (ROE < Eigenkapitalkosten), zerstört es Wert - der Markt preist das korrekt ein.'
    }
  },
  {
    id: 'roe-roic', title: 'ROE & ROIC - Kapitalrenditen', kategorie: 'Qualität',
    kurzformel: 'ROE = Gewinn ÷ Eigenkapital • ROIC = NOPAT ÷ investiertes Kapital',
    erklaerung: 'Kapitalrenditen zeigen, wie effizient das Unternehmen aus Kapital Gewinn macht. ROIC ist die Königskennzahl der Qualität: Rendite auf ALLES investierte Kapital.',
    interpretation: 'Dauerhaft ROIC > 15% deutet auf einen Burggraben hin. Entscheidend: ROIC muss ÜBER den Kapitalkosten (WACC) liegen - nur dann schafft Wachstum Wert.',
    stolperfalle: 'Ein hoher ROE kann durch hohe Verschuldung "gedopt" sein (wenig Eigenkapital = hoher ROE). ROIC entlarvt das, weil er Fremdkapital einbezieht.',
    quiz: {
      frage: 'Firma X hat ROE 25%, aber ROIC nur 6% bei 8% Kapitalkosten. Was stimmt?',
      optionen: ['Top-Qualität wegen ROE 25%', 'Der ROE ist durch Schulden gehebelt - real wird Wert vernichtet (ROIC < WACC)', 'ROIC ist egal, ROE zählt', 'Beide Kennzahlen sagen dasselbe'],
      richtig: 1,
      erklaerung: 'ROIC unter Kapitalkosten = jedes investierte Kapital vernichtet Wert. Der hohe ROE entsteht nur durch den Schuldenhebel - ein Warnsignal, kein Qualitätsmerkmal.'
    }
  },
  {
    id: 'fcf', title: 'Free Cashflow - der ehrliche Gewinn', kategorie: 'Kennzahl',
    kurzformel: 'FCF = operativer Cashflow − Investitionen (CapEx)',
    erklaerung: 'Der Free Cashflow ist das Geld, das nach allen notwendigen Investitionen wirklich übrig bleibt - für Dividenden, Rückkäufe, Schuldenabbau.',
    interpretation: 'Gewinne sind eine Meinung (Bilanzierung), Cash ist ein Fakt. Dauerhaft Gewinn OHNE Free Cashflow ist ein Alarmzeichen.',
    stolperfalle: 'Aktienbasierte Vergütung (SBC) schönt den FCF: Sie ist nicht cash-wirksam, verwässert aber die Aktionäre. FCF je AKTIE betrachten.',
    quiz: {
      frage: 'Ein Unternehmen meldet seit Jahren Gewinne, aber der operative Cashflow ist negativ. Was ist die richtige Reaktion?',
      optionen: ['Egal - der Gewinn zählt', 'Alarmzeichen: Gewinne ohne Cash sind oft Bilanzkosmetik - Finger weg oder tief prüfen', 'Normal bei allen Unternehmen', 'Kaufen, da unterbewertet'],
      richtig: 1,
      erklaerung: 'Gewinn ist gestaltbar (Abgrenzungen, Aktivierungen), Cashflow kaum. Dauerhafte Divergenz ist eines der stärksten Warnsignale der Bilanzanalyse.'
    }
  },
  {
    id: 'margen', title: 'Margen-Analyse', kategorie: 'Qualität',
    kurzformel: 'Bruttomarge → operative Marge → Nettomarge',
    erklaerung: 'Die Margentreppe zeigt, wo Geld verloren geht: Bruttomarge (Produktkraft), operative Marge (Kostendisziplin), Nettomarge (was ankommt).',
    interpretation: 'Hohe, STABILE Bruttomargen (>40-50%) deuten auf Preissetzungsmacht und Burggraben. Steigende operative Marge bei wachsendem Umsatz = Skaleneffekte.',
    stolperfalle: 'Margen nie absolut vergleichen: 5% Nettomarge ist im Einzelhandel stark, in Software schwach. Immer gegen die Branche und die eigene Historie lesen.',
    quiz: {
      frage: 'Die Bruttomarge eines Unternehmens fällt drei Jahre in Folge. Was signalisiert das meist?',
      optionen: ['Nichts Besonderes', 'Nachlassende Preissetzungsmacht oder steigender Wettbewerbsdruck - Burggraben prüfen!', 'Besseres Wachstum', 'Höhere Dividenden'],
      richtig: 1,
      erklaerung: 'Die Bruttomarge ist der direkteste Messwert für Preissetzungsmacht. Ihr Verfall ist oft das erste Zeichen, dass der Burggraben erodiert.'
    }
  },
  {
    id: 'dcf', title: 'DCF - Discounted Cash Flow', kategorie: 'Methode',
    kurzformel: 'Innerer Wert = Summe aller künftigen FCF, abgezinst auf heute',
    erklaerung: 'Die DCF-Methode schätzt den inneren Wert: künftige Free Cashflows prognostizieren und mit den Kapitalkosten auf heute abzinsen. Konzeptionell die sauberste Bewertung.',
    interpretation: 'Der Wert steckt in den Annahmen: Wachstumsrate, Marge, Abzinsungssatz, Endwert. Kleine Änderungen → große Wertunterschiede. Deshalb: Szenarien statt Punktwert.',
    stolperfalle: 'Ein DCF ist kein Beweis, sondern eine strukturierte Meinung. Wer das Ergebnis vorher kennt, findet immer Annahmen, die es liefern ("Garbage in, Gospel out").',
    quiz: {
      frage: 'Was ist die größte Schwäche eines DCF-Modells?',
      optionen: ['Es ist mathematisch falsch', 'Extreme Sensitivität gegenüber Annahmen (Wachstum, Abzinsung, Endwert)', 'Es funktioniert nur bei Banken', 'Es ignoriert den Gewinn'],
      richtig: 1,
      erklaerung: 'Schon 1% mehr Wachstum oder weniger Abzinsung kann den "fairen Wert" um 30-50% verschieben. Profis rechnen deshalb Szenarien (Bär/Basis/Bulle) statt eines Punktwerts.'
    }
  },
  {
    id: 'ev-ebitda', title: 'EV/EBITDA & Multiplikatoren', kategorie: 'Methode',
    kurzformel: 'EV/EBITDA = (Marktkap. + Nettoschulden) ÷ EBITDA',
    erklaerung: 'Der Enterprise Value bezieht Schulden ein - dadurch sind Unternehmen mit unterschiedlicher Finanzierung vergleichbar. Standard bei Übernahmen und Peer-Vergleichen.',
    interpretation: 'Peer-Vergleich: gleiches Geschäftsmodell, gleiche Region, gleiche Wachstumsphase. Ein Abschlag zum Peer-Median braucht einen Grund - oder er ist eine Chance.',
    stolperfalle: 'EBITDA ignoriert Investitionsbedarf und Abschreibungen. Bei kapitalintensiven Firmen (Telekom, Industrie) schönt es massiv - dort besser EV/EBIT oder FCF-Rendite.',
    quiz: {
      frage: 'Warum nutzt man EV/EBITDA statt KGV für den Vergleich unterschiedlich verschuldeter Firmen?',
      optionen: ['Weil es immer niedriger ist', 'Weil der Enterprise Value die Schulden einbezieht und so die Kapitalstruktur neutralisiert', 'Weil das KGV verboten ist', 'Weil EBITDA gleich Cashflow ist'],
      richtig: 1,
      erklaerung: 'Das KGV hängt an der Finanzierung (Zinsen drücken den Gewinn). EV/EBITDA vergleicht das operative Geschäft unabhängig davon, wem das Kapital gehört.'
    }
  },
  {
    id: 'verschuldung', title: 'Verschuldung & Bilanzqualität', kategorie: 'Qualität',
    kurzformel: 'Nettoschulden ÷ EBITDA • Zinsdeckung = EBIT ÷ Zinsen',
    erklaerung: 'Schulden sind ein Hebel: Sie vergrößern Gewinne UND Verluste. Nettoschulden/EBITDA zeigt, wie viele Jahresergebnisse die Entschuldung bräuchte.',
    interpretation: 'Faustregeln: < 1x komfortabel, 1-3x normal, > 3x angespannt (branchenabhängig). Zinsdeckung > 5 solide. In Krisen entscheidet die Bilanz über das Überleben.',
    stolperfalle: 'Leasing, Pensionsverpflichtungen und Wandelanleihen verstecken sich gern außerhalb der offensichtlichen Schulden - immer die Gesamtverbindlichkeiten prüfen.',
    quiz: {
      frage: 'Nettoschulden/EBITDA = 4,5 und die Zinsen steigen. Was ist das größte Risiko?',
      optionen: ['Keins, Schulden sind normal', 'Refinanzierung: höhere Zinslast frisst den Gewinn, im Extremfall droht die Verwässerung/Insolvenz', 'Die Dividende steigt', 'Das KGV sinkt'],
      richtig: 1,
      erklaerung: 'Hohe Verschuldung + steigende Zinsen = Zinslast explodiert bei jeder Refinanzierung. Genau so entstehen Kapitalerhöhungen zu Tiefstkursen - zulasten der Altaktionäre.'
    }
  },
  {
    id: 'innerer-wert', title: 'Innerer Wert & Sicherheitsmarge', kategorie: 'Methode',
    kurzformel: 'Kaufen, wenn Preis deutlich unter innerem Wert (Margin of Safety)',
    erklaerung: 'Der innere Wert ist der geschätzte "wahre" Wert aus Ertragskraft und Substanz. Da jede Schätzung unsicher ist, verlangt Value-Investing einen Abschlag: die Sicherheitsmarge.',
    interpretation: 'Sicherheitsmarge 20-40% je nach Prognosesicherheit: Bei stabilen Qualitätsfirmen reicht weniger, bei unsicheren Geschäftsmodellen braucht es mehr.',
    stolperfalle: 'Billig ist nicht gleich unterbewertet: Eine "Value Trap" ist optisch günstig, weil das Geschäft erodiert. Erst Qualität prüfen (ROIC, Margen, Bilanz), DANN den Preis.',
    quiz: {
      frage: 'Was unterscheidet eine echte Unterbewertung von einer Value Trap?',
      optionen: ['Nichts - billig ist billig', 'Bei der Value Trap erodiert das Geschäft (fallende Margen/ROIC), die Billigkeit ist verdient', 'Value Traps haben hohe KGVs', 'Der Unterschied ist die Dividende'],
      richtig: 1,
      erklaerung: 'Reihenfolge der Analyse: 1. Qualität (verdient das Geschäft seine Kapitalkosten?), 2. Bewertung. Wer nur auf den Preis schaut, sammelt erodierende Geschäftsmodelle ein.'
    }
  }
]
