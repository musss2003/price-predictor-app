const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withReactNativeMaps(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    // Add meta-data for Google Maps (optional - works without API key on emulator)
    if (!androidManifest.application[0]['meta-data']) {
      androidManifest.application[0]['meta-data'] = [];
    }

    const hasGoogleMapsKey = androidManifest.application[0]['meta-data'].some(
      (meta) => meta.$['android:name'] === 'com.google.android.geo.API_KEY'
    );

    if (!hasGoogleMapsKey) {
      androidManifest.application[0]['meta-data'].push({
        $: {
          'android:name': 'com.google.android.geo.API_KEY',
          'android:value': 'AIzaSyA0s1a7phLN0iaD6-UE7m4qP-z_-Iq4QUA', // Demo key, replace with your own
        },
      });
    }

    return config;
  });
};
