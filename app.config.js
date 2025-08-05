export default {
  expo: {
    name: "DeliveryApp",
    slug: "delivery-app",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.deliveryapp.expo"
    },
    android: {
      package: "com.deliveryapp.expo"
    }
  }
};