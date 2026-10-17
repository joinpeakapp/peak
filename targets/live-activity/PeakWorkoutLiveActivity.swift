import ActivityKit
import SwiftUI
import WidgetKit

@main
struct PeakWidgetBundle: WidgetBundle {
  var body: some Widget {
    PeakWorkoutLiveActivity()
  }
}

private let background = Color(red: 0.09, green: 0.09, blue: 0.10)
private let secondaryText = Color.white.opacity(0.55)

private func formatDuration(_ seconds: Double) -> String {
  let total = max(0, Int(seconds))
  let h = total / 3600, m = (total % 3600) / 60, s = total % 60
  return h > 0 ? String(format: "%d:%02d:%02d", h, m, s) : String(format: "%d:%02d", m, s)
}

extension PeakWorkoutAttributes.ContentState {
  // nil when not resting, or once the rest is over (the app sets staleDate = restEndsAt)
  func restRange(isStale: Bool) -> ClosedRange<Date>? {
    guard !isStale, let end = restEndsAt, end > Date() else { return nil }
    return end.addingTimeInterval(-max(0, restTotal ?? 0))...end
  }

  func status(resting: Bool) -> String {
    if resting { return "Resting" }
    return pausedElapsed == nil ? "In progress" : "Paused"
  }
}

// Rest countdown while resting, workout duration otherwise.
struct MainTimer: View {
  let state: PeakWorkoutAttributes.ContentState
  let rest: ClosedRange<Date>?

  var body: some View {
    if let rest {
      Text(timerInterval: rest, countsDown: true)
    } else if let paused = state.pausedElapsed {
      Text(formatDuration(paused))
    } else {
      Text(state.startedAt, style: .timer)
    }
  }
}

struct ProgressBar: View {
  let state: PeakWorkoutAttributes.ContentState
  let rest: ClosedRange<Date>?

  var body: some View {
    Group {
      if let rest {
        ProgressView(timerInterval: rest, countsDown: true, label: { EmptyView() }, currentValueLabel: { EmptyView() })
      } else {
        ProgressView(value: Double(min(state.completedSets, state.totalSets)), total: Double(max(state.totalSets, 1)))
      }
    }
    .tint(.white)
    .scaleEffect(x: 1, y: 2, anchor: .center)
  }
}

struct WorkoutContent: View {
  let state: PeakWorkoutAttributes.ContentState
  let rest: ClosedRange<Date>?
  var timerSize: CGFloat = 52
  var countSize: CGFloat = 40
  var labelSize: CGFloat = 17

  var body: some View {
    VStack(alignment: .leading, spacing: timerSize * 0.32) {
      HStack(alignment: .bottom, spacing: 12) {
        VStack(alignment: .leading, spacing: 2) {
          MainTimer(state: state, rest: rest)
            .font(.system(size: timerSize, weight: .bold).monospacedDigit())
            .foregroundStyle(.white)
            .lineLimit(1)
            .minimumScaleFactor(0.6)
          (Text(state.workoutName).fontWeight(.semibold) + Text(" · \(state.status(resting: rest != nil))"))
            .font(.system(size: labelSize))
            .foregroundStyle(.white)
            .lineLimit(1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)

        if state.totalSets > 0 {
          VStack(alignment: .trailing, spacing: 2) {
            (Text("\(min(state.completedSets, state.totalSets))")
              .font(.system(size: countSize, weight: .bold))
              .foregroundColor(.white)
              + Text(" /\(state.totalSets)")
              .font(.system(size: countSize * 0.65, weight: .bold))
              .foregroundColor(secondaryText))
              .monospacedDigit()
            Text(state.exerciseName ?? "Sets")
              .font(.system(size: labelSize))
              .foregroundStyle(secondaryText)
              .lineLimit(1)
          }
          .frame(maxWidth: 150, alignment: .trailing)
          .fixedSize(horizontal: false, vertical: true)
        }
      }
      ProgressBar(state: state, rest: rest)
    }
  }
}

struct PeakWorkoutLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: PeakWorkoutAttributes.self) { context in
      WorkoutContent(state: context.state, rest: context.state.restRange(isStale: context.isStale))
        .padding(.horizontal, 22)
        .padding(.vertical, 20)
        .activityBackgroundTint(background)
        .activitySystemActionForegroundColor(.white)
    } dynamicIsland: { context in
      let state = context.state
      let rest = state.restRange(isStale: context.isStale)

      return DynamicIsland {
        DynamicIslandExpandedRegion(.bottom) {
          WorkoutContent(state: state, rest: rest, timerSize: 40, countSize: 32, labelSize: 15)
            .padding(.horizontal, 8)
        }
      } compactLeading: {
        Text(state.totalSets > 0 ? "\(min(state.completedSets, state.totalSets))/\(state.totalSets)" : "")
          .font(.system(size: 14, weight: .bold).monospacedDigit())
          .foregroundStyle(.white)
      } compactTrailing: {
        MainTimer(state: state, rest: rest)
          .font(.system(size: 14, weight: .bold).monospacedDigit())
          .foregroundStyle(.white)
          .multilineTextAlignment(.trailing)
          .frame(width: 52)
      } minimal: {
        MainTimer(state: state, rest: rest)
          .font(.system(size: 11, weight: .bold).monospacedDigit())
          .foregroundStyle(.white)
          .multilineTextAlignment(.center)
          .frame(width: 36)
      }
      .keylineTint(.white)
    }
  }
}
