import ActivityKit
import ExpoModulesCore
import Foundation

// Must stay identical to targets/live-activity/PeakWorkoutAttributes.swift:
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

struct LiveActivityStateRecord: Record {
  @Field var workoutName: String = ""
  @Field var startedAt: Double = 0  // epoch ms
  @Field var pausedElapsed: Double?  // seconds, set only while the workout is paused
  @Field var exerciseName: String?
  @Field var completedSets: Int = 0
  @Field var totalSets: Int = 0
  @Field var restEndsAt: Double?  // epoch ms
  @Field var restTotal: Double?  // seconds

  @available(iOS 16.1, *)
  var contentState: PeakWorkoutAttributes.ContentState {
    PeakWorkoutAttributes.ContentState(
      workoutName: workoutName,
      startedAt: Date(timeIntervalSince1970: startedAt / 1000),
      pausedElapsed: pausedElapsed,
      exerciseName: exerciseName,
      completedSets: completedSets,
      totalSets: totalSets,
      restEndsAt: restEndsAt.map { Date(timeIntervalSince1970: $0 / 1000) },
      restTotal: restTotal
    )
  }
}

@available(iOS 16.2, *)
@MainActor
enum WorkoutActivityController {
  // Remembers which workout already got an activity, so one the user swiped away is not recreated.
  private static var requestedWorkoutId: String?

  static func startOrUpdate(workoutId: String, state: PeakWorkoutAttributes.ContentState) async {
    // staleDate = end of rest: the widget re-renders then and drops the rest countdown on its own.
    let content = ActivityContent(state: state, staleDate: state.restEndsAt)
    let activities = Activity<PeakWorkoutAttributes>.activities

    if let current = activities.first(where: {
      $0.attributes.workoutId == workoutId && ($0.activityState == .active || $0.activityState == .stale)
    }) {
      requestedWorkoutId = workoutId
      await current.update(content)
      return
    }
    if requestedWorkoutId == workoutId { return }

    for activity in activities {
      await activity.end(nil, dismissalPolicy: .immediate)
    }
    guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
    do {
      _ = try Activity.request(
        attributes: PeakWorkoutAttributes(workoutId: workoutId),
        content: content,
        pushType: nil
      )
      requestedWorkoutId = workoutId
    } catch {
      print("[PeakLiveActivity] Failed to start Live Activity: \(error)")
    }
  }

  static func endAll() async {
    requestedWorkoutId = nil
    for activity in Activity<PeakWorkoutAttributes>.activities {
      await activity.end(nil, dismissalPolicy: .immediate)
    }
  }
}

public class PeakLiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PeakLiveActivity")

    AsyncFunction("startOrUpdate") { (workoutId: String, state: LiveActivityStateRecord) async in
      if #available(iOS 16.2, *) {
        await WorkoutActivityController.startOrUpdate(workoutId: workoutId, state: state.contentState)
      }
    }

    AsyncFunction("end") { () async in
      if #available(iOS 16.2, *) {
        await WorkoutActivityController.endAll()
      }
    }
  }
}
