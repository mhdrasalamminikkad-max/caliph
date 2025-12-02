import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.caliph.attendance',
  appName: 'Caliph Attendance',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    // IMPORTANT: Replace with your Railway URL to load from server
    // url: 'https://your-app.up.railway.app',
    // cleartext: true
  },
  android: {
    backgroundColor: '#16a34a'
  }
};

export default config;
