Pod::Spec.new do |s|
  s.name           = 'PeakLiveActivity'
  s.version        = '1.0.0'
  s.summary        = 'Starts, updates and ends the Peak workout Live Activity'
  s.description    = s.summary
  s.license        = 'UNLICENSED'
  s.author         = 'Peak'
  s.homepage       = 'https://github.com/joinpeakapp/peak'
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/joinpeakapp/peak.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = '**/*.{h,m,swift}'
end
