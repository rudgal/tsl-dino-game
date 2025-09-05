/**
 * High score functionality
 * Handles localStorage persistence for player high scores
 */

const HIGH_SCORE_KEY = 'tsl-dino-game-high-score';

export function getHighScore(): number {
  const stored = localStorage.getItem(HIGH_SCORE_KEY);
  return stored ? parseInt(stored, 10) : 0;
}

export function setHighScore(score: number): void {
  localStorage.setItem(HIGH_SCORE_KEY, score.toString());
}

export function clearHighScore(): void {
  localStorage.removeItem(HIGH_SCORE_KEY);
}
