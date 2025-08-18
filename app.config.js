export default {
  expo: {
    name: "ParcelPilot",
    slug: "parcel-pilot",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.parcelpilot.expo",
      config: {
        googleMapsApiKey: "AIzaSyAGi5pZ36OHk8kVSKoLSFstXPFoGlwIQfs"
      }
    },
    android: {
      package: "com.parcelpilot.expo",
      config: {
        googleMaps: {
          apiKey: "AIzaSyAGi5pZ36OHk8kVSKoLSFstXPFoGlwIQfs"
        }
      }
    }
  }
};