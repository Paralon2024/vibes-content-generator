import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'AI Content Generator',
    version: '1.0.9',

    // Keep the compact toolbar popup.
    action: {
      default_popup: 'popup.html',
    },

    permissions: ['activeTab', 'tabs', 'storage', 'alarms', 'debugger', 'unlimitedStorage'],
    host_permissions: [
      // Vibes.ai root domain and subdomains.
      'https://vibes.ai/*',
      'https://*.vibes.ai/*',
      'https://*.fbcdn.net/*',

      // Google Flow and Labs root domains and subdomains.
      'https://flow.google.com/*',
      'https://*.flow.google.com/*',
      'https://labs.google/*',
      'https://*.labs.google/*',
      'https://flow-content.google/*',
      'https://*.flow-content.google/*',
    ],
    browser_specific_settings: {
      gecko: {
        id: 'omniflowai@example.com',
        strict_min_version: '109.0',
      },
    },
  },
});
