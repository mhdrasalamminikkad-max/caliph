import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.caliph.attendance',
  appName: 'Caliph Attendance',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  },
  android: {
    backgroundColor: '#16a34a'
  }
};

export default config;
