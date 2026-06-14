import { STORAGE_KEYS } from "../state/constants.js";

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) {
      return { muted: false, powerSaveMode: false };
    }
    return { muted: false, powerSaveMode: false, ...JSON.parse(raw) };
  } catch {
    return { muted: false, powerSaveMode: false };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

export function loadWellnessStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.wellness);
    const today = new Date().toISOString().slice(0, 10);
    if (!raw) {
      return createDefaultWellnessStats(today);
    }
    const parsed = JSON.parse(raw);
    if (parsed.date !== today) {
      return createDefaultWellnessStats(today);
    }
    return parsed;
  } catch {
    return createDefaultWellnessStats(new Date().toISOString().slice(0, 10));
  }
}

function createDefaultWellnessStats(date) {
  return {
    date,
    eyeExerciseDisabled: false,
    stretchDisabled: false,
    eyeExerciseCount: 0,
    stretchCount: 0,
  };
}

export function saveWellnessStats(stats) {
  localStorage.setItem(STORAGE_KEYS.wellness, JSON.stringify(stats));
}
