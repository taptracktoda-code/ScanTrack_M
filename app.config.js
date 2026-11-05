const fs = require('node:fs');
const path = require('node:path');

module.exports = ({ config }) => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() || '';
  const isProductionBuild = process.env.EAS_BUILD_PROFILE === 'production';
  const isEasBuild = Boolean(process.env.EAS_BUILD_PROFILE);
  const allowLocalHttp = apiUrl.startsWith('http://') && !isProductionBuild;
  const localGoogleServicesFile = './google-services.json';
  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON?.trim()
    || (fs.existsSync(path.resolve(__dirname, localGoogleServicesFile))
      ? localGoogleServicesFile
      : undefined);

  if (googleServicesFile && !fs.existsSync(path.resolve(__dirname, googleServicesFile))) {
    throw new Error(`Firebase config file not found: ${googleServicesFile}`);
  }

  if (isEasBuild && !googleServicesFile) {
    throw new Error(
      'Android push setup is incomplete. Add google-services.json to the project root or configure GOOGLE_SERVICES_JSON as an EAS file environment variable.',
    );
  }

  return {
    ...config,
    android: {
      ...config.android,
      ...(googleServicesFile ? { googleServicesFile } : {}),
    },
    plugins: [
      ...(config.plugins || []).filter(
        (plugin) => plugin !== 'expo-build-properties'
          && (!Array.isArray(plugin) || plugin[0] !== 'expo-build-properties'),
      ),
      [
        'expo-build-properties',
        {
          android: {
            usesCleartextTraffic: allowLocalHttp,
          },
        },
      ],
    ],
  };
};
