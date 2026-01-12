/**
 * Messages de notifications motivants inspirés de la culture muscu
 * Format: { title: string, body: string }
 * Le placeholder {workoutName} sera remplacé par le nom du workout
 */

export interface NotificationMessage {
  title: string;
  body: string;
}

// Messages pour un seul workout - enrichis avec références pop culture muscu
export const SINGLE_WORKOUT_MESSAGES: NotificationMessage[] = [
  {
    title: 'We go gym! 💪',
    body: 'Time for {workoutName}. Let\'s get it!',
  },
  {
    title: 'Yeah buddy! 🔥',
    body: '{workoutName} is calling. Time to shine!',
  },
  {
    title: 'Lightweight baby! 💪',
    body: '{workoutName} today. Let\'s go!',
  },
  {
    title: 'Ain\'t nothing but a peanut! 🥜',
    body: '{workoutName} time. Let\'s crush it!',
  },
  {
    title: 'Time to grind! 🏋️',
    body: '{workoutName} is waiting. No excuses!',
  },
  {
    title: 'Let\'s get it! 💪',
    body: '{workoutName} day. Time to build!',
  },
  {
    title: 'Rise and grind! ⚡',
    body: '{workoutName} on the agenda. Stay consistent!',
  },
  {
    title: 'No days off! 🔥',
    body: '{workoutName} today. Your future self will thank you!',
  },
  {
    title: 'Time to train! 💪',
    body: '{workoutName} session awaits. Let\'s crush it!',
  },
  {
    title: 'Gains don\'t wait! 💯',
    body: '{workoutName} time. Every rep counts!',
  },
  {
    title: 'Discipline = Freedom 🎯',
    body: '{workoutName} is scheduled. Stay strong!',
  },
  {
    title: 'The grind continues! 🔥',
    body: '{workoutName} today. Let\'s go!',
  },
  {
    title: 'Beast mode: ON 👹',
    body: '{workoutName} is ready. Time to perform!',
  },
  {
    title: 'Everybody wants to be a bodybuilder... 💪',
    body: 'But nobody wants to lift heavy-ass weights. {workoutName} is waiting!',
  },
  {
    title: 'The pain you feel today 💥',
    body: 'Will be the strength you feel tomorrow. {workoutName} time!',
  },
  {
    title: 'It\'s chest day! 🏋️',
    body: 'Wait, every day is chest day! {workoutName} awaits!',
  },
  {
    title: 'No excuses! 💪',
    body: '{workoutName} is scheduled. Time to show up!',
  },
  {
    title: 'The only bad workout... 🔥',
    body: 'Is the one that didn\'t happen. {workoutName} today!',
  },
];

// Messages pour plusieurs workouts le même jour - enrichis avec références pop culture muscu
export const MULTIPLE_WORKOUTS_MESSAGES: NotificationMessage[] = [
  {
    title: 'We go gym! 💪',
    body: 'You have several workouts planned today. Let\'s go!',
  },
  {
    title: 'Yeah buddy! 🔥',
    body: 'Multiple workouts today. Let\'s crush them all!',
  },
  {
    title: 'Beast mode! 👹',
    body: 'Several sessions planned. No excuses, let\'s go!',
  },
  {
    title: 'Grind time! 🏋️',
    body: 'Multiple workouts on the agenda. Stay consistent!',
  },
  {
    title: 'Let\'s get it! 💪',
    body: 'You have several workouts planned today. Time to shine!',
  },
  {
    title: 'Ain\'t nothing but a peanut! 🥜',
    body: 'Multiple workouts today. Let\'s crush them all!',
  },
  {
    title: 'The pain you feel today 💥',
    body: 'Will be the strength you feel tomorrow. Multiple workouts await!',
  },
  {
    title: 'No days off! 🔥',
    body: 'You have several workouts planned today. Your future self will thank you!',
  },
  {
    title: 'Everybody wants to be a bodybuilder... 💪',
    body: 'But nobody wants to lift heavy-ass weights. Multiple workouts are waiting!',
  },
  {
    title: 'Beast mode: ON 👹',
    body: 'Several workouts planned today. Time to perform!',
  },
];

/**
 * Sélectionne un message aléatoire pour un seul workout
 */
export const getRandomSingleWorkoutMessage = (workoutName: string): NotificationMessage => {
  const randomIndex = Math.floor(Math.random() * SINGLE_WORKOUT_MESSAGES.length);
  const message = SINGLE_WORKOUT_MESSAGES[randomIndex];
  
  return {
    title: message.title,
    body: message.body.replace('{workoutName}', workoutName),
  };
};

/**
 * Sélectionne un message aléatoire pour plusieurs workouts
 */
export const getRandomMultipleWorkoutsMessage = (): NotificationMessage => {
  const randomIndex = Math.floor(Math.random() * MULTIPLE_WORKOUTS_MESSAGES.length);
  return MULTIPLE_WORKOUTS_MESSAGES[randomIndex];
};



