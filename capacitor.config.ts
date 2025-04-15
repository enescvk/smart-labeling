
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.2ef39629070f48488c4af69c022b1480',
  appName: 'smart-labeling',
  webDir: 'dist',
  server: {
    url: 'https://2ef39629-070f-4848-8c4a-f69c022b1480.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    contentInset: 'always'
  }
};

export default config;
