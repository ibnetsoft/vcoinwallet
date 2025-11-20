import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vcoin.wallet',
  appName: 'V COIN',
  webDir: '.next/standalone/public',
  server: {
    url: 'https://vcoinwallet.vercel.app',
    cleartext: true
  }
};

export default config;
