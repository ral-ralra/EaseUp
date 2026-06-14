/** @typedef {'GOOD' | 'TOO_CLOSE' | 'SHOULDER_TENSION'} WellnessStatus */

export const APP_NAME = "EaseUp";
export const APP_TAGLINE = "조금 더 편하게 일하자";
export const APP_DESCRIPTION =
  "장시간 컴퓨터 작업 시 눈 피로, 어깨 긴장, 고정 자세를 줄여주는 조용한 AI 웰니스 코치";

export const WELLNESS_STATUS = {
  GOOD: "GOOD",
  TOO_CLOSE: "TOO_CLOSE",
  SHOULDER_TENSION: "SHOULDER_TENSION",
};

export const STATUS_MESSAGES = {
  GOOD: "좋은 자세 유지 중입니다.",
  TOO_CLOSE: "화면과 조금 가까워졌어요.\n눈이 피곤할 수 있어요.",
  SHOULDER_TENSION: "어깨에 힘이 들어간 상태가 이어지고 있어요.\n어깨를 한번 툭 내려놓아 보세요.",
};

export const TRAY_MOOD = {
  GOOD: "good",
  TOO_CLOSE: "too-close",
  SHOULDER_TENSION: "shoulder",
  IDLE: "idle",
};

export const TRAY_EMOJI = {
  GOOD: "😊",
  TOO_CLOSE: "👀",
  SHOULDER_TENSION: "😣",
  IDLE: "⚪",
};

export const FACE_MESH_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js";
export const POSE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js";
export const CAMERA_UTILS_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js";

export const CAMERA_WIDTH = 320;
export const CAMERA_HEIGHT = 240;

export const INTERVAL_MS = {
  active: 1000,
  autoSave: 2000,
  powerSave: 2500,
};

export const AUTO_SAVE_AFTER_GOOD_MS = 5 * 60 * 1000;

export const TOO_CLOSE_RATIO = 1.175;

/** 기준 대비 어깨 평균 높이 상승(%) — 긴장 후보 */
export const SHOULDER_HEIGHT_RISE_MILD_PCT = 1.5;
/** 기준 대비 어깨 평균 높이 상승(%) — 강한 긴장 (빠른 판정) */
export const SHOULDER_HEIGHT_RISE_STRONG_PCT = 2.5;
/** 기준 대비 귀-어깨 거리 감소(%) — 긴장 후보 */
export const EAR_SHOULDER_DISTANCE_DECREASE_MILD_PCT = 1.5;
/** mild 후보 유지 시간 → SHOULDER_TENSION */
export const SHOULDER_TENSION_HOLD_MS = 10 * 1000;
/** strong 높이 상승 유지 시간 → 즉시 SHOULDER_TENSION */
export const SHOULDER_TENSION_STRONG_HOLD_MS = 5 * 1000;

export const ALERT_HOLD_MS = 10 * 1000;
export const ALERT_COOLDOWN_MS = 10 * 60 * 1000;

export const WELLNESS_INTERVAL_MS = 30 * 60 * 1000;
export const WELLNESS_POSTPONE_MS = 10 * 60 * 1000;

export const STORAGE_KEYS = {
  settings: "easeup-settings-v1",
  wellness: "easeup-wellness-v1",
};

export const FACE_LANDMARKS = {
  leftEyeOuter: 33,
  rightEyeOuter: 263,
};

export const POSE_LANDMARKS = {
  leftEar: 7,
  rightEar: 8,
  leftShoulder: 11,
  rightShoulder: 12,
};
