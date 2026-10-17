/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: 'widget',
  name: 'PeakWidgets',
  displayName: 'Peak',
  bundleIdentifier: '.liveactivity',
  // Live Activities with ActivityContent / stale dates need iOS 16.2
  deploymentTarget: '16.2',
  frameworks: ['SwiftUI', 'WidgetKit', 'ActivityKit'],
};
