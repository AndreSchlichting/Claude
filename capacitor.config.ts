import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Capacitor-Konfiguration für die Android-Hybridversion.
 * Nutzung: npm run android:init (einmalig), dann npm run android:sync
 */
const config: CapacitorConfig = {
  appId: 'de.schlichting.tradinglab',
  appName: 'Trading Decision Lab',
  webDir: 'dist',
  android: {
    allowMixedContent: false
  }
}

export default config
