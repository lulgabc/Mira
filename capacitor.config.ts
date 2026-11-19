import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.mira.diary',
  appName: 'Mira',
  webDir: 'dist',
  backgroundColor: '#0d0f12',
  ios: {
    contentInset: 'always',
  },
  android: {
    backgroundColor: '#0d0f12',
  },
};

export default config;
