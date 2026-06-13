import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

const FACE_MESH_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js";
const CAMERA_UTILS_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js";
const HEALTH_STATS_STORAGE_KEY = "postureguard-health-stats-v1";
const ONBOARDING_STORAGE_KEY = "postureguard-onboarding-seen-v1";
const ALERT_COOLDOWN_MS = 10000;
const TOAST_DURATION_MS = 3000;
const SCORE_EVENT_COOLDOWN_MS = 30000;
const EYE_REST_INTERVAL_SECONDS = 20 * 60;
const EYE_REST_TEST_SECONDS = 20;
const STRETCH_INTERVAL_SECONDS = 60 * 60;
const STRETCH_POSTPONE_SECONDS = 15 * 60;
const STRETCH_TEST_SECONDS = 30;
const DEFAULT_COACH_STATE = "happy";

const COACH_THRESHOLDS = {
  smile: 0,
  mild: 10,
  neutral: 30,
  tired: 60,
};

const THRESHOLDS = {
  nearRatio: 0.18,
  headDownY: 0.04,
  chinDownY: 0.045,
  tiltEyeYDiff: 0.035,
  turnNoseOffsetX: 0.04,
  centerMinX: 0.35,
  centerMaxX: 0.65,
  centerMinY: 0.25,
  centerMaxY: 0.75,
  browDistance: 0.04,
};

const LANDMARKS = {
  leftEyeOuter: 33,
  rightEyeOuter: 263,
  noseTip: 1,
  chin: 152,
  leftInnerBrow: 55,
  rightInnerBrow: 285,
};

const STATUS_META = {
  idle: {
    label: "대기 중",
    description: "카메라를 시작해 기준 자세를 저장하세요.",
    dot: "#CBD5E1",
    dotTitle: "준비가 되면 함께 자세를 살펴볼게요",
    text: "#475569",
  },
  ready: {
    label: "기준 자세 필요",
    description: "카메라를 보며 바른 자세를 맞춘 뒤 기준 자세를 저장하세요.",
    dot: "#F5C451",
    dotTitle: "편한 자세를 맞춘 뒤 기준 자세를 저장해 주세요",
    text: "#a16207",
  },
  calibrated: {
    label: "기준 자세 저장됨",
    description: "모니터링 시작 버튼을 누르면 화면이 최소화됩니다.",
    dot: "#F5C451",
    dotTitle: "이제 조용히 자세를 살펴볼 수 있어요",
    text: "#a16207",
  },
  normal: {
    label: "좋은 자세",
    description: "좋은 자세 유지 중입니다.",
    dot: "#5FCF9B",
    dotTitle: "좋은 자세 유지 중",
    text: "#166534",
  },
  tooClose: {
    label: "눈 피로 가능",
    description: "눈이 조금 피곤할 수 있어요. 조금만 뒤로 앉아볼까요?",
    dot: "#FF7A6B",
    dotTitle: "조금만 뒤로 앉아볼까요?",
    text: "#B45309",
  },
  turtleNeck: {
    label: "목 긴장 감지",
    description: "목이 조금 긴장한 것 같아요. 어깨를 가볍게 펴볼까요?",
    dot: "#FF7A6B",
    dotTitle: "어깨를 가볍게 펴볼까요?",
    text: "#B45309",
  },
  browFurrow: {
    label: "눈 긴장 감지",
    description: "눈에 힘이 조금 들어간 것 같아요. 잠시 먼 곳을 바라볼까요?",
    dot: "#FF7A6B",
    dotTitle: "잠시 먼 곳을 바라볼까요?",
    text: "#B45309",
  },
  headTilt: {
    label: "머리 기울임 감지",
    description: "머리가 살짝 기울어진 것 같아요. 편하게 가운데로 돌아와 볼까요?",
    dot: "#F5C451",
    dotTitle: "머리를 편하게 가운데로 돌려볼까요?",
    text: "#a16207",
  },
  faceTurn: {
    label: "시선 방향 확인",
    description: "얼굴이 살짝 돌아간 것 같아요. 화면을 편하게 바라봐 주세요.",
    dot: "#F5C451",
    dotTitle: "화면을 편하게 바라봐 주세요",
    text: "#a16207",
  },
  offCenter: {
    label: "카메라 위치 확인",
    description: "얼굴이 화면 중앙에서 조금 벗어났어요. 카메라 가운데에 맞춰볼까요?",
    dot: "#F5C451",
    dotTitle: "카메라 가운데에 맞춰볼까요?",
    text: "#a16207",
  },
  noFace: {
    label: "얼굴 감지 안 됨",
    description: "얼굴이 잠시 보이지 않아요. 카메라 위치를 천천히 확인해 주세요.",
    dot: "#CBD5E1",
    dotTitle: "얼굴 감지 중",
    text: "#475569",
  },
  error: {
    label: "오류",
    description: "카메라 연결을 다시 확인해 주세요.",
    dot: "#FF7A6B",
    dotTitle: "카메라 연결을 확인해 주세요",
    text: "#B45309",
  },
};

const ALERT_MESSAGES = {
  tooClose: "눈이 조금 피곤할 수 있어요. 조금만 뒤로 앉아볼까요?",
  turtleNeck: "목이 조금 긴장한 것 같아요. 어깨를 가볍게 펴볼까요?",
  browFurrow: "눈에 힘이 조금 들어간 것 같아요. 잠시 먼 곳을 바라볼까요?",
  headTilt: "머리가 살짝 기울어진 것 같아요. 편하게 가운데로 돌아와 볼까요?",
  faceTurn: "얼굴이 살짝 돌아간 것 같아요. 화면을 편하게 바라봐 주세요.",
  offCenter: "얼굴이 화면 중앙에서 조금 벗어났어요. 카메라 가운데에 맞춰볼까요?",
  noFace: "얼굴이 잠시 보이지 않아요. 카메라 위치를 천천히 확인해 주세요.",
  eyeRest: "20초 동안 먼 곳을 바라볼까요?",
  stretchReminder: "오래 앉아 있었어요. 1분만 가볍게 풀어볼까요?",
  stretchComplete: "좋아요. 몸이 조금 더 편해졌을 거예요.",
};

const TRACKED_STATUSES = ["tooClose", "turtleNeck", "headTilt", "faceTurn"];
const STAT_LABELS = {
  tooClose: "화면 가까움",
  turtleNeck: "고개 숙임",
  headTilt: "고개 기울어짐",
  faceTurn: "얼굴 회전",
};

const STRETCH_EXERCISES = [
  {
    title: "목 좌우 천천히 기울이기",
    description: "어깨는 편하게 두고, 귀가 어깨에 가까워지는 느낌으로 천천히 기울여요.",
    duration: "20초",
  },
  {
    title: "어깨 돌리기",
    description: "어깨를 작게 뒤로 돌리며 목과 승모근의 긴장을 풀어주세요.",
    duration: "20초",
  },
  {
    title: "손목 스트레칭",
    description: "한 손으로 반대 손가락을 가볍게 당겨 손목 앞뒤를 풀어주세요.",
    duration: "20초",
  },
  {
    title: "등 펴고 깊게 숨쉬기",
    description: "등을 길게 세우고 코로 들이마신 뒤 천천히 내쉬어 보세요.",
    duration: "20초",
  },
];

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${src}"]`);

    if (existingScript) {
      if (existingScript.dataset.loaded === "true") {
        resolve();
        return;
      }

      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true },
    );
    script.addEventListener("error", reject, { once: true });
    document.body.appendChild(script);
  });
}

function getCameraErrorInfo(error) {
  if (!navigator.mediaDevices?.getUserMedia) {
    return {
      title: "이 브라우저에서는 카메라를 사용할 수 없습니다.",
      description: "Windows Chrome, Windows Edge, Mac Chrome, Mac Safari 최신 버전에서 사용해 주세요.",
    };
  }

  if (!window.isSecureContext && window.location.hostname !== "localhost") {
    return {
      title: "HTTPS 환경이 필요합니다.",
      description: "카메라는 HTTPS 주소 또는 localhost에서만 사용할 수 있습니다. Vercel, Netlify, GitHub Pages처럼 HTTPS가 제공되는 주소로 접속해 주세요.",
    };
  }

  if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
    return {
      title: "카메라 접근 권한이 필요합니다.",
      description: "브라우저 주소창의 카메라 아이콘을 눌러 권한을 허용한 뒤 다시 시도해 주세요.",
    };
  }

  if (error?.name === "NotFoundError" || error?.name === "DevicesNotFoundError") {
    return {
      title: "사용 가능한 카메라를 찾지 못했습니다.",
      description: "노트북 카메라 또는 외부 웹캠이 연결되어 있는지 확인해 주세요.",
    };
  }

  if (error?.name === "NotReadableError" || error?.name === "TrackStartError") {
    return {
      title: "카메라를 시작할 수 없습니다.",
      description: "다른 앱에서 카메라를 사용 중일 수 있습니다. 화상회의 앱을 종료한 뒤 다시 시도해 주세요.",
    };
  }

  return {
    title: "카메라를 초기화하지 못했습니다.",
    description: "브라우저 카메라 권한과 연결 상태를 확인한 뒤 다시 시도해 주세요.",
  };
}

function euclideanDistance3D(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function getMeasurements(landmarks) {
  if (!landmarks) return null;

  const leftEye = landmarks[LANDMARKS.leftEyeOuter];
  const rightEye = landmarks[LANDMARKS.rightEyeOuter];
  const nose = landmarks[LANDMARKS.noseTip];
  const chin = landmarks[LANDMARKS.chin];
  const leftBrow = landmarks[LANDMARKS.leftInnerBrow];
  const rightBrow = landmarks[LANDMARKS.rightInnerBrow];

  if (!leftEye || !rightEye || !nose || !chin || !leftBrow || !rightBrow) return null;

  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const eyeCenterY = (leftEye.y + rightEye.y) / 2;
  const faceCenterX = (eyeCenterX + nose.x + chin.x) / 3;
  const faceCenterY = (eyeCenterY + nose.y + chin.y) / 3;

  return {
    eyeDistance: euclideanDistance3D(leftEye, rightEye),
    eyeYDiff: Math.abs(leftEye.y - rightEye.y),
    noseY: nose.y,
    chinY: chin.y,
    noseOffsetX: nose.x - eyeCenterX,
    faceCenterX,
    faceCenterY,
    browDistance: euclideanDistance3D(leftBrow, rightBrow),
  };
}

function buildDebugInfo(measurements, baseline, statusKey) {
  return {
    statusKey,
    eyeDistanceRatio: baseline
      ? measurements.eyeDistance / baseline.eyeDistance - 1
      : 0,
    noseYDelta: baseline ? measurements.noseY - baseline.noseY : 0,
    eyeYDiff: measurements.eyeYDiff,
    noseOffsetX: measurements.noseOffsetX,
    faceCenterX: measurements.faceCenterX,
    faceCenterY: measurements.faceCenterY,
  };
}

function isFaceCentered(measurements) {
  return (
    measurements.faceCenterX >= THRESHOLDS.centerMinX &&
    measurements.faceCenterX <= THRESHOLDS.centerMaxX &&
    measurements.faceCenterY >= THRESHOLDS.centerMinY &&
    measurements.faceCenterY <= THRESHOLDS.centerMaxY
  );
}

function analyzePosture(measurements, baseline) {
  if (!measurements) {
    return {
      statusKey: "noFace",
      debug: null,
    };
  }

  const debugBaseline = baseline || measurements;

  // 얼굴이 카메라 중앙에서 벗어나면 거리와 거북목 계산이 흔들리므로 먼저 위치를 안내합니다.
  if (!isFaceCentered(measurements)) {
    return {
      statusKey: "offCenter",
      debug: buildDebugInfo(measurements, debugBaseline, "offCenter"),
    };
  }

  const relativeNoseOffsetX = Math.abs(
    measurements.noseOffsetX - (baseline?.noseOffsetX || 0),
  );
  const relativeEyeYDiff = Math.abs(
    measurements.eyeYDiff - (baseline?.eyeYDiff || 0),
  );
  const isTurned = relativeNoseOffsetX >= THRESHOLDS.turnNoseOffsetX;
  const isTilted = relativeEyeYDiff >= THRESHOLDS.tiltEyeYDiff;

  // 얼굴 회전이나 좌우 기울임이 있으면 눈 거리/코 Y 기반 판단은 보류합니다.
  if (isTurned) {
    return {
      statusKey: "faceTurn",
      debug: buildDebugInfo(measurements, debugBaseline, "faceTurn"),
    };
  }

  if (isTilted) {
    return {
      statusKey: "headTilt",
      debug: buildDebugInfo(measurements, debugBaseline, "headTilt"),
    };
  }

  if (!baseline) {
    return {
      statusKey: "ready",
      debug: buildDebugInfo(measurements, debugBaseline, "ready"),
    };
  }

  const eyeDistanceRatio = measurements.eyeDistance / baseline.eyeDistance - 1;
  const noseYDelta = measurements.noseY - baseline.noseY;
  const chinYDelta = measurements.chinY - baseline.chinY;
  const isTooClose = eyeDistanceRatio >= THRESHOLDS.nearRatio;
  const isHeadDown =
    noseYDelta >= THRESHOLDS.headDownY && chinYDelta >= THRESHOLDS.chinDownY;

  if (isTooClose) {
    return {
      statusKey: "tooClose",
      debug: buildDebugInfo(measurements, baseline, "tooClose"),
    };
  }

  if (isHeadDown) {
    return {
      statusKey: "turtleNeck",
      debug: buildDebugInfo(measurements, baseline, "turtleNeck"),
    };
  }

  if (measurements.browDistance < THRESHOLDS.browDistance) {
    return {
      statusKey: "browFurrow",
      debug: buildDebugInfo(measurements, baseline, "browFurrow"),
    };
  }

  return {
    statusKey: "normal",
    debug: buildDebugInfo(measurements, baseline, "normal"),
  };
}

function formatSignedNumber(value, digits = 3) {
  if (!Number.isFinite(value)) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;
}

function formatNumber(value, digits = 3) {
  if (!Number.isFinite(value)) return "-";
  return value.toFixed(digits);
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createEmptyHealthStats(date = getTodayKey()) {
  return {
    date,
    score: 100,
    goodPostureSeconds: 0,
    badPostureSeconds: 0,
    coachState: DEFAULT_COACH_STATE,
    counts: {
      tooClose: 0,
      turtleNeck: 0,
      headTilt: 0,
      faceTurn: 0,
    },
    lastPenaltyAt: {},
    eyeRestNextAt: Date.now() + EYE_REST_INTERVAL_SECONDS * 1000,
    stretchDisabledDate: "",
    stretchCompletedCount: 0,
    nextStretchAt: Date.now() + STRETCH_INTERVAL_SECONDS * 1000,
  };
}

// 감점은 이벤트 단위로만 적용합니다. 같은 이벤트가 프레임마다 반복되어도 30초 안에는 감점하지 않습니다.
function calculatePostureScore(currentScore, shouldDeduct) {
  if (!shouldDeduct) return currentScore;
  return Math.max(0, currentScore - 1);
}

// 좋은 자세 시간은 1초 타이머에서 normal 상태일 때만 누적합니다.
function updateGoodPostureTime(stats, secondsToAdd = 1) {
  return {
    ...stats,
    goodPostureSeconds: stats.goodPostureSeconds + secondsToAdd,
  };
}

// 나쁜 자세가 이어지는 동안만 코치 컨디션 시간을 누적합니다.
function updateBadPostureTime(stats, secondsToAdd = 1) {
  return {
    ...stats,
    badPostureSeconds: (stats.badPostureSeconds || 0) + secondsToAdd,
  };
}

// 좋은 자세가 돌아오면 즉시 초기화하지 않고 1분당 30초씩 천천히 회복합니다.
function recoverCoachMood(stats, goodSeconds = 1) {
  return {
    ...stats,
    badPostureSeconds: Math.max(0, (stats.badPostureSeconds || 0) - goodSeconds * 0.5),
  };
}

function updateStatistics(stats, statusKey, now = Date.now()) {
  if (!TRACKED_STATUSES.includes(statusKey)) return stats;

  const lastPenaltyAt = stats.lastPenaltyAt?.[statusKey] || 0;
  if (now - lastPenaltyAt < SCORE_EVENT_COOLDOWN_MS) return stats;

  return {
    ...stats,
    score: calculatePostureScore(stats.score, true),
    counts: {
      ...stats.counts,
      [statusKey]: (stats.counts?.[statusKey] || 0) + 1,
    },
    lastPenaltyAt: {
      ...stats.lastPenaltyAt,
      [statusKey]: now,
    },
  };
}

function getCoachMood(badPostureSeconds = 0) {
  const badPostureMinutes = badPostureSeconds / 60;

  if (badPostureMinutes >= COACH_THRESHOLDS.tired) {
    return {
      state: "tired",
      icon: "😣",
      label: "휴식 권장",
      message: "목과 눈이 많이 피곤할 수 있어요.\n잠깐 쉬어가는 건 어떨까요?",
      color: "#FF7A6B",
      softColor: "rgba(255, 122, 107, 0.12)",
    };
  }

  if (badPostureMinutes >= COACH_THRESHOLDS.neutral) {
    return {
      state: "neutral",
      icon: "😐",
      label: "자세 정리 필요",
      message: "잠시 자세를 정리해볼까요?",
      color: "#F59E0B",
      softColor: "rgba(245, 158, 11, 0.12)",
    };
  }

  if (badPostureMinutes >= COACH_THRESHOLDS.mild) {
    return {
      state: "mild",
      icon: "🙂",
      label: "조금 피곤",
      message: "조금 피곤한 것 같아요.",
      color: "#F5C451",
      softColor: "rgba(245, 196, 81, 0.14)",
    };
  }

  return {
    state: DEFAULT_COACH_STATE,
    icon: "😊",
    label: "좋은 상태",
    message: "오늘도 잘하고 있어요.",
    color: "#5FCF9B",
    softColor: "rgba(95, 207, 155, 0.14)",
  };
}

function getCoachTooltip(coachMood, stats, status) {
  return `${coachMood.icon}\n\n오늘의 자세 점수 ${stats.score}점\n좋은 자세 유지 ${formatDuration(
    stats.goodPostureSeconds,
  )}\n현재 상태 ${status.label}\n\n${coachMood.message}`;
}

function resetDailyStats() {
  return createEmptyHealthStats();
}

function saveHealthStats(stats) {
  try {
    localStorage.setItem(HEALTH_STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    // 저장 공간이 막혀 있어도 자세 감지는 계속 동작해야 합니다.
  }
}

function loadHealthStats() {
  try {
    const savedStats = JSON.parse(localStorage.getItem(HEALTH_STATS_STORAGE_KEY));
    if (!savedStats || savedStats.date !== getTodayKey()) {
      return resetDailyStats();
    }

    const defaults = createEmptyHealthStats(savedStats.date);
    return {
      ...defaults,
      ...savedStats,
      badPostureSeconds: savedStats.badPostureSeconds || 0,
      coachState: savedStats.coachState || DEFAULT_COACH_STATE,
      counts: {
        ...defaults.counts,
        ...savedStats.counts,
      },
      lastPenaltyAt: savedStats.lastPenaltyAt || {},
      eyeRestNextAt: savedStats.eyeRestNextAt || defaults.eyeRestNextAt,
      stretchDisabledDate: savedStats.stretchDisabledDate || "",
      stretchCompletedCount: savedStats.stretchCompletedCount || 0,
      nextStretchAt: savedStats.nextStretchAt || defaults.nextStretchAt,
    };
  } catch (error) {
    return resetDailyStats();
  }
}

function startEyeRestTimer(stats, seconds = EYE_REST_INTERVAL_SECONDS) {
  return {
    ...stats,
    eyeRestNextAt: Date.now() + seconds * 1000,
  };
}

function startStretchTimer(stats, seconds = STRETCH_INTERVAL_SECONDS) {
  return {
    ...stats,
    nextStretchAt: Date.now() + seconds * 1000,
  };
}

function getNextStretchTimeText(stats) {
  if (stats.stretchDisabledDate === getTodayKey()) {
    return "오늘은 쉬어가기";
  }

  const remainingSeconds = Math.max(
    0,
    Math.ceil(((stats.nextStretchAt || Date.now()) - Date.now()) / 1000),
  );

  return remainingSeconds === 0 ? "지금" : formatDuration(remainingSeconds);
}

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}시간 ${minutes}분`;
  if (minutes > 0) return `${minutes}분 ${seconds}초`;
  return `${seconds}초`;
}

export default function PostureCoach() {
  const videoRef = useRef(null);
  const faceMeshRef = useRef(null);
  const cameraRef = useRef(null);
  const latestLandmarksRef = useRef(null);
  const calibrationRef = useRef(null);
  const monitoringRef = useRef(false);
  const mutedRef = useRef(false);
  const lastAlertTimeRef = useRef({});
  const toastTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const statusKeyRef = useRef("idle");
  const healthStatsRef = useRef(loadHealthStats());
  const eyeRestShownRef = useRef(false);
  const stretchReminderShownRef = useRef(false);

  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [viewMode, setViewMode] = useState("setup");
  const [statusKey, setStatusKey] = useState("idle");
  const [debugInfo, setDebugInfo] = useState(null);
  const [healthStats, setHealthStats] = useState(healthStatsRef.current);
  const [eyeRestRemainingSeconds, setEyeRestRemainingSeconds] = useState(
    Math.max(0, Math.ceil((healthStatsRef.current.eyeRestNextAt - Date.now()) / 1000)),
  );
  const [stretchRemainingSeconds, setStretchRemainingSeconds] = useState(
    Math.max(0, Math.ceil((healthStatsRef.current.nextStretchAt - Date.now()) / 1000)),
  );
  const [isStretchGuideOpen, setIsStretchGuideOpen] = useState(false);
  const [stretchStepIndex, setStretchStepIndex] = useState(0);
  const [cameraErrorInfo, setCameraErrorInfo] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(
    () => localStorage.getItem(ONBOARDING_STORAGE_KEY) !== "true",
  );
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [toast, setToast] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const status = STATUS_META[statusKey] || STATUS_META.idle;
  const coachFace = getCoachMood(healthStats.badPostureSeconds);
  const orbTooltip = getCoachTooltip(coachFace, healthStats, status);
  const postureCorrectionCount = TRACKED_STATUSES.reduce(
    (total, trackedStatus) => total + (healthStats.counts?.[trackedStatus] || 0),
    0,
  );
  const nextStretchTimeText =
    healthStats.stretchDisabledDate === getTodayKey()
      ? getNextStretchTimeText(healthStats)
      : stretchRemainingSeconds === 0
        ? "지금"
        : formatDuration(stretchRemainingSeconds);
  const wellnessStatus =
    statusKey === "normal"
      ? "Optimal"
      : ["ready", "calibrated", "headTilt", "faceTurn", "offCenter"].includes(statusKey)
        ? "Good"
        : "Attention";
  const isPreviewMode = viewMode === "preview";
  const isMonitoringMode = viewMode === "monitoring";
  const isCautionStatus = ["ready", "calibrated", "headTilt", "faceTurn", "offCenter"].includes(
    statusKey,
  );
  const isCoachingStatus = ["tooClose", "turtleNeck", "browFurrow", "error"].includes(statusKey);
  const isOrbPaused = ["idle", "noFace"].includes(statusKey);
  const orbAnimation = isOrbPaused
    ? "none"
    : `postureGuardBreath ${isCoachingStatus ? "2.2s" : isCautionStatus ? "2.6s" : "3s"} ease-in-out infinite`;

  const styles = useMemo(
    () => ({
      appRoot: {
        position: "fixed",
        top: "clamp(16px, 2vw, 24px)",
        right: "clamp(16px, 2vw, 24px)",
        bottom: "clamp(16px, 2vw, 24px)",
        width: "min(483px, max(368px, 28.75vw), calc(100vw - 32px))",
        zIndex: 9999,
        display: "block",
        padding: 0,
        overflow: "visible",
        background: "transparent",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
      offscreenRoot: {
        position: "fixed",
        left: "-9999px",
        top: "-9999px",
        width: "420px",
        opacity: 0,
        pointerEvents: "none",
        zIndex: -1,
      },
      panel: {
        width: "100%",
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: "18px",
        borderRadius: "24px",
        background: "#FFFFFF",
        boxShadow: "0 18px 55px rgba(15, 23, 42, 0.08)",
        border: "1px solid #E5E7EB",
        color: "#0f172a",
        backdropFilter: "blur(10px)",
      },
      header: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "12px",
        marginBottom: "16px",
        flexWrap: "wrap",
      },
      brandBlock: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        minWidth: 0,
      },
      logoMark: {
        width: "38px",
        height: "38px",
        borderRadius: "14px",
        display: "grid",
        placeItems: "center",
        background: `linear-gradient(135deg, ${coachFace.softColor} 0%, #FFFFFF 100%)`,
        border: "1px solid #E5E7EB",
        boxShadow: `0 8px 22px ${coachFace.softColor}`,
        fontSize: "18px",
      },
      headerActions: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flex: "0 0 auto",
      },
      title: {
        margin: 0,
        fontSize: "20px",
        fontWeight: 700,
        letterSpacing: "-0.04em",
        lineHeight: 1.1,
      },
      subtitle: {
        margin: "3px 0 0",
        fontSize: "12px",
        color: "#64748B",
      },
      settingsButton: {
        width: "36px",
        height: "36px",
        borderRadius: "12px",
        border: "1px solid #E5E7EB",
        background: "#FFFFFF",
        color: "#64748B",
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
      },
      guideText: {
        margin: "0 0 16px",
        fontSize: "14px",
        lineHeight: 1.55,
        color: "#64748B",
      },
      statusLine: {
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        width: "fit-content",
        marginBottom: "14px",
        padding: "6px 10px",
        borderRadius: "999px",
        border: "1px solid #E5E7EB",
        background: "#F8FAFC",
        fontSize: "13px",
        fontWeight: 600,
        color: status.text,
      },
      statusDot: {
        width: "7px",
        height: "7px",
        borderRadius: "999px",
        background: status.dot,
        boxShadow: "none",
        flex: "0 0 auto",
      },
      video: {
        width: "100%",
        aspectRatio: "4 / 3",
        height: "auto",
        maxHeight: "180px",
        maxWidth: "100%",
        objectFit: "cover",
        borderRadius: "16px",
        background: "#0f172a",
        border: "1px solid #E5E7EB",
        transform: "scaleX(-1)",
        display: "block",
        marginBottom: "16px",
        overflow: "hidden",
      },
      controls: {
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "10px",
      },
      dashboardGrid: {
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "12px",
        alignItems: "start",
        order: 2,
      },
      card: {
        borderRadius: "18px",
        border: "1px solid #E5E7EB",
        background: "#FFFFFF",
        boxShadow: "0 8px 26px rgba(15, 23, 42, 0.05)",
        padding: "14px",
      },
      cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        marginBottom: "14px",
      },
      cardTitle: {
        margin: 0,
        fontSize: "15px",
        fontWeight: 700,
        color: "#0F172A",
      },
      cardDescription: {
        margin: "4px 0 0",
        fontSize: "13px",
        color: "#64748B",
        lineHeight: 1.5,
      },
      metricGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "10px",
        marginTop: "12px",
        order: 3,
      },
      metricCard: {
        borderRadius: "16px",
        border: "1px solid #E5E7EB",
        background: "#F8FAFC",
        padding: "12px",
      },
      metricLabel: {
        margin: 0,
        fontSize: "12px",
        color: "#64748B",
        lineHeight: 1.4,
      },
      metricValue: {
        margin: "7px 0 0",
        fontSize: "18px",
        fontWeight: 700,
        letterSpacing: "-0.04em",
        color: "#0F172A",
      },
      miniOrb: {
        width: "42px",
        height: "30px",
        borderRadius: "999px",
        display: "grid",
        placeItems: "center",
        background: coachFace.softColor,
        border: "1px solid #E5E7EB",
        fontSize: "18px",
      },
      graphGrid: {
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "12px",
        marginTop: "12px",
        order: 4,
      },
      graphCard: {
        minHeight: "118px",
        borderRadius: "18px",
        border: "1px solid #E5E7EB",
        background:
          "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
        padding: "14px",
        overflow: "hidden",
      },
      graphTitle: {
        margin: 0,
        fontSize: "12px",
        fontWeight: 700,
        color: "#0F172A",
      },
      graphBars: {
        display: "flex",
        alignItems: "flex-end",
        gap: "6px",
        height: "62px",
        marginTop: "18px",
      },
      graphBar: {
        flex: 1,
        borderRadius: "999px 999px 4px 4px",
        background: "linear-gradient(180deg, #A5B4FC 0%, #6366F1 100%)",
        opacity: 0.68,
      },
      sectionLabel: {
        margin: "2px 0 -2px",
        fontSize: "12px",
        fontWeight: 600,
        color: "#64748B",
      },
      buttonRow: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "10px",
      },
      button: {
        border: "1px solid #111827",
        borderRadius: "10px",
        padding: "10px 14px",
        fontSize: "14px",
        fontWeight: 600,
        color: "#ffffff",
        background: "#111827",
        cursor: "pointer",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
        transition: "background 160ms ease, border-color 160ms ease, opacity 160ms ease",
      },
      secondaryButton: {
        border: "1px solid #E5E7EB",
        borderRadius: "10px",
        padding: "10px 14px",
        fontSize: "14px",
        fontWeight: 600,
        color: "#0F172A",
        background: "#FFFFFF",
        cursor: "pointer",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
        transition: "background 160ms ease, border-color 160ms ease, opacity 160ms ease",
      },
      dangerButton: {
        border: "1px solid #FCA5A5",
        borderRadius: "10px",
        padding: "10px 14px",
        fontSize: "14px",
        fontWeight: 600,
        color: "#991B1B",
        background: "#FEF2F2",
        cursor: "pointer",
      },
      linkButton: {
        border: "1px solid #E5E7EB",
        borderRadius: "999px",
        padding: "7px 11px",
        background: "#FFFFFF",
        color: "#64748B",
        fontSize: "12px",
        fontWeight: 600,
        cursor: "pointer",
      },
      disabledButton: {
        opacity: 0.48,
        cursor: "not-allowed",
      },
      muteLabel: {
        display: "flex",
        alignItems: "center",
        gap: "9px",
        padding: "2px 0",
        fontSize: "14px",
        color: "#475569",
        userSelect: "none",
      },
      checkbox: {
        width: "16px",
        height: "16px",
        margin: 0,
        accentColor: "#6366F1",
        cursor: "pointer",
      },
      privacyText: {
        margin: "14px 0 0",
        fontSize: "12px",
        lineHeight: 1.55,
        color: "#64748B",
      },
      helperText: {
        margin: "10px 0 0",
        fontSize: "13px",
        lineHeight: 1.5,
        color: isCalibrated ? "#047857" : "#64748B",
      },
      debugPanel: {
        margin: "12px 0 0",
        padding: "12px",
        borderRadius: "14px",
        background: "#F8FAFC",
        border: "1px solid #E5E7EB",
        color: "#475569",
        fontSize: "12px",
        lineHeight: 1.55,
      },
      debugTitle: {
        margin: "0 0 8px",
        fontSize: "12px",
        fontWeight: 700,
        color: "#0F172A",
      },
      debugGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "5px 10px",
      },
      debugValue: {
        fontVariantNumeric: "tabular-nums",
        color: "#0F172A",
      },
      errorText: {
        margin: "10px 0 0",
        fontSize: "12px",
        lineHeight: 1.5,
        color: "#B91C1C",
      },
      // Monitoring 모드에서는 우측 중앙에 작은 캡슐형 건강 코치 얼굴만 노출합니다.
      orbButton: {
        position: "fixed",
        top: "50%",
        right: "20px",
        width: "40px",
        height: "28px",
        border: "1px solid rgba(229, 231, 235, 0.85)",
        borderRadius: "999px",
        background: coachFace.softColor,
        boxShadow: "0 8px 22px rgba(15, 23, 42, 0.08)",
        backdropFilter: "blur(12px)",
        cursor: "pointer",
        zIndex: 10001,
        opacity: 0.8,
        padding: 0,
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        animation: orbAnimation,
        transform: "translateY(-50%)",
        transition: "opacity 180ms ease, box-shadow 180ms ease",
      },
      orbIcon: {
        display: "grid",
        placeItems: "center",
        width: "100%",
        height: "100%",
        fontSize: "18px",
        lineHeight: 1,
        filter: "none",
      },
      toast: {
        position: "fixed",
        right: "24px",
        bottom: isMonitoringMode ? "24px" : "24px",
        zIndex: 10000,
        width: "320px",
        maxWidth: "calc(100vw - 48px)",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "14px 16px",
        borderRadius: "16px",
        background: "rgba(255, 255, 255, 0.8)",
        color: "#0F172A",
        border: "1px solid #E5E7EB",
        boxShadow: "0 12px 30px rgba(15, 23, 42, 0.10)",
        backdropFilter: "blur(12px)",
        fontSize: "14px",
        lineHeight: 1.55,
      },
      toastOrb: {
        width: "20px",
        height: "20px",
        marginTop: "1px",
        flex: "0 0 auto",
        display: "grid",
        placeItems: "center",
        fontSize: "16px",
        lineHeight: 1,
      },
      toastContent: {
        minWidth: 0,
      },
      toastMessage: {
        margin: 0,
      },
      toastAction: {
        marginTop: "10px",
        border: "1px solid #E5E7EB",
        borderRadius: "999px",
        padding: "7px 12px",
        background: "#FFFFFF",
        color: "#0F172A",
        fontSize: "12px",
        fontWeight: 600,
        cursor: "pointer",
      },
      toastActionRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        marginTop: "10px",
      },
      toastGhostAction: {
        border: 0,
        borderRadius: "999px",
        padding: "7px 10px",
        background: "transparent",
        color: "#64748B",
        fontSize: "12px",
        fontWeight: 600,
        cursor: "pointer",
      },
      stretchCard: {
        position: "fixed",
        right: "24px",
        bottom: "24px",
        zIndex: 10003,
        width: "340px",
        maxWidth: "calc(100vw - 48px)",
        padding: "18px",
        borderRadius: "20px",
        border: "1px solid #E5E7EB",
        background: "rgba(255, 255, 255, 0.96)",
        boxShadow: "0 18px 45px rgba(15, 23, 42, 0.14)",
        backdropFilter: "blur(14px)",
        color: "#0F172A",
      },
      stretchStep: {
        margin: "0 0 6px",
        fontSize: "12px",
        color: "#64748B",
        fontWeight: 600,
      },
      stretchTitle: {
        margin: 0,
        fontSize: "18px",
        fontWeight: 700,
        letterSpacing: "-0.03em",
      },
      stretchDescription: {
        margin: "10px 0 0",
        fontSize: "14px",
        lineHeight: 1.6,
        color: "#475569",
      },
      stretchDuration: {
        display: "inline-flex",
        marginTop: "12px",
        padding: "6px 10px",
        borderRadius: "999px",
        background: "#F8FAFC",
        border: "1px solid #E5E7EB",
        color: "#64748B",
        fontSize: "12px",
        fontWeight: 600,
      },
      stretchActions: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "10px",
        marginTop: "16px",
      },
      overlay: {
        position: "fixed",
        inset: 0,
        zIndex: 10010,
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "rgba(15, 23, 42, 0.28)",
        backdropFilter: "blur(8px)",
      },
      modal: {
        width: "420px",
        maxWidth: "calc(100vw - 48px)",
        padding: "22px",
        borderRadius: "22px",
        border: "1px solid #E5E7EB",
        background: "#FFFFFF",
        boxShadow: "0 24px 70px rgba(15, 23, 42, 0.18)",
        color: "#0F172A",
      },
      modalTitle: {
        margin: 0,
        fontSize: "20px",
        fontWeight: 700,
        letterSpacing: "-0.03em",
      },
      modalText: {
        margin: "10px 0 0",
        fontSize: "14px",
        lineHeight: 1.65,
        color: "#475569",
      },
      modalList: {
        margin: "14px 0 0",
        paddingLeft: "20px",
        color: "#475569",
        fontSize: "14px",
        lineHeight: 1.75,
      },
      modalActions: {
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "10px",
        marginTop: "18px",
      },
      settingsMenu: {
        position: "absolute",
        top: "64px",
        right: "18px",
        zIndex: 10005,
        width: "240px",
        padding: "8px",
        borderRadius: "16px",
        border: "1px solid #E5E7EB",
        background: "#FFFFFF",
        boxShadow: "0 18px 45px rgba(15, 23, 42, 0.12)",
      },
      settingsItem: {
        width: "100%",
        border: 0,
        borderRadius: "10px",
        padding: "10px 11px",
        background: "transparent",
        textAlign: "left",
        color: "#0F172A",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
      },
      permissionCard: {
        marginBottom: "14px",
        padding: "14px",
        borderRadius: "16px",
        background: "#FFF7ED",
        border: "1px solid #FED7AA",
        color: "#9A3412",
      },
      permissionTitle: {
        margin: 0,
        fontSize: "14px",
        fontWeight: 700,
      },
      permissionText: {
        margin: "6px 0 12px",
        fontSize: "13px",
        lineHeight: 1.55,
      },
      statsPanel: {
        margin: "12px 0 0",
        padding: "14px",
        borderRadius: "16px",
        background: "#F8FAFC",
        border: "1px solid #E5E7EB",
        color: "#475569",
        fontSize: "12px",
        lineHeight: 1.55,
      },
      statsTitle: {
        margin: "0 0 8px",
        fontSize: "12px",
        fontWeight: 700,
        color: "#0F172A",
      },
      scoreText: {
        margin: "0 0 6px",
        fontSize: "24px",
        fontWeight: 700,
        color: "#0F172A",
        letterSpacing: "-0.04em",
      },
      statsGrid: {
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: "6px 12px",
        marginTop: "10px",
      },
      statValue: {
        fontWeight: 600,
        color: "#0F172A",
        fontVariantNumeric: "tabular-nums",
      },
    }),
    [
      isCalibrated,
      isMonitoringMode,
      coachFace.softColor,
      orbAnimation,
      status.dot,
      status.text,
    ],
  );

  const stopCameraResources = useCallback(() => {
    cameraRef.current?.stop();
    faceMeshRef.current?.close();
    cameraRef.current = null;
    faceMeshRef.current = null;
    setCameraReady(false);
  }, []);

  const playBeep = useCallback(() => {
    if (mutedRef.current) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const audioContext =
      audioContextRef.current || new AudioContext({ latencyHint: "interactive" });
    audioContextRef.current = audioContext;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const startAt = audioContext.currentTime;
    const stopAt = startAt + 0.15;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(440, startAt);
    gain.gain.setValueAtTime(0.1, startAt);
    gain.gain.exponentialRampToValueAtTime(0.001, stopAt);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(startAt);
    oscillator.stop(stopAt);
  }, []);

  // 같은 경고가 매 프레임 반복되지 않도록 종류별로 10초 쿨다운을 둡니다.
  const canShowAlert = useCallback((alertType) => {
    const lastAlertTime = lastAlertTimeRef.current[alertType] || 0;
    return Date.now() - lastAlertTime >= ALERT_COOLDOWN_MS;
  }, []);

  const updateLastAlertTime = useCallback((alertType) => {
    lastAlertTimeRef.current[alertType] = Date.now();
  }, []);

  // 토스트가 실제로 표시될 때만 비프음을 재생합니다.
  const showToast = useCallback(
    (message, type, options = {}) => {
      if (!options.skipCooldown && !canShowAlert(type)) return;

      if (!options.skipCooldown) {
        updateLastAlertTime(type);
      }

      setToast({
        message,
        type,
        actionLabel: options.actionLabel,
        actionType: options.actionType,
      });
      playBeep();

      window.clearTimeout(toastTimerRef.current);

      if (!options.persist) {
        toastTimerRef.current = window.setTimeout(() => {
          setToast(null);
        }, TOAST_DURATION_MS);
      }
    },
    [canShowAlert, playBeep, updateLastAlertTime],
  );

  // 기준값과 현재 얼굴 랜드마크를 비교해 자세 상태를 결정합니다.
  const evaluatePosture = useCallback(
    (landmarks) => {
      const measurements = getMeasurements(landmarks);

      if (!measurements) {
        latestLandmarksRef.current = null;
        setDebugInfo(null);
        if (monitoringRef.current) {
          setStatusKey("noFace");
          showToast(ALERT_MESSAGES.noFace, "noFace");
        }
        return;
      }

      latestLandmarksRef.current = landmarks;

      if (!monitoringRef.current || !calibrationRef.current) {
        setDebugInfo(
          buildDebugInfo(
            measurements,
            calibrationRef.current,
            calibrationRef.current ? "calibrated" : "ready",
          ),
        );
        return;
      }

      const result = analyzePosture(measurements, calibrationRef.current);
      setStatusKey(result.statusKey);
      setDebugInfo(result.debug);

      setHealthStats((currentStats) => updateStatistics(currentStats, result.statusKey));

      if (result.statusKey !== "normal") {
        showToast(ALERT_MESSAGES[result.statusKey], result.statusKey);
      }
    },
    [showToast],
  );

  useEffect(() => {
    const styleId = "posture-guard-breath-style";
    if (document.getElementById(styleId)) return undefined;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @keyframes postureGuardBreath {
        0%, 100% { transform: translateY(-50%) scale(1); }
        50% { transform: translateY(-50%) scale(1.06); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
        // 서비스 워커 등록 실패는 핵심 자세 감지 기능을 막지 않습니다.
      });
    }

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPromptEvent(event);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function prepareScripts() {
      try {
        await Promise.all([loadScript(FACE_MESH_URL), loadScript(CAMERA_UTILS_URL)]);
        if (!cancelled) {
          setScriptsLoaded(true);
          setStatusKey((current) => (current === "idle" ? "ready" : current));
        }
      } catch (error) {
        if (!cancelled) {
          setStatusKey("error");
          setErrorMessage("MediaPipe 스크립트 로드에 실패했습니다.");
        }
      }
    }

    prepareScripts();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!scriptsLoaded || !cameraActive || !videoRef.current) return undefined;

    let cancelled = false;
    setCameraReady(false);

    async function startFaceMesh() {
      try {
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

        faceMesh.onResults((results) => {
          if (cancelled) return;
          const landmarks = results.multiFaceLandmarks?.[0] || null;
          evaluatePosture(landmarks);
        });

        const camera = new window.Camera(videoRef.current, {
          width: 320,
          height: 240,
          onFrame: async () => {
            if (!cancelled && videoRef.current) {
              await faceMesh.send({ image: videoRef.current });
            }
          },
        });

        faceMeshRef.current = faceMesh;
        cameraRef.current = camera;

        await camera.start();

        if (!cancelled) {
          setCameraReady(true);
          setErrorMessage("");
          setCameraErrorInfo(null);
          setStatusKey((current) => (current === "idle" ? "ready" : current));
        }
      } catch (error) {
        if (!cancelled) {
          const cameraError = getCameraErrorInfo(error);
          setCameraReady(false);
          setCameraActive(false);
          setStatusKey("error");
          setCameraErrorInfo(cameraError);
          setErrorMessage(cameraError.description);
        }
      }
    }

    startFaceMesh();

    return () => {
      cancelled = true;
      stopCameraResources();
    };
  }, [cameraActive, evaluatePosture, scriptsLoaded, stopCameraResources]);

  useEffect(() => {
    monitoringRef.current = isMonitoring;
  }, [isMonitoring]);

  useEffect(() => {
    statusKeyRef.current = statusKey;
  }, [statusKey]);

  useEffect(() => {
    mutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    healthStatsRef.current = healthStats;
    saveHealthStats(healthStats);
  }, [healthStats]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      if (getTodayKey() !== healthStatsRef.current.date) {
        const resetStats = resetDailyStats();
        eyeRestShownRef.current = false;
        stretchReminderShownRef.current = false;
        setHealthStats(resetStats);
        setEyeRestRemainingSeconds(EYE_REST_INTERVAL_SECONDS);
        setStretchRemainingSeconds(STRETCH_INTERVAL_SECONDS);
        return;
      }

      if (monitoringRef.current && statusKeyRef.current === "normal") {
        setHealthStats((currentStats) => recoverCoachMood(updateGoodPostureTime(currentStats, 1), 1));
      } else if (monitoringRef.current && TRACKED_STATUSES.includes(statusKeyRef.current)) {
        setHealthStats((currentStats) => updateBadPostureTime(currentStats, 1));
      }
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      const remainingSeconds = Math.max(
        0,
        Math.ceil((healthStatsRef.current.eyeRestNextAt - Date.now()) / 1000),
      );

      setEyeRestRemainingSeconds(remainingSeconds);

      if (remainingSeconds <= 0 && !eyeRestShownRef.current) {
        eyeRestShownRef.current = true;
        showToast(ALERT_MESSAGES.eyeRest, "eyeRest", {
          skipCooldown: true,
          persist: true,
          actionLabel: "휴식 완료",
          actionType: "eyeRestDone",
        });
      }
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [showToast]);

  useEffect(() => {
    return () => {
      window.clearTimeout(toastTimerRef.current);
      audioContextRef.current?.close();
      stopCameraResources();
    };
  }, [stopCameraResources]);

  const handleStartCamera = () => {
    setErrorMessage("");
    setCameraErrorInfo(null);
    setDebugInfo(null);
    setStatusKey(scriptsLoaded ? "ready" : "idle");
    setCameraActive(true);
    setViewMode("setup");
  };

  const handleOnboardingStart = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    setIsOnboardingOpen(false);
  };

  const resetTodayStats = () => {
    if (!window.confirm("오늘 통계를 초기화할까요?")) return;
    const resetStats = resetDailyStats();
    setHealthStats(resetStats);
    setEyeRestRemainingSeconds(EYE_REST_INTERVAL_SECONDS);
    setStretchRemainingSeconds(STRETCH_INTERVAL_SECONDS);
    setIsSettingsOpen(false);
  };

  const resetCalibration = () => {
    if (!window.confirm("기준 자세를 다시 설정할까요?")) return;
    calibrationRef.current = null;
    setIsCalibrated(false);
    setIsMonitoring(false);
    monitoringRef.current = false;
    setViewMode("setup");
    setStatusKey(cameraReady ? "ready" : "idle");
    setIsSettingsOpen(false);
  };

  const resetAllData = () => {
    if (!window.confirm("모든 통계와 설정 데이터를 초기화할까요?")) return;
    localStorage.removeItem(HEALTH_STATS_STORAGE_KEY);
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    const resetStats = resetDailyStats();
    calibrationRef.current = null;
    setHealthStats(resetStats);
    setIsCalibrated(false);
    setIsMonitoring(false);
    monitoringRef.current = false;
    setIsMuted(false);
    setViewMode("setup");
    setStatusKey(cameraReady ? "ready" : "idle");
    setIsSettingsOpen(false);
    setIsOnboardingOpen(true);
  };

  const handleInstallApp = async () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    await installPromptEvent.userChoice;
    setInstallPromptEvent(null);
    setIsSettingsOpen(false);
  };

  const handleCalibration = () => {
    const measurements = getMeasurements(latestLandmarksRef.current);

    if (!measurements) {
      setStatusKey("noFace");
      showToast(ALERT_MESSAGES.noFace, "noFace");
      return;
    }

    if (!isFaceCentered(measurements)) {
      const result = analyzePosture(measurements, measurements);
      setStatusKey("offCenter");
      setDebugInfo(result.debug);
      showToast(ALERT_MESSAGES.offCenter, "offCenter");
      return;
    }

    calibrationRef.current = {
      eyeDistance: measurements.eyeDistance,
      noseY: measurements.noseY,
      chinY: measurements.chinY,
      eyeYDiff: measurements.eyeYDiff,
      noseOffsetX: measurements.noseOffsetX,
      faceCenterX: measurements.faceCenterX,
      faceCenterY: measurements.faceCenterY,
    };

    setIsCalibrated(true);
    setDebugInfo(buildDebugInfo(measurements, calibrationRef.current, "calibrated"));
    setStatusKey("calibrated");
  };

  const handleStartMonitoring = () => {
    if (!isCalibrated || !cameraReady) return;

    setIsMonitoring(true);
    monitoringRef.current = true;
    setStatusKey("normal");
    setViewMode("monitoring");
  };

  const handleReturnToMonitoring = () => {
    if (!isMonitoring) return;
    setViewMode("monitoring");
  };

  const handleEyeRestComplete = () => {
    eyeRestShownRef.current = false;
    setToast(null);
    window.clearTimeout(toastTimerRef.current);
    setHealthStats((currentStats) => startEyeRestTimer(currentStats));
  };

  const handleEyeRestTest = () => {
    eyeRestShownRef.current = false;
    setToast(null);
    window.clearTimeout(toastTimerRef.current);
    setHealthStats((currentStats) => startEyeRestTimer(currentStats, EYE_REST_TEST_SECONDS));
  };

  const showStretchReminder = useCallback(() => {
    stretchReminderShownRef.current = true;
    showToast(ALERT_MESSAGES.stretchReminder, "stretchReminder", {
      skipCooldown: true,
      persist: true,
      actionType: "stretchReminder",
    });
  }, [showToast]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      const currentStats = healthStatsRef.current;

      if (currentStats.stretchDisabledDate === getTodayKey()) {
        setStretchRemainingSeconds(0);
        return;
      }

      const remainingSeconds = Math.max(
        0,
        Math.ceil(((currentStats.nextStretchAt || Date.now()) - Date.now()) / 1000),
      );

      setStretchRemainingSeconds(remainingSeconds);

      if (remainingSeconds <= 0 && !stretchReminderShownRef.current && !isStretchGuideOpen) {
        showStretchReminder();
      }
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [isStretchGuideOpen, showStretchReminder]);

  const postponeStretchReminder = () => {
    stretchReminderShownRef.current = false;
    setToast(null);
    window.clearTimeout(toastTimerRef.current);
    setHealthStats((currentStats) => startStretchTimer(currentStats, STRETCH_POSTPONE_SECONDS));
  };

  const disableStretchForToday = () => {
    stretchReminderShownRef.current = false;
    setToast(null);
    window.clearTimeout(toastTimerRef.current);
    setHealthStats((currentStats) => ({
      ...currentStats,
      stretchDisabledDate: getTodayKey(),
    }));
  };

  const handleStretchTest = () => {
    stretchReminderShownRef.current = false;
    setToast(null);
    window.clearTimeout(toastTimerRef.current);
    setHealthStats((currentStats) =>
      startStretchTimer(
        {
          ...currentStats,
          stretchDisabledDate: "",
        },
        STRETCH_TEST_SECONDS,
      ),
    );
  };

  const openStretchGuide = () => {
    setToast(null);
    window.clearTimeout(toastTimerRef.current);
    setStretchStepIndex(0);
    setIsStretchGuideOpen(true);
  };

  const completeStretch = () => {
    stretchReminderShownRef.current = false;
    setIsStretchGuideOpen(false);
    setStretchStepIndex(0);
    setHealthStats((currentStats) =>
      startStretchTimer({
        ...currentStats,
        stretchCompletedCount: (currentStats.stretchCompletedCount || 0) + 1,
        stretchDisabledDate: "",
      }),
    );
    showToast(ALERT_MESSAGES.stretchComplete, "normal", {
      skipCooldown: true,
    });
  };

  const handleStopMonitoring = () => {
    monitoringRef.current = false;
    calibrationRef.current = null;
    latestLandmarksRef.current = null;
    setIsMonitoring(false);
    setIsCalibrated(false);
    setCameraActive(false);
    setDebugInfo(null);
    setViewMode("setup");
    setStatusKey("idle");
    setToast(null);
    window.clearTimeout(toastTimerRef.current);
    stopCameraResources();
  };

  const calibrationDisabled = !cameraReady;
  const monitoringDisabled = !isCalibrated || !cameraReady;

  return (
    <>
      {toast ? (
        <div style={styles.toast} role="alert" aria-live="assertive">
          <span style={styles.toastOrb} aria-hidden="true">
            {toast.type === "eyeRest" ? "🙂" : coachFace.icon}
          </span>
          <div style={styles.toastContent}>
            <p style={styles.toastMessage}>{toast.message}</p>
            {toast.actionType === "eyeRestDone" ? (
              <button type="button" onClick={handleEyeRestComplete} style={styles.toastAction}>
                {toast.actionLabel}
              </button>
            ) : null}
            {toast.actionType === "stretchReminder" ? (
              <div style={styles.toastActionRow}>
                <button type="button" onClick={openStretchGuide} style={styles.toastAction}>
                  스트레칭 하기
                </button>
                <button type="button" onClick={postponeStretchReminder} style={styles.toastGhostAction}>
                  나중에 하기
                </button>
                <button type="button" onClick={disableStretchForToday} style={styles.toastGhostAction}>
                  오늘은 끄기
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {isStretchGuideOpen ? (
        <div style={styles.stretchCard} role="dialog" aria-label="앉아서 하는 스트레칭 안내">
          <p style={styles.stretchStep}>
            {stretchStepIndex + 1} / {STRETCH_EXERCISES.length}
          </p>
          <h2 style={styles.stretchTitle}>{STRETCH_EXERCISES[stretchStepIndex].title}</h2>
          <p style={styles.stretchDescription}>
            {STRETCH_EXERCISES[stretchStepIndex].description}
          </p>
          <span style={styles.stretchDuration}>
            권장 시간 {STRETCH_EXERCISES[stretchStepIndex].duration}
          </span>
          <div style={styles.stretchActions}>
            <button
              type="button"
              onClick={() =>
                setStretchStepIndex((currentIndex) =>
                  Math.min(currentIndex + 1, STRETCH_EXERCISES.length - 1),
                )
              }
              disabled={stretchStepIndex === STRETCH_EXERCISES.length - 1}
              style={{
                ...styles.secondaryButton,
                ...(stretchStepIndex === STRETCH_EXERCISES.length - 1
                  ? styles.disabledButton
                  : null),
              }}
            >
              다음 동작
            </button>
            <button type="button" onClick={completeStretch} style={styles.button}>
              완료
            </button>
          </div>
        </div>
      ) : null}

      {isOnboardingOpen ? (
        <div style={styles.overlay} role="dialog" aria-label="처음 사용 안내">
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>PostureGuard 사용 방법</h2>
            <ol style={styles.modalList}>
              <li>카메라를 바라봅니다.</li>
              <li>기준 자세 저장을 누릅니다.</li>
              <li>모니터링 시작을 누릅니다.</li>
              <li>건강 코치의 조용한 안내를 받아보세요.</li>
            </ol>
            <div style={styles.modalActions}>
              <button type="button" onClick={handleOnboardingStart} style={styles.button}>
                시작하기
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isAboutOpen ? (
        <div style={styles.overlay} role="dialog" aria-label="앱 정보">
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>PostureGuard</h2>
            <p style={styles.modalText}>AI 기반 자세 및 눈 피로 관리 웹앱</p>
            <p style={styles.modalText}>
              기술: React, MediaPipe Face Mesh, Web Camera, LocalStorage
            </p>
            <p style={styles.modalText}>
              카메라 영상은 외부 서버로 전송되지 않으며 브라우저 내부에서만 처리됩니다.
            </p>
            <div style={styles.modalActions}>
              <button type="button" onClick={() => setIsAboutOpen(false)} style={styles.button}>
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isMonitoringMode ? (
        <button
          type="button"
          title={orbTooltip}
          aria-label={`현재 건강 코치 상태: ${status.dotTitle}`}
          onClick={() => setViewMode("preview")}
          style={styles.orbButton}
        >
          <span style={styles.orbIcon} aria-hidden="true">
            {coachFace.icon}
          </span>
        </button>
      ) : null}

      <section
        style={isMonitoringMode ? styles.offscreenRoot : styles.appRoot}
        aria-label="자세 코치"
      >
        <div style={styles.panel}>
          <div style={styles.header}>
            <div style={styles.brandBlock}>
              <div style={styles.logoMark} aria-hidden="true">
                {coachFace.icon}
              </div>
              <div>
                <h1 style={styles.title}>PostureGuard</h1>
                <p style={styles.subtitle}>Quiet AI wellness coach for focused work</p>
              </div>
            </div>
            <div style={styles.headerActions}>
              <div style={styles.statusLine} role="status" aria-live="polite">
                <span style={styles.statusDot} aria-hidden="true" />
                <span>{wellnessStatus}</span>
              </div>
              {isPreviewMode ? (
                <button type="button" onClick={handleReturnToMonitoring} style={styles.linkButton}>
                  모니터링으로 돌아가기
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setIsSettingsOpen((current) => !current)}
                style={styles.settingsButton}
                aria-label="설정"
              >
                ⚙
              </button>
              {isSettingsOpen ? (
                <div style={styles.settingsMenu}>
                  <button type="button" onClick={resetTodayStats} style={styles.settingsItem}>
                    오늘 통계 초기화
                  </button>
                  <button type="button" onClick={resetCalibration} style={styles.settingsItem}>
                    기준 자세 다시 설정
                  </button>
                  <button type="button" onClick={resetAllData} style={styles.settingsItem}>
                    모든 데이터 초기화
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAboutOpen(true);
                      setIsSettingsOpen(false);
                    }}
                    style={styles.settingsItem}
                  >
                    About
                  </button>
                  {installPromptEvent ? (
                    <button type="button" onClick={handleInstallApp} style={styles.settingsItem}>
                      데스크탑에 설치
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div style={styles.metricGrid}>
            <div style={styles.metricCard}>
              <p style={styles.metricLabel}>현재 자세 상태</p>
              <p style={styles.metricValue}>{status.label}</p>
            </div>
            <div style={styles.metricCard}>
              <p style={styles.metricLabel}>오늘의 자세 점수</p>
              <p style={styles.metricValue}>{healthStats.score}점</p>
            </div>
            <div style={styles.metricCard}>
              <p style={styles.metricLabel}>좋은 자세 유지</p>
              <p style={styles.metricValue}>{formatDuration(healthStats.goodPostureSeconds)}</p>
            </div>
            <div style={styles.metricCard}>
              <p style={styles.metricLabel}>다음 눈 휴식까지</p>
              <p style={styles.metricValue}>
                {eyeRestRemainingSeconds === 0
                  ? "지금"
                  : formatDuration(eyeRestRemainingSeconds)}
              </p>
            </div>
          </div>

          <div style={styles.dashboardGrid}>
            <div style={styles.card}>
              {cameraErrorInfo ? (
                <div style={styles.permissionCard}>
                  <p style={styles.permissionTitle}>{cameraErrorInfo.title}</p>
                  <p style={styles.permissionText}>{cameraErrorInfo.description}</p>
                  <button type="button" onClick={handleStartCamera} style={styles.secondaryButton}>
                    다시 시도
                  </button>
                </div>
              ) : null}
              <div style={styles.cardHeader}>
                <div>
                  <p style={styles.cardTitle}>Live Calibration</p>
                  <p style={styles.cardDescription}>
                    {isPreviewMode
                      ? status.description
                      : "카메라를 보며 바른 자세를 맞춘 뒤 기준 자세를 저장하세요."}
                  </p>
                </div>
                <div style={styles.miniOrb} aria-hidden="true">
                  {coachFace.icon}
                </div>
              </div>

              <video ref={videoRef} style={styles.video} autoPlay playsInline muted />

              <div style={styles.controls}>
                {!cameraActive ? (
                  <button type="button" onClick={handleStartCamera} style={styles.button}>
                    카메라 시작
                  </button>
                ) : null}

                <div style={styles.buttonRow}>
                  <button
                    type="button"
                    onClick={handleCalibration}
                    disabled={calibrationDisabled}
                    style={{
                      ...styles.button,
                      ...(calibrationDisabled ? styles.disabledButton : null),
                    }}
                  >
                    {isPreviewMode ? "기준 자세 다시 저장" : "기준 자세 저장"}
                  </button>

                  {isPreviewMode || isMonitoring ? (
                    <button type="button" onClick={handleStopMonitoring} style={styles.dangerButton}>
                      모니터링 중지
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartMonitoring}
                      disabled={monitoringDisabled}
                      style={{
                        ...styles.secondaryButton,
                        ...(monitoringDisabled ? styles.disabledButton : null),
                      }}
                    >
                      모니터링 시작
                    </button>
                  )}
                </div>

                <span style={styles.sectionLabel}>설정</span>
                <label style={styles.muteLabel}>
                  <input
                    type="checkbox"
                    checked={isMuted}
                    style={styles.checkbox}
                    onChange={(event) => setIsMuted(event.target.checked)}
                  />
                  경고음 끄기
                </label>

                {isPreviewMode ? (
                  <button type="button" onClick={handleEyeRestTest} style={styles.secondaryButton}>
                    20초 테스트
                  </button>
                ) : null}
                {isPreviewMode ? (
                  <button type="button" onClick={handleStretchTest} style={styles.secondaryButton}>
                    스트레칭 30초 테스트
                  </button>
                ) : null}
                <button type="button" onClick={openStretchGuide} style={styles.secondaryButton}>
                  스트레칭 바로 보기
                </button>
              </div>

              {!isPreviewMode ? (
                <p style={styles.helperText}>
                  {isCalibrated
                    ? "기준 자세가 저장되었습니다. 모니터링을 시작할 수 있습니다."
                    : "기준 자세 저장 전에는 모니터링 시작 버튼이 비활성화됩니다."}
                </p>
              ) : null}

              <p style={styles.privacyText}>
                카메라 영상은 브라우저 내부에서만 처리되며 외부 서버로 전송되지 않습니다.
              </p>

              {errorMessage ? <p style={styles.errorText}>{errorMessage}</p> : null}
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <p style={styles.cardTitle}>Wellness Overview</p>
                  <p style={styles.cardDescription}>오늘의 집중과 회복 리듬을 조용히 정리합니다.</p>
                </div>
              </div>

              <div style={styles.statsPanel} aria-label="오늘의 건강 코치 통계">
                <p style={styles.statsTitle}>Today</p>
                <p style={styles.scoreText}>{healthStats.score}점</p>
                <div style={styles.statsGrid}>
                  <span>건강 코치 상태</span>
                  <span style={styles.statValue}>
                    {coachFace.icon} {coachFace.label}
                  </span>
                  <span>자세 교정 횟수</span>
                  <span style={styles.statValue}>{postureCorrectionCount}회</span>
                  <span>눈 휴식 횟수</span>
                  <span style={styles.statValue}>0회</span>
                  <span>스트레칭 완료</span>
                  <span style={styles.statValue}>
                    {healthStats.stretchCompletedCount || 0}회
                  </span>
                  <span>다음 스트레칭까지</span>
                  <span style={styles.statValue}>{nextStretchTimeText}</span>
                  {TRACKED_STATUSES.map((trackedStatus) => (
                    <React.Fragment key={trackedStatus}>
                      <span>{STAT_LABELS[trackedStatus]}</span>
                      <span style={styles.statValue}>
                        {healthStats.counts?.[trackedStatus] || 0}회
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {isPreviewMode && debugInfo ? (
                <div style={styles.debugPanel} aria-label="자세 분석 디버그 정보">
                  <p style={styles.debugTitle}>디버그 정보</p>
                  <div style={styles.debugGrid}>
                    <span>눈 거리 변화율</span>
                    <span style={styles.debugValue}>
                      {formatSignedNumber(debugInfo.eyeDistanceRatio * 100, 1)}%
                    </span>
                    <span>코 Y 변화량</span>
                    <span style={styles.debugValue}>
                      {formatSignedNumber(debugInfo.noseYDelta)}
                    </span>
                    <span>눈 Y 차이</span>
                    <span style={styles.debugValue}>{formatNumber(debugInfo.eyeYDiff)}</span>
                    <span>noseOffsetX</span>
                    <span style={styles.debugValue}>{formatSignedNumber(debugInfo.noseOffsetX)}</span>
                    <span>얼굴 중심 X/Y</span>
                    <span style={styles.debugValue}>
                      {formatNumber(debugInfo.faceCenterX)} / {formatNumber(debugInfo.faceCenterY)}
                    </span>
                    <span>현재 판별 상태</span>
                    <span style={styles.debugValue}>
                      {(STATUS_META[debugInfo.statusKey] || STATUS_META.idle).label}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div style={styles.graphGrid} aria-label="자세 트렌드 미리보기">
            {[
              ["Daily Trends", ["36%", "54%", "44%", "68%", "58%", "76%"]],
              ["Weekly Progress", ["42%", "48%", "56%", "62%", "70%", "78%"]],
              ["Posture Score History", ["70%", "66%", "74%", "80%", "78%", "86%"]],
            ].map(([title, bars]) => (
              <div key={title} style={styles.graphCard}>
                <p style={styles.graphTitle}>{title}</p>
                <div style={styles.graphBars} aria-hidden="true">
                  {bars.map((height, index) => (
                    <span
                      key={`${title}-${index}`}
                      style={{ ...styles.graphBar, height }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}