import ActivityKit
import Foundation

// Must stay identical to the copy in modules/peak-live-activity/ios/PeakLiveActivityModule.swift:
// ActivityKit matches the app and the widget by this type's name and shape.
@available(iOS 16.1, *)
struct PeakWorkoutAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var workoutName: String
    var startedAt: Date
    var pausedElapsed: Double?
    var exerciseName: String?
    var completedSets: Int
    var totalSets: Int
    var restEndsAt: Date?
    var restTotal: Double?
  }

  var workoutId: String
}
