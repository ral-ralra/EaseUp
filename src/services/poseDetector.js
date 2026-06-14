import { POSE_LANDMARKS } from "../state/constants.js";

export function createPoseDetector(onResults) {
  const pose = new window.Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
  });

  pose.setOptions({
    modelComplexity: 0,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  pose.onResults(onResults);

  return {
    send: (video) => pose.send({ image: video }),
    close: () => pose.close(),
  };
}

function landmarkDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isVisible(landmark, minVisibility = 0.5) {
  return landmark && (landmark.visibility ?? 1) >= minVisibility;
}

/**
 * @param {Array<{ x: number, y: number, visibility?: number }>} landmarks
 */
export function measureShoulders(landmarks) {
  if (!landmarks?.length) return null;

  const leftShoulder = landmarks[POSE_LANDMARKS.leftShoulder];
  const rightShoulder = landmarks[POSE_LANDMARKS.rightShoulder];
  if (!isVisible(leftShoulder) || !isVisible(rightShoulder)) return null;

  const leftEar = landmarks[POSE_LANDMARKS.leftEar];
  const rightEar = landmarks[POSE_LANDMARKS.rightEar];

  let earShoulderDistance = null;
  if (isVisible(leftEar) && isVisible(rightEar)) {
    const leftDist = landmarkDistance(leftEar, leftShoulder);
    const rightDist = landmarkDistance(rightEar, rightShoulder);
    earShoulderDistance = (leftDist + rightDist) / 2;
  }

  return {
    leftY: leftShoulder.y,
    rightY: rightShoulder.y,
    earShoulderDistance,
  };
}
