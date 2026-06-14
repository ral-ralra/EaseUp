import { useCallback, useEffect, useRef, useState } from "react";
import {
  ALERT_COOLDOWN_MS,
  ALERT_HOLD_MS,
  STATUS_MESSAGES,
  WELLNESS_STATUS,
} from "../state/constants.js";

export function useAlertPolicy({ muted, onAlert }) {
  const statusRef = useRef(WELLNESS_STATUS.GOOD);
  const holdStatusRef = useRef(null);
  const holdStartedAtRef = useRef(0);
  const lastAlertAtRef = useRef({});

  const resetTimers = useCallback(() => {
    holdStatusRef.current = null;
    holdStartedAtRef.current = 0;
  }, []);

  const evaluate = useCallback(
    (nextStatus) => {
      if (nextStatus !== statusRef.current) {
        statusRef.current = nextStatus;
        resetTimers();
      }

      if (
        nextStatus === WELLNESS_STATUS.GOOD
      ) {
        resetTimers();
        return;
      }

      const now = Date.now();

      if (holdStatusRef.current !== nextStatus) {
        holdStatusRef.current = nextStatus;
        holdStartedAtRef.current = now;
        return;
      }

      if (now - holdStartedAtRef.current < ALERT_HOLD_MS) {
        return;
      }

      const lastAlert = lastAlertAtRef.current[nextStatus] || 0;
      if (now - lastAlert < ALERT_COOLDOWN_MS) {
        return;
      }

      lastAlertAtRef.current[nextStatus] = now;
      resetTimers();

      onAlert?.({
        status: nextStatus,
        message: STATUS_MESSAGES[nextStatus],
        muted,
      });
    },
    [muted, onAlert, resetTimers],
  );

  return { evaluate, resetTimers };
}

export function useBeep() {
  const audioRef = useRef(null);

  useEffect(() => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      audioRef.current = new AudioCtx();
    }
    return () => {
      audioRef.current?.close?.();
    };
  }, []);

  return useCallback((muted) => {
    if (muted || !audioRef.current) return;
    const ctx = audioRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 520;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }, []);
}

export function useWellnessRoutine({ isMonitoring, onPrompt }) {
  const [nextKind, setNextKind] = useState(null);
  const timerRef = useRef(null);
  const nextAtRef = useRef(0);
  const kindRef = useRef("eye");

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleNext = useCallback(
    (delayMs) => {
      clearTimer();
      nextAtRef.current = Date.now() + delayMs;
      timerRef.current = window.setTimeout(() => {
        const kind = kindRef.current;
        setNextKind(kind);
        onPrompt?.(kind);
        kindRef.current = kind === "eye" ? "stretch" : "eye";
      }, delayMs);
    },
    [clearTimer, onPrompt],
  );

  const startRoutine = useCallback(() => {
    kindRef.current = "eye";
    scheduleNext(30 * 60 * 1000);
  }, [scheduleNext]);

  const postpone = useCallback(() => {
    setNextKind(null);
    scheduleNext(10 * 60 * 1000);
  }, [scheduleNext]);

  const complete = useCallback(() => {
    setNextKind(null);
    scheduleNext(30 * 60 * 1000);
  }, [scheduleNext]);

  const disableToday = useCallback((kind) => {
    setNextKind(null);
    if (kind === "eye") {
      kindRef.current = "stretch";
    } else {
      kindRef.current = "eye";
    }
    scheduleNext(30 * 60 * 1000);
  }, [scheduleNext]);

  useEffect(() => {
    if (!isMonitoring) {
      clearTimer();
      setNextKind(null);
      return undefined;
    }
    startRoutine();
    return clearTimer;
  }, [isMonitoring, startRoutine, clearTimer]);

  return {
    nextKind,
    nextAt: nextAtRef.current,
    postpone,
    complete,
    disableToday,
    dismissPrompt: () => setNextKind(null),
  };
}
