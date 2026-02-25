import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.registra.inventario',
  appName: 'Registra mi inventario',
  webDir: 'dist/registra-mi-inventario/browser',
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1565C0',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
};

export default config;
