import { FACE_LANDMARKS } from "../state/constants.js";

export function createFaceDetector(onResults) {
  const faceMesh = new window.FaceMesh({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  faceMesh.onResults(onResults);

  return {
    send: (video) => faceMesh.send({ image: video }),
    close: () => faceMesh.close(),
  };
}

/**
 * @param {Array<{ x: number, y: number, z?: number }>} landmarks
 */
export function measureFace(landmarks) {
  if (!landmarks?.length) return null;

  const left = landmarks[FACE_LANDMARKS.leftEyeOuter];
  const right = landmarks[FACE_LANDMARKS.rightEyeOuter];
  if (!left || !right) return null;

  const eyeDistance = Math.hypot(right.x - left.x, right.y - left.y);
  return { eyeDistance };
}
