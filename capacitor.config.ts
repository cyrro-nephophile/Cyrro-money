import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'id.cyrro.money',
  appName: 'Mamoney',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    backgroundColor: '#101411'
  }
};

export default config;
