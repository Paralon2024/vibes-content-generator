import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'AI Content Generator',
    version: '1.0.8',

    // Explicitly bind the toolbar button to the compact popup.
    // This prevents Chrome from showing an inert toolbar action when
    // the popup entrypoint is not inferred by the build.
    action: {
      default_popup: 'popup.html',
    },

    permissions: ['activeTab', 'tabs', 'storage', 'alarms', 'debugger', 'unlimitedStorage'],
    host_permissions: [
      'https://*.vibes.ai/*',
      'https://*.fbcdn.net/*',
      'https://labs.google/*',
      'https://*.labs.google/*',
      'https://flow.google.com/*',
      'https://*.flow.google.com/*',
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
