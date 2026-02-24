/**
 * Spaced Repetition System (SRS) Algorithm
 * Based on a simplified SM-2 algorithm
 */

// SRS States
export const SRS_STATES = {
  PENDING: 'pending',   // Not yet added to review queue
  NEW: 'new',           // In review queue, not yet reviewed
  ACTIVE: 'active',     // Being actively reviewed
  EXCLUDE: 'exclude',   // Excluded from reviews
};

// Quality ratings for review responses
export const QUALITY = {
  AGAIN: 0,     // Complete blackout, no recall
  HARD: 1,      // Incorrect, but upon seeing answer remembered
  GOOD: 2,      // Correct with difficulty
  EASY: 3,      // Perfect recall
};

// Intervals in days
const INITIAL_INTERVAL = 1;
const EASY_BONUS = 1.3;
const HARD_PENALTY = 0.5;

/**
 * Calculate the next review date based on performance
 * @param {Object} entry - The entry being reviewed
 * @param {number} quality - The quality of the response (0-3)
 * @returns {Object} Updated SRS data
 */
export function calculateNextReview(entry, quality) {
  const now = new Date();
  let {
    mastery_level = 0,
    streak = 0,
    review_count = 0,
  } = entry;

  // Update streak
  if (quality >= QUALITY.GOOD) {
    streak += 1;
  } else {
    streak = 0;
  }

  // Calculate mastery change
  let masteryDelta = 0;
  switch (quality) {
    case QUALITY.AGAIN:
      masteryDelta = -0.2;
      break;
    case QUALITY.HARD:
      masteryDelta = -0.1;
      break;
    case QUALITY.GOOD:
      masteryDelta = 0.1;
      break;
    case QUALITY.EASY:
      masteryDelta = 0.15;
      break;
  }

  // Apply mastery change
  mastery_level = Math.max(0, Math.min(1, mastery_level + masteryDelta));

  // Calculate interval
  let interval = INITIAL_INTERVAL;

  if (quality >= QUALITY.GOOD) {
    // Successful recall - increase interval
    const baseInterval = Math.max(1, streak) * (1 + mastery_level * 2);
    interval = quality === QUALITY.EASY
      ? baseInterval * EASY_BONUS
      : baseInterval;
  } else {
    // Failed recall - decrease interval
    interval = quality === QUALITY.AGAIN
      ? INITIAL_INTERVAL
      : INITIAL_INTERVAL * HARD_PENALTY;
  }

  // Calculate next review date
  const nextReviewAt = new Date(now);
  nextReviewAt.setDate(nextReviewAt.getDate() + Math.ceil(interval));

  return {
    mastery_level,
    streak,
    review_count: review_count + 1,
    next_review_at: nextReviewAt.toISOString(),
    last_reviewed_at: now.toISOString(),
    srs_state: SRS_STATES.ACTIVE,
  };
}

/**
 * Get entries due for review
 * @param {Array} entries - Array of entries to filter
 * @returns {Array} Entries due for review
 */
export function getDueEntries(entries) {
  const now = new Date();

  return entries.filter(entry => {
    if (entry.srs_state === SRS_STATES.EXCLUDE) return false;
    if (entry.srs_state === SRS_STATES.NEW || entry.srs_state === SRS_STATES.PENDING) return true;

    if (!entry.next_review_at) return true;

    const nextReview = new Date(entry.next_review_at);
    return nextReview <= now;
  });
}

/**
 * Sort entries by review priority
 * @param {Array} entries - Array of entries to sort
 * @returns {Array} Sorted entries
 */
export function sortByPriority(entries) {
  return [...entries].sort((a, b) => {
    // New entries first
    if (a.srs_state === SRS_STATES.NEW && b.srs_state !== SRS_STATES.NEW) return -1;
    if (b.srs_state === SRS_STATES.NEW && a.srs_state !== SRS_STATES.NEW) return 1;

    // Then by overdue amount
    const nowMs = Date.now();
    const overdueA = a.next_review_at ? nowMs - new Date(a.next_review_at).getTime() : Infinity;
    const overdueB = b.next_review_at ? nowMs - new Date(b.next_review_at).getTime() : Infinity;

    return overdueB - overdueA;
  });
}

/**
 * Get review statistics for a deck
 * @param {Array} entries - Array of entries in the deck
 * @returns {Object} Review statistics
 */
export function getReviewStats(entries) {
  const now = new Date();

  const stats = {
    total: entries.length,
    pending: 0,
    new: 0,
    due: 0,
    mastered: 0,
    excluded: 0,
    averageMastery: 0,
  };

  let masterySum = 0;
  let masteryCount = 0;

  entries.forEach(entry => {
    switch (entry.srs_state) {
      case SRS_STATES.PENDING:
        stats.pending++;
        break;
      case SRS_STATES.NEW:
        stats.new++;
        break;
      case SRS_STATES.EXCLUDE:
        stats.excluded++;
        break;
      case SRS_STATES.ACTIVE:
        if (entry.mastery_level >= 0.8) {
          stats.mastered++;
        }
        if (entry.next_review_at && new Date(entry.next_review_at) <= now) {
          stats.due++;
        }
        masterySum += entry.mastery_level || 0;
        masteryCount++;
        break;
    }
  });

  stats.averageMastery = masteryCount > 0 ? masterySum / masteryCount : 0;

  return stats;
}
