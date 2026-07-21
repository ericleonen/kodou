// Dynamic Expo config. Static values live in app.json; this overlay injects
// secrets from the environment so they never get committed to version control.
//
// Local dev/builds read the key from a gitignored .env file (see .env.example).
// EAS cloud builds read it from an EAS environment variable of the same name
// (see eas.json `environment` + `eas env:create`).
export default ({ config }) => {
  const androidGoogleMapsApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY ?? "";

  return {
    ...config,
    plugins: (config.plugins ?? []).map((plugin) =>
      Array.isArray(plugin) && plugin[0] === "react-native-maps"
        ? ["react-native-maps", { ...plugin[1], androidGoogleMapsApiKey }]
        : plugin
    ),
  };
};
