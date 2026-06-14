import { theme } from "../styles/theme.js";

const progressStyles = {
  progressTrack: {
    height: "6px",
    borderRadius: theme.radius.pill,
    background: theme.colors.border,
    overflow: "hidden",
    marginBottom: "14px",
  },
  progressFill: {
    height: "100%",
    background: theme.colors.accent,
    transition: "width 0.4s ease",
  },
};

/**
 * @param {{
 *   exerciseTitle: string,
 *   exerciseSummary: string,
 *   stepLabel: string,
 *   stepDescription: string,
 *   stepImage: string,
 *   durationSec: number,
 *   exerciseIndex: number,
 *   exerciseTotal: number,
 *   stepIndex: number,
 *   stepTotal: number,
 *   secondsLeft: number,
 *   overallProgress: number,
 *   flatIndex: number,
 *   flatTotal: number,
 * }} props
 */
export function ExerciseGuideCard({
  exerciseTitle,
  exerciseSummary,
  stepLabel,
  stepDescription,
  stepImage,
  durationSec,
  exerciseIndex,
  exerciseTotal,
  stepIndex,
  stepTotal,
  secondsLeft,
  overallProgress,
  flatIndex,
  flatTotal,
}) {
  return (
    <div style={cardStyles.wrap}>
      <div style={progressStyles.progressTrack}>
        <div style={{ ...progressStyles.progressFill, width: `${overallProgress}%` }} />
      </div>

      <div style={cardStyles.header}>
        <p style={cardStyles.exerciseMeta}>
          전체 {flatIndex + 1} / {flatTotal} · 운동 {exerciseIndex + 1} / {exerciseTotal}
        </p>
        <h3 style={cardStyles.exerciseTitle}>{exerciseTitle}</h3>
        <p style={cardStyles.exerciseSummary}>{exerciseSummary}</p>
      </div>

      <div style={cardStyles.imageFrame}>
        <img
          src={stepImage}
          alt={`${exerciseTitle} ${stepLabel}`}
          style={cardStyles.image}
          loading="eager"
          decoding="sync"
        />
      </div>

      <div style={cardStyles.stepBlock}>
        <span style={cardStyles.stepBadge}>{stepLabel}</span>
        <p style={cardStyles.stepDescription}>{stepDescription}</p>
      </div>

      <div style={cardStyles.footer}>
        <span style={cardStyles.timer}>
          {secondsLeft > 0 ? `${secondsLeft}초 후 다음 안내` : "다음 안내로 이동 중..."}
        </span>
        <div style={cardStyles.dots} aria-hidden="true">
          {Array.from({ length: stepTotal }, (_, index) => (
            <span
              key={index}
              style={{
                ...cardStyles.dot,
                ...(index === stepIndex ? cardStyles.dotActive : null),
              }}
            />
          ))}
        </div>
      </div>

      <p style={cardStyles.hint}>이 단계는 약 {durationSec}초 동안 천천히 따라해 주세요.</p>
    </div>
  );
}

/**
 * @param {{ image: string, title: string, durationLabel?: string, items: string[] }} props
 */
export function ExercisePreviewCard({ image, title, durationLabel, items }) {
  return (
    <div style={cardStyles.wrap}>
      <div style={cardStyles.imageFrame}>
        <img
          src={image}
          alt={title}
          style={cardStyles.image}
          loading="eager"
          decoding="sync"
        />
      </div>
      {durationLabel ? <p style={cardStyles.durationLabel}>{durationLabel}</p> : null}
      <ul style={cardStyles.previewList}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

const cardStyles = {
  wrap: {
    textAlign: "left",
    marginBottom: "8px",
  },
  header: {
    marginBottom: "14px",
  },
  exerciseMeta: {
    margin: "0 0 4px",
    fontSize: "12px",
    fontWeight: 600,
    color: theme.colors.accent,
    letterSpacing: "0.04em",
  },
  exerciseTitle: {
    margin: "0 0 4px",
    fontSize: "20px",
    fontWeight: 700,
    color: theme.colors.text,
  },
  exerciseSummary: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.5,
    color: theme.colors.muted,
  },
  imageFrame: {
    borderRadius: theme.radius.md,
    overflow: "hidden",
    background: "linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 100%)",
    border: `1px solid ${theme.colors.border}`,
    marginBottom: "14px",
    minHeight: "220px",
  },
  image: {
    display: "block",
    width: "100%",
    minHeight: "220px",
    aspectRatio: "4 / 3",
    objectFit: "contain",
  },
  stepBlock: {
    marginBottom: "12px",
  },
  stepBadge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: theme.radius.pill,
    background: "#E8F1FF",
    color: theme.colors.accent,
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.06em",
    marginBottom: "8px",
  },
  stepDescription: {
    margin: 0,
    fontSize: "15px",
    lineHeight: 1.55,
    color: theme.colors.text,
    fontWeight: 500,
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  timer: {
    fontSize: "13px",
    color: theme.colors.accent,
    fontWeight: 700,
  },
  hint: {
    margin: "10px 0 0",
    fontSize: "12px",
    color: theme.colors.muted,
  },
  dots: {
    display: "flex",
    gap: "6px",
  },
  dot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: theme.colors.border,
  },
  dotActive: {
    background: theme.colors.accent,
    transform: "scale(1.15)",
  },
  durationLabel: {
    margin: "0 0 10px",
    fontSize: "13px",
    fontWeight: 600,
    color: theme.colors.muted,
    textAlign: "center",
  },
  previewList: {
    margin: 0,
    padding: "12px 16px",
    listStyle: "none",
    borderRadius: theme.radius.sm,
    background: "#F2F2F7",
    fontSize: "13px",
    lineHeight: 1.8,
    color: theme.colors.text,
  },
};
