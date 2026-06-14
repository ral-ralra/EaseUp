import { useCallback, useEffect, useRef, useState } from "react";
import {
  AUTO_SAVE_AFTER_GOOD_MS,
  CAMERA_HEIGHT,
  CAMERA_WIDTH,
  INTERVAL_MS,
  WELLNESS_STATUS,
} from "../state/constants.js";
import { resolveStatus, createShoulderTensionTracker, evaluateShoulderTension } from "../state/wellnessState.js";
import { loadMediaPipeScripts } from "../services/scriptLoader.js";
import { createFaceDetector, measureFace } from "../services/faceMeshDetector.js";
import { createPoseDetector, measureShoulders } from "../services/poseDetector.js";

export function useDetectionLoop({
  isMonitoring,
  powerSaveMode,
  baseline,
  keepDetectingWithoutBaseline = false,
  onStatusChange,
  onMeasurements,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const faceRef = useRef(null);
  const poseRef = useRef(null);
  const cameraRef = useRef(null);
  const timerRef = useRef(null);
  const tickRef = useRef(0);
  const goodSinceRef = useRef(Date.now());
  const signalsRef = useRef({ tooClose: false, shoulderTension: false });
  const shoulderTrackerRef = useRef(createShoulderTensionTracker());
  const statusRef = useRef(WELLNESS_STATUS.GOOD);
  const isSendingRef = useRef(false);

  const [scriptsReady, setScriptsReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(WELLNESS_STATUS.GOOD);
  const [detectionSignals, setDetectionSignals] = useState({
    tooClose: false,
    shoulderTension: false,
    hasFace: false,
    hasShoulders: false,
    shoulderHeightChangePct: 0,
    earShoulderDistanceChangePct: 0,
    tensionHoldSec: 0,
    hasEarShoulderMetric: false,
  });

  const publishSignals = useCallback((partial) => {
    setDetectionSignals((current) => ({ ...current, ...partial }));
  }, []);

  const getIntervalMs = useCallback(() => {
    if (powerSaveMode) return INTERVAL_MS.powerSave;
    if (
      statusRef.current === WELLNESS_STATUS.GOOD &&
      Date.now() - goodSinceRef.current >= AUTO_SAVE_AFTER_GOOD_MS
    ) {
      return INTERVAL_MS.autoSave;
    }
    return INTERVAL_MS.active;
  }, [powerSaveMode]);

  const applyStatus = useCallback(
    (nextStatus) => {
      if (nextStatus !== statusRef.current) {
        if (nextStatus === WELLNESS_STATUS.GOOD) {
          goodSinceRef.current = Date.now();
        }
        statusRef.current = nextStatus;
        setCurrentStatus(nextStatus);
        onStatusChange?.(nextStatus);
      }
    },
    [onStatusChange],
  );

  const updateSignals = useCallback(() => {
    const nextStatus = resolveStatus(signalsRef.current);
    applyStatus(nextStatus);
  }, [applyStatus]);

  const initDetectors = useCallback(async () => {
    faceRef.current = createFaceDetector((results) => {
      isSendingRef.current = false;
      const measurements = measureFace(results.multiFaceLandmarks?.[0]);
      onMeasurements?.({ face: measurements, shoulders: null });

      if (!measurements || !baseline?.face) {
        signalsRef.current.tooClose = false;
        publishSignals({ tooClose: false, hasFace: Boolean(measurements) });
      } else {
        const tooClose =
          measurements.eyeDistance >= baseline.face.eyeDistance * 1.175;
        signalsRef.current.tooClose = tooClose;
        publishSignals({ tooClose, hasFace: true });
      }
      if (isMonitoring && baseline) updateSignals();
    });

    poseRef.current = createPoseDetector((results) => {
      isSendingRef.current = false;
      const measurements = measureShoulders(results.poseLandmarks);
      onMeasurements?.({ face: null, shoulders: measurements });

      if (!measurements || !baseline?.shoulders) {
        signalsRef.current.shoulderTension = false;
        shoulderTrackerRef.current = createShoulderTensionTracker();
        publishSignals({
          shoulderTension: false,
          hasShoulders: Boolean(measurements),
          shoulderHeightChangePct: 0,
          earShoulderDistanceChangePct: 0,
          tensionHoldSec: 0,
          hasEarShoulderMetric: false,
        });
      } else {
        const evaluation = evaluateShoulderTension(
          measurements,
          baseline.shoulders,
          shoulderTrackerRef.current,
        );
        signalsRef.current.shoulderTension = evaluation.isTension;
        publishSignals({
          shoulderTension: evaluation.isTension,
          hasShoulders: true,
          shoulderHeightChangePct: evaluation.shoulderHeightChangePct,
          earShoulderDistanceChangePct: evaluation.earShoulderDistanceChangePct,
          tensionHoldSec: evaluation.tensionHoldSec,
          hasEarShoulderMetric: evaluation.hasEarShoulderMetric,
        });
      }
      if (isMonitoring && baseline) updateSignals();
    });
  }, [baseline, isMonitoring, updateSignals, onMeasurements, publishSignals]);

  const attachStreamToVideo = useCallback(async (video) => {
    if (!video || !streamRef.current) return;
    video.srcObject = streamRef.current;
    try {
      await video.play();
    } catch {
      // autoplay may fail briefly during remount
    }
  }, []);

  const setVideoElement = useCallback(
    (node) => {
      videoRef.current = node;
      if (node) attachStreamToVideo(node);
    },
    [attachStreamToVideo],
  );

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: CAMERA_WIDTH },
            height: { ideal: CAMERA_HEIGHT },
            facingMode: "user",
          },
          audio: false,
        });
      }

      await attachStreamToVideo(videoRef.current);
    } catch (error) {
      setCameraError(error?.message || "카메라를 시작할 수 없습니다.");
    }
  }, [attachStreamToVideo]);

  const stopCamera = useCallback(() => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) video.srcObject = null;
    cameraRef.current?.stop?.();
    cameraRef.current = null;
    faceRef.current?.close?.();
    poseRef.current?.close?.();
    faceRef.current = null;
    poseRef.current = null;
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const runTick = useCallback(async () => {
    if (isSendingRef.current) return;
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    isSendingRef.current = true;
    tickRef.current += 1;
    const useFace = tickRef.current % 2 === 1;

    try {
      if (useFace && faceRef.current) {
        await faceRef.current.send(video);
      } else if (!useFace && poseRef.current) {
        await poseRef.current.send(video);
      } else {
        isSendingRef.current = false;
      }
    } catch {
      isSendingRef.current = false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadMediaPipeScripts()
      .then(async () => {
        if (cancelled) return;
        await initDetectors();
        setScriptsReady(true);
      })
      .catch((error) => {
        if (!cancelled) {
          setCameraError(error.message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [initDetectors]);

  useEffect(() => {
    if (!scriptsReady) return undefined;
    startCamera();
    return stopCamera;
  }, [scriptsReady, startCamera, stopCamera]);

  useEffect(() => {
    shoulderTrackerRef.current = createShoulderTensionTracker();
  }, [baseline, isMonitoring]);

  useEffect(() => {
    if (!scriptsReady) return undefined;

    const schedule = () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (!isMonitoring && !baseline) {
        timerRef.current = window.setInterval(runTick, INTERVAL_MS.active);
        return;
      }
      if (!isMonitoring) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = null;
        applyStatus(WELLNESS_STATUS.GOOD);
        return;
      }
      if (!baseline && !keepDetectingWithoutBaseline) return;
      timerRef.current = window.setInterval(runTick, getIntervalMs());
    };

    schedule();
    const watchId = window.setInterval(schedule, 5000);

    return () => {
      window.clearInterval(watchId);
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [
    isMonitoring,
    baseline,
    keepDetectingWithoutBaseline,
    scriptsReady,
    runTick,
    getIntervalMs,
    applyStatus,
  ]);

  return {
    videoRef,
    setVideoElement,
    scriptsReady,
    cameraError,
    currentStatus,
    detectionSignals,
    restartCamera: startCamera,
  };
}
