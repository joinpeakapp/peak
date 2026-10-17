import ActivityKit
import SwiftUI
import WidgetKit

@main
struct PeakWidgetBundle: WidgetBundle {
  var body: some Widget {
    PeakWorkoutLiveActivity()
  }
}

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

  var subtitle: String? {
    let sets: String? = totalSets > 0 ? "\(min(completedSets, totalSets))/\(totalSets) sets" : nil
    let parts = [exerciseName, sets].compactMap { $0 }
    return parts.isEmpty ? nil : parts.joined(separator: " · ")
  }
}

struct ElapsedText: View {
  let state: PeakWorkoutAttributes.ContentState

  var body: some View {
    if let paused = state.pausedElapsed {
      Text(formatDuration(paused))
    } else {
      Text(state.startedAt, style: .timer)
    }
  }
}

struct WorkoutIcon: View {
  var size: CGFloat = 36

  var body: some View {
    Image(systemName: "dumbbell.fill")
      .font(.system(size: size * 0.44, weight: .semibold))
      .foregroundStyle(.black)
      .frame(width: size, height: size)
      .background(Circle().fill(.white))
  }
}

struct RestBar: View {
  let rest: ClosedRange<Date>

  var body: some View {
    HStack(spacing: 10) {
      Text("REST")
        .font(.system(size: 11, weight: .bold))
        .tracking(1)
        .foregroundStyle(secondaryText)
      ProgressView(timerInterval: rest, countsDown: true, label: { EmptyView() }, currentValueLabel: { EmptyView() })
        .tint(.white)
      Text(timerInterval: rest, countsDown: true)
        .font(.system(size: 15, weight: .semibold).monospacedDigit())
        .foregroundStyle(.white)
        .multilineTextAlignment(.trailing)
        .frame(width: 52, alignment: .trailing)
    }
  }
}

struct SetsBar: View {
  let state: PeakWorkoutAttributes.ContentState

  var body: some View {
    ProgressView(value: Double(min(state.completedSets, state.totalSets)), total: Double(state.totalSets))
      .tint(.white)
  }
}

struct LockScreenView: View {
  let state: PeakWorkoutAttributes.ContentState
  let isStale: Bool

  var body: some View {
    let rest = state.restRange(isStale: isStale)
    VStack(alignment: .leading, spacing: 14) {
      HStack(alignment: .center, spacing: 12) {
        WorkoutIcon()
        VStack(alignment: .leading, spacing: 2) {
          Text(state.workoutName)
            .font(.system(size: 16, weight: .semibold))
            .foregroundStyle(.white)
            .lineLimit(1)
          if let subtitle = state.subtitle {
            Text(subtitle)
              .font(.system(size: 13, weight: .medium))
              .foregroundStyle(secondaryText)
              .lineLimit(1)
          }
        }
        Spacer(minLength: 8)
        ElapsedText(state: state)
          .font(.system(size: 28, weight: .semibold).monospacedDigit())
          .foregroundStyle(.white)
          .multilineTextAlignment(.trailing)
          .frame(maxWidth: 120, alignment: .trailing)
      }
      if let rest {
        RestBar(rest: rest)
      } else if state.totalSets > 0 {
        SetsBar(state: state)
      }
    }
    .padding(16)
  }
}

struct PeakWorkoutLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: PeakWorkoutAttributes.self) { context in
      LockScreenView(state: context.state, isStale: context.isStale)
        .activityBackgroundTint(.black)
        .activitySystemActionForegroundColor(.white)
    } dynamicIsland: { context in
      let state = context.state
      let rest = state.restRange(isStale: context.isStale)
      let compactIcon = rest == nil ? "dumbbell.fill" : "timer"

      return DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          WorkoutIcon(size: 32)
            .padding(.leading, 4)
        }
        DynamicIslandExpandedRegion(.trailing) {
          ElapsedText(state: state)
            .font(.system(size: 22, weight: .semibold).monospacedDigit())
            .foregroundStyle(.white)
            .multilineTextAlignment(.trailing)
            .frame(maxWidth: 100, alignment: .trailing)
            .padding(.trailing, 4)
        }
        DynamicIslandExpandedRegion(.center) {
          VStack(spacing: 2) {
            Text(state.workoutName)
              .font(.system(size: 15, weight: .semibold))
              .foregroundStyle(.white)
              .lineLimit(1)
            if let subtitle = state.subtitle {
              Text(subtitle)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(secondaryText)
                .lineLimit(1)
            }
          }
        }
        DynamicIslandExpandedRegion(.bottom) {
          if let rest {
            RestBar(rest: rest)
              .padding(.horizontal, 4)
              .padding(.top, 6)
          } else if state.totalSets > 0 {
            SetsBar(state: state)
              .padding(.horizontal, 4)
              .padding(.top, 6)
          }
        }
      } compactLeading: {
        Image(systemName: compactIcon)
          .font(.system(size: 13, weight: .semibold))
          .foregroundStyle(.white)
      } compactTrailing: {
        Group {
          if let rest {
            Text(timerInterval: rest, countsDown: true)
          } else {
            ElapsedText(state: state)
          }
        }
        .font(.system(size: 14, weight: .semibold).monospacedDigit())
        .foregroundStyle(.white)
        .multilineTextAlignment(.trailing)
        .frame(width: 52)
      } minimal: {
        Image(systemName: compactIcon)
          .font(.system(size: 13, weight: .semibold))
          .foregroundStyle(.white)
      }
      .keylineTint(.white)
    }
  }
}
