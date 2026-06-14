import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_TAGLINE,
  STATUS_MESSAGES,
  TRAY_EMOJI,
  WELLNESS_STATUS,
} from "./state/constants.js";
import { statusToTrayMood } from "./state/wellnessState.js";
import { loadSettings, saveSettings } from "./services/storage.js";
import { useDetectionLoop } from "./hooks/useDetectionLoop.js";
import { useAlertPolicy, useBeep, useWellnessRoutine } from "./hooks/useWellness.js";
import { PosturePreviewPanel } from "./components/PosturePreviewPanel.jsx";
import {
  StatusAlertModal,
  WellnessGuideModal,
  WellnessPromptModal,
} from "./components/WellnessModals.jsx";
import { CenterModal } from "./components/CenterModal.jsx";
import { styles, theme } from "./styles/theme.js";

/** @typedef {'hidden' | 'view' | 'recalibrate'} PreviewMode */

const desktopApi = () => window.easeUpDesktop || window.electronAPI;

function statusColor(status) {
  switch (status) {
    case WELLNESS_STATUS.TOO_CLOSE:
      return theme.colors.warn;
    case WELLNESS_STATUS.SHOULDER_TENSION:
      return theme.colors.danger;
    default:
      return theme.colors.good;
  }
}

function VideoElement({ setVideoElement, visible }) {
  return (
    <video
      ref={setVideoElement}
      style={visible ? styles.video : styles.videoHidden}
      autoPlay
      playsInline
      muted
    />
  );
}

export default function App() {
  const [settings, setSettings] = useState(loadSettings);
  const [baseline, setBaseline] = useState(null);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  /** @type {[PreviewMode, Function]} */
  const [previewMode, setPreviewMode] = useState("hidden");
  const [statusAlert, setStatusAlert] = useState(null);
  const [activeGuide, setActiveGuide] = useState(null);
  const [calibrationHint, setCalibrationHint] = useState("");
  const [recalibrateSuccess, setRecalibrateSuccess] = useState(false);

  const lastTrayMoodRef = useRef(null);
  const latestFaceRef = useRef(null);
  const latestShoulderRef = useRef(null);
  const recalibrateTimerRef = useRef(null);
  const playBeep = useBeep();

  const { evaluate: evaluateAlert } = useAlertPolicy({
    muted: settings.muted,
    onAlert: ({ status, message, muted }) => {
      setStatusAlert({ status, message });
      playBeep(muted);
    },
  });

  const handleStatusChange = useCallback(
    (status) => {
      evaluateAlert(status);
    },
    [evaluateAlert],
  );

  const handleMeasurements = useCallback(({ face, shoulders }) => {
    if (face) latestFaceRef.current = face;
    if (shoulders) latestShoulderRef.current = shoulders;
  }, []);

  const {
    setVideoElement,
    scriptsReady,
    cameraError,
    currentStatus,
    detectionSignals,
    restartCamera,
  } = useDetectionLoop({
    isMonitoring,
    powerSaveMode: settings.powerSaveMode,
    baseline,
    keepDetectingWithoutBaseline: previewMode === "recalibrate",
    onStatusChange: handleStatusChange,
    onMeasurements: handleMeasurements,
  });

  const wellness = useWellnessRoutine({
    isMonitoring,
    onPrompt: (kind) => setActiveGuide({ phase: "prompt", kind }),
  });

  const openWellnessPreview = useCallback((kind) => {
    setActiveGuide({ phase: "prompt", kind, isPreview: true });
  }, []);

  const closeWellnessGuide = useCallback(() => {
    setActiveGuide(null);
  }, []);

  const handleWellnessPostpone = useCallback(() => {
    if (!activeGuide?.isPreview) wellness.postpone();
    closeWellnessGuide();
  }, [activeGuide, wellness, closeWellnessGuide]);

  const handleWellnessComplete = useCallback(() => {
    if (!activeGuide?.isPreview) wellness.complete();
    closeWellnessGuide();
  }, [activeGuide, wellness, closeWellnessGuide]);

  const handleWellnessDisableToday = useCallback(
    (kind) => {
      if (!activeGuide?.isPreview) wellness.disableToday(kind);
      closeWellnessGuide();
    },
    [activeGuide, wellness, closeWellnessGuide],
  );

  const showCameraPreview =
    !isMonitoring || previewMode === "view" || previewMode === "recalibrate";

  useEffect(() => {
    const mood = isMonitoring ? statusToTrayMood(currentStatus) : "idle";
    if (lastTrayMoodRef.current === mood) return;
    lastTrayMoodRef.current = mood;
    const api = desktopApi();
    const status = isMonitoring ? currentStatus : "IDLE";
    api?.updateTrayMood?.(
      mood,
      `${TRAY_EMOJI[status] || TRAY_EMOJI.IDLE} ${
        isMonitoring ? STATUS_MESSAGES[currentStatus] : "대기 중"
      }`,
    );
  }, [currentStatus, isMonitoring]);

  useEffect(() => {
    desktopApi()?.setMonitoringActive?.(isMonitoring);
  }, [isMonitoring]);

  useEffect(() => {
    desktopApi()?.syncMuteState?.(settings.muted);
  }, [settings.muted]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    const api = desktopApi();
    if (!api?.onTrayAction) return undefined;
    return api.onTrayAction((action) => {
      if (action === "mute-on") setSettings((s) => ({ ...s, muted: true }));
      if (action === "mute-off") setSettings((s) => ({ ...s, muted: false }));
      if (action === "stop-monitoring") {
        setIsMonitoring(false);
        setPreviewMode("hidden");
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      window.clearTimeout(recalibrateTimerRef.current);
    };
  }, []);

  const trySaveBaseline = useCallback(() => {
    const face = latestFaceRef.current;
    const shoulders = latestShoulderRef.current;

    if (!face || !shoulders) {
      setCalibrationHint("얼굴과 어깨가 모두 보이도록 카메라 앞에 서 주세요.");
      return false;
    }

    setBaseline({ face, shoulders });
    setIsCalibrated(true);
    return true;
  }, []);

  const captureBaseline = useCallback(async () => {
    setCalibrationHint("기준 자세를 저장하는 중...");
    await restartCamera();

    window.setTimeout(() => {
      if (trySaveBaseline()) {
        setCalibrationHint("기준 자세가 저장되었습니다.");
      }
    }, 1200);
  }, [restartCamera, trySaveBaseline]);

  const startMonitoring = useCallback(() => {
    if (!isCalibrated) return;
    setIsMonitoring(true);
    setPreviewMode("hidden");
    lastTrayMoodRef.current = null;
  }, [isCalibrated]);

  const openPostureView = useCallback(() => {
    setPreviewMode("view");
    setCalibrationHint("");
  }, []);

  const closePostureView = useCallback(() => {
    setPreviewMode("hidden");
  }, []);

  const startRecalibration = useCallback(async () => {
    window.clearTimeout(recalibrateTimerRef.current);
    setPreviewMode("recalibrate");
    setBaseline(null);
    setCalibrationHint("기준 자세를 다시 측정하는 중...");
    setRecalibrateSuccess(false);
    await restartCamera();

    recalibrateTimerRef.current = window.setTimeout(() => {
      if (trySaveBaseline()) {
        setCalibrationHint("");
        setRecalibrateSuccess(true);
        setPreviewMode("hidden");
      } else {
        setCalibrationHint("얼굴과 어깨가 모두 보이도록 카메라 앞에 서 주세요.");
      }
    }, 1500);
  }, [restartCamera, trySaveBaseline]);

  const statusEmoji = useMemo(
    () => TRAY_EMOJI[currentStatus] || TRAY_EMOJI.GOOD,
    [currentStatus],
  );

  const cameraPreview = showCameraPreview ? (
    <div style={styles.videoWrap}>
      <VideoElement setVideoElement={setVideoElement} visible />
    </div>
  ) : (
    <VideoElement setVideoElement={setVideoElement} visible={false} />
  );

  return (
    <div style={styles.app}>
      <div style={styles.shell}>
        <header style={styles.header}>
          <h1 style={styles.title}>{APP_NAME}</h1>
          <p style={styles.subtitle}>
            {APP_TAGLINE}
            <br />
            {APP_DESCRIPTION}
          </p>
        </header>

        <div style={styles.statusCard}>
          <p style={styles.statusLabel}>현재 상태</p>
          <p style={{ ...styles.statusValue, color: statusColor(currentStatus) }}>
            {statusEmoji} {STATUS_MESSAGES[currentStatus]}
          </p>
        </div>

        {previewMode !== "view" ? cameraPreview : null}

        {cameraError ? (
          <p style={{ color: theme.colors.danger, fontSize: "13px" }}>{cameraError}</p>
        ) : null}
        {calibrationHint ? (
          <p style={{ color: theme.colors.muted, fontSize: "13px" }}>{calibrationHint}</p>
        ) : null}

        <div style={styles.buttonRow}>
          {!isMonitoring ? (
            <>
              <button
                type="button"
                style={{
                  ...styles.buttonSecondary,
                  ...(scriptsReady ? null : styles.buttonDisabled),
                }}
                disabled={!scriptsReady}
                onClick={captureBaseline}
              >
                기준 자세 저장
              </button>
              <button
                type="button"
                style={{
                  ...styles.button,
                  ...(!isCalibrated ? styles.buttonDisabled : null),
                }}
                disabled={!isCalibrated}
                onClick={startMonitoring}
              >
                모니터링 시작
              </button>
            </>
          ) : (
            <>
              <button type="button" style={styles.buttonSecondary} onClick={openPostureView}>
                내 자세 보기
              </button>
              <button type="button" style={styles.buttonSecondary} onClick={startRecalibration}>
                기준 자세 다시 저장
              </button>
              <button
                type="button"
                style={styles.buttonSecondary}
                onClick={() => {
                  setIsMonitoring(false);
                  setPreviewMode("hidden");
                }}
              >
                모니터링 중지
              </button>
            </>
          )}
        </div>

        <label style={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={settings.powerSaveMode}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                powerSaveMode: event.target.checked,
              }))
            }
          />
          절전 모드 (감지 주기 2.5초)
        </label>

        <label style={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={settings.muted}
            onChange={(event) =>
              setSettings((current) => ({ ...current, muted: event.target.checked }))
            }
          />
          경고음 끄기
        </label>

        <div style={styles.testSection}>
          <p style={styles.testSectionLabel}>웰니스 미리보기</p>
          <div style={styles.testButtonRow}>
            <button
              type="button"
              style={styles.buttonSecondary}
              onClick={() => openWellnessPreview("eye")}
            >
              눈 운동 확인
            </button>
            <button
              type="button"
              style={styles.buttonSecondary}
              onClick={() => openWellnessPreview("stretch")}
            >
              스트레칭 확인
            </button>
          </div>
          <p style={styles.testSectionHint}>
            30분 알림을 기다리지 않고 바로 확인할 수 있습니다.
          </p>
        </div>

        <p style={styles.privacy}>
          카메라 영상은 외부 서버로 전송되지 않으며, 사용자 PC 내부에서만 분석됩니다.
        </p>
      </div>

      {previewMode === "view" ? (
        <PosturePreviewPanel
          currentStatus={currentStatus}
          detectionSignals={detectionSignals}
          onClose={closePostureView}
        >
          <div style={styles.videoWrap}>
            <VideoElement setVideoElement={setVideoElement} visible />
          </div>
        </PosturePreviewPanel>
      ) : null}

      {recalibrateSuccess ? (
        <CenterModal
          title="기준 자세 저장 완료"
          message="기준 자세가 새로 저장되었습니다."
          actions={
            <button
              type="button"
              style={styles.button}
              onClick={() => setRecalibrateSuccess(false)}
            >
              확인
            </button>
          }
        />
      ) : null}

      {statusAlert ? (
        <StatusAlertModal
          message={statusAlert.message}
          onDismiss={() => setStatusAlert(null)}
        />
      ) : null}

      {activeGuide?.phase === "prompt" ? (
        <WellnessPromptModal
          kind={activeGuide.kind}
          onStart={() =>
            setActiveGuide({ phase: "guide", kind: activeGuide.kind, isPreview: activeGuide.isPreview })
          }
          onPostpone={handleWellnessPostpone}
          onDisableToday={handleWellnessDisableToday}
        />
      ) : null}

      {activeGuide?.phase === "guide" ? (
        <WellnessGuideModal
          kind={activeGuide.kind}
          onComplete={handleWellnessComplete}
          onPostpone={handleWellnessPostpone}
          onDisableToday={handleWellnessDisableToday}
        />
      ) : null}
    </div>
  );
}
