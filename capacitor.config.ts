import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.threevcoin.wallet',
  appName: '3D V COIN',
  webDir: '.next/standalone/public',
  server: {
    url: 'https://vcoinwallet.vercel.app',
    cleartext: true
  }
};

export default config;
