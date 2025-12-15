import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.threedvcoin.wallet',
  appName: '3D V COIN',
  webDir: 'www',
  server: {
    url: 'https://www.3dvcoin.com',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
