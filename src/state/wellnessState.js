import {
  WELLNESS_STATUS,
  TOO_CLOSE_RATIO,
  SHOULDER_HEIGHT_RISE_MILD_PCT,
  SHOULDER_HEIGHT_RISE_STRONG_PCT,
  EAR_SHOULDER_DISTANCE_DECREASE_MILD_PCT,
  SHOULDER_TENSION_HOLD_MS,
  SHOULDER_TENSION_STRONG_HOLD_MS,
} from "./constants.js";

/**
 * @param {number} currentEyeDistance
 * @param {number} baselineEyeDistance
 */
export function isTooClose(currentEyeDistance, baselineEyeDistance) {
  if (!baselineEyeDistance || !currentEyeDistance) return false;
  return currentEyeDistance >= baselineEyeDistance * TOO_CLOSE_RATIO;
}

/**
 * @param {{ leftY: number, rightY: number }} current
 * @param {{ leftY: number, rightY: number }} baseline
 */
export function getShoulderHeightChangePct(current, baseline) {
  if (!current || !baseline) return 0;
  const currentAvg = (current.leftY + current.rightY) / 2;
  const baselineAvg = (baseline.leftY + baseline.rightY) / 2;
  if (!baselineAvg) return 0;
  // Y 감소 = 어깨 상승 → 양수 %
  return ((baselineAvg - currentAvg) / baselineAvg) * 100;
}

/**
 * @param {{ earShoulderDistance: number|null }} current
 * @param {{ earShoulderDistance: number|null }} baseline
 */
export function getEarShoulderDistanceChangePct(current, baseline) {
  if (
    !current?.earShoulderDistance ||
    !baseline?.earShoulderDistance
  ) {
    return 0;
  }
  const currentDist = current.earShoulderDistance;
  const baselineDist = baseline.earShoulderDistance;
  if (!baselineDist) return 0;
  // 음수 = 거리 감소 = 긴장 후보
  return ((currentDist - baselineDist) / baselineDist) * 100;
}

/**
 * @typedef {Object} ShoulderTensionTracker
 * @property {number|null} heightCandidateSince
 * @property {number|null} earCandidateSince
 * @property {number|null} strongHeightSince
 */

export function createShoulderTensionTracker() {
  return {
    heightCandidateSince: null,
    earCandidateSince: null,
    strongHeightSince: null,
  };
}

/**
 * @param {{ leftY: number, rightY: number, earShoulderDistance?: number|null }} current
 * @param {{ leftY: number, rightY: number, earShoulderDistance?: number|null }} baseline
 * @param {ShoulderTensionTracker} tracker
 * @param {number} [now]
 */
export function evaluateShoulderTension(current, baseline, tracker, now = Date.now()) {
  const shoulderHeightChangePct = getShoulderHeightChangePct(current, baseline);
  const earShoulderDistanceChangePct = getEarShoulderDistanceChangePct(
    current,
    baseline,
  );

  const heightCandidate =
    shoulderHeightChangePct >= SHOULDER_HEIGHT_RISE_MILD_PCT;
  const earCandidate =
    earShoulderDistanceChangePct <= -EAR_SHOULDER_DISTANCE_DECREASE_MILD_PCT;
  const strongHeight =
    shoulderHeightChangePct >= SHOULDER_HEIGHT_RISE_STRONG_PCT;

  tracker.heightCandidateSince = updateSince(
    tracker.heightCandidateSince,
    heightCandidate,
    now,
  );
  tracker.earCandidateSince = updateSince(tracker.earCandidateSince, earCandidate, now);
  tracker.strongHeightSince = updateSince(tracker.strongHeightSince, strongHeight, now);

  const heightHoldMs = holdDuration(tracker.heightCandidateSince, now);
  const earHoldMs = holdDuration(tracker.earCandidateSince, now);
  const strongHoldMs = holdDuration(tracker.strongHeightSince, now);

  const tensionFromHeight =
    heightCandidate && heightHoldMs >= SHOULDER_TENSION_HOLD_MS;
  const tensionFromEar = earCandidate && earHoldMs >= SHOULDER_TENSION_HOLD_MS;
  const tensionFromStrong =
    strongHeight && strongHoldMs >= SHOULDER_TENSION_STRONG_HOLD_MS;

  const isTension = tensionFromHeight || tensionFromEar || tensionFromStrong;

  const tensionHoldSec = Math.max(
    heightCandidate ? heightHoldMs / 1000 : 0,
    earCandidate ? earHoldMs / 1000 : 0,
    strongHeight ? strongHoldMs / 1000 : 0,
  );

  return {
    isTension,
    shoulderHeightChangePct,
    earShoulderDistanceChangePct,
    tensionHoldSec,
    hasEarShoulderMetric: Boolean(
      current?.earShoulderDistance && baseline?.earShoulderDistance,
    ),
  };
}

function updateSince(previousSince, isActive, now) {
  if (!isActive) return null;
  return previousSince ?? now;
}

function holdDuration(since, now) {
  return since ? now - since : 0;
}

/**
 * @param {{ tooClose: boolean, shoulderTension: boolean }} signals
 * @returns {import('./constants.js').WellnessStatus}
 */
export function resolveStatus(signals) {
  if (signals.tooClose) return WELLNESS_STATUS.TOO_CLOSE;
  if (signals.shoulderTension) return WELLNESS_STATUS.SHOULDER_TENSION;
  return WELLNESS_STATUS.GOOD;
}

/**
 * @param {import('./constants.js').WellnessStatus} status
 */
export function statusToTrayMood(status) {
  switch (status) {
    case WELLNESS_STATUS.TOO_CLOSE:
      return "too-close";
    case WELLNESS_STATUS.SHOULDER_TENSION:
      return "shoulder";
    case WELLNESS_STATUS.GOOD:
      return "good";
    default:
      return "idle";
  }
}
