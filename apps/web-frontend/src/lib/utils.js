export const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const calculateScore = (answers, totalQuestions) => {
  if (!answers || answers.length === 0) return 0;
  const correctAnswers = answers.filter(answer => answer.isCorrect).length;
  return Math.round((correctAnswers / totalQuestions) * 100);
};

export const getBehaviorScore = (violations) => {
  let score = 100;
  
  if (violations.tabSwitch > 0) {
    score -= violations.tabSwitch * 10;
  }
  if (violations.faceNotDetected > 0) {
    score -= violations.faceNotDetected * 5;
  }
  if (violations.noiseDetected > 0) {
    score -= violations.noiseDetected * 3;
  }
  
  return Math.max(0, score);
};

export const getFinalScore = (testScore, behaviorScore) => {
  return Math.round((testScore * 0.7) + (behaviorScore * 0.3));
};
