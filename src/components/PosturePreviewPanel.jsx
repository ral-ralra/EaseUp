import {
  STATUS_MESSAGES,
  TRAY_EMOJI,
  WELLNESS_STATUS,
} from "../state/constants.js";
import { styles, theme } from "../styles/theme.js";

const STATUS_NAMES = {
  [WELLNESS_STATUS.GOOD]: "GOOD",
  [WELLNESS_STATUS.TOO_CLOSE]: "TOO_CLOSE",
  [WELLNESS_STATUS.SHOULDER_TENSION]: "SHOULDER_TENSION",
};

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

function formatSignedPct(value) {
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded}%`;
}

export function PosturePreviewPanel({
  currentStatus,
  detectionSignals,
  onClose,
  children,
}) {
  const distanceLabel = detectionSignals.tooClose ? "가까움" : "정상";
  const shoulderLabel = detectionSignals.shoulderTension ? "긴장" : "정상";
  const emoji = TRAY_EMOJI[currentStatus] || TRAY_EMOJI.GOOD;

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-label="내 자세 보기">
      <div style={panelStyles.card}>
        <h2 style={panelStyles.title}>내 자세 보기</h2>
        <p style={panelStyles.subtitle}>모니터링은 계속 유지됩니다.</p>

        <div style={panelStyles.grid}>
          <span style={panelStyles.rowLabel}>현재 상태</span>
          <span style={{ ...panelStyles.rowValue, color: statusColor(currentStatus) }}>
            {STATUS_NAMES[currentStatus]} {emoji}
          </span>

          <span style={panelStyles.rowLabel}>화면 거리</span>
          <span
            style={{
              ...panelStyles.rowValue,
              color: detectionSignals.tooClose ? theme.colors.warn : theme.colors.good,
            }}
          >
            {detectionSignals.hasFace ? distanceLabel : "감지 중..."}
          </span>

          <span style={panelStyles.rowLabel}>어깨 상태</span>
          <span
            style={{
              ...panelStyles.rowValue,
              color: detectionSignals.shoulderTension
                ? theme.colors.danger
                : theme.colors.good,
            }}
          >
            {detectionSignals.hasShoulders ? shoulderLabel : "감지 중..."}
          </span>
        </div>

        <p style={panelStyles.statusMessage}>{STATUS_MESSAGES[currentStatus]}</p>

        {detectionSignals.hasShoulders ? (
          <div style={panelStyles.debugBox}>
            <p style={panelStyles.debugTitle}>감지 디버그</p>
            <p style={panelStyles.debugLine}>
              현재 어깨 높이 변화{" "}
              {formatSignedPct(detectionSignals.shoulderHeightChangePct)}
            </p>
            <p style={panelStyles.debugLine}>
              현재 귀-어깨 거리 변화{" "}
              {detectionSignals.hasEarShoulderMetric
                ? formatSignedPct(detectionSignals.earShoulderDistanceChangePct)
                : "측정 불가"}
            </p>
            <p style={panelStyles.debugLine}>
              긴장 지속 시간 {Math.floor(detectionSignals.tensionHoldSec)}초
            </p>
          </div>
        ) : null}

        {children}

        <button type="button" style={{ ...styles.button, marginTop: "14px" }} onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}

const panelStyles = {
  card: {
    width: "min(420px, 100%)",
    background: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: "24px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
  },
  title: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 700,
  },
  subtitle: {
    margin: "6px 0 16px",
    fontSize: "13px",
    color: theme.colors.muted,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "8px 16px",
    padding: "14px",
    borderRadius: theme.radius.md,
    background: "#F2F2F7",
    marginBottom: "12px",
    fontSize: "14px",
  },
  rowLabel: {
    color: theme.colors.muted,
    fontWeight: 600,
  },
  rowValue: {
    fontWeight: 700,
    textAlign: "right",
  },
  statusMessage: {
    margin: "0 0 14px",
    fontSize: "14px",
    lineHeight: 1.55,
    color: theme.colors.text,
    whiteSpace: "pre-line",
  },
  debugBox: {
    marginBottom: "14px",
    padding: "10px 12px",
    borderRadius: theme.radius.sm,
    background: "#ECECF1",
    fontSize: "11px",
    lineHeight: 1.6,
    color: theme.colors.muted,
  },
  debugTitle: {
    margin: "0 0 4px",
    fontSize: "11px",
    fontWeight: 700,
    color: theme.colors.muted,
  },
  debugLine: {
    margin: 0,
  },
};
