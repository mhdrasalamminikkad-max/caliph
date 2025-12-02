import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.caliph.attendance',
  appName: 'Caliph Attendance',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    url: 'https://caliph-attendance-api-production-1bf0.up.railway.app',
    cleartext: false
  },
  android: {
    backgroundColor: '#16a34a'
  }
};

export default config;
