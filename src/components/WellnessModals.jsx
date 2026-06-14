import { useEffect, useMemo, useState } from "react";
import {
  EYE_EXERCISES,
  STRETCH_EXERCISES,
  WELLNESS_PREVIEWS,
  flattenExerciseSteps,
} from "../data/exerciseGuides.js";
import { CenterModal } from "./CenterModal.jsx";
import { ExerciseGuideCard, ExercisePreviewCard } from "./ExerciseGuideCard.jsx";
import { styles, theme } from "../styles/theme.js";

export function WellnessGuideModal({
  kind,
  onComplete,
  onPostpone,
  onDisableToday,
}) {
  const exercises = kind === "eye" ? EYE_EXERCISES : STRETCH_EXERCISES;
  const flatSteps = useMemo(() => flattenExerciseSteps(exercises), [exercises]);
  const [flatIndex, setFlatIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(flatSteps[0]?.durationSec ?? 7);

  const current = flatSteps[flatIndex];
  const isLastStep = flatIndex >= flatSteps.length - 1;
  const overallProgress = ((flatIndex + 1) / flatSteps.length) * 100;

  useEffect(() => {
    if (!current) return;
    setSecondsLeft(current.durationSec);
  }, [flatIndex, current]);

  useEffect(() => {
    if (!current || secondsLeft <= 0) return undefined;

    const timer = window.setTimeout(() => {
      setSecondsLeft((value) => value - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [current, secondsLeft]);

  useEffect(() => {
    if (!current || secondsLeft > 0) return;

    if (isLastStep) {
      onComplete?.();
      return;
    }
    setFlatIndex((value) => value + 1);
  }, [current, secondsLeft, isLastStep, onComplete]);

  if (!current) return null;

  return (
    <CenterModal
      title={kind === "eye" ? "눈 운동" : "스트레칭"}
      message="천천히 따라해 주세요. 다음 안내는 자동으로 넘어갑니다."
      actions={
        <>
          <button type="button" style={styles.buttonSecondary} onClick={onPostpone}>
            10분 뒤 알림
          </button>
          <button
            type="button"
            style={styles.buttonSecondary}
            onClick={() => onDisableToday?.(kind)}
          >
            오늘은 끄기
          </button>
        </>
      }
    >
      <ExerciseGuideCard
        exerciseTitle={current.exerciseTitle}
        exerciseSummary={current.exerciseSummary}
        stepLabel={current.label}
        stepDescription={current.description}
        stepImage={current.image}
        durationSec={current.durationSec}
        exerciseIndex={current.exerciseIndex}
        exerciseTotal={current.exerciseTotal}
        stepIndex={current.stepIndex}
        stepTotal={current.stepTotal}
        secondsLeft={secondsLeft}
        overallProgress={overallProgress}
        flatIndex={flatIndex}
        flatTotal={flatSteps.length}
      />
    </CenterModal>
  );
}

export function WellnessPromptModal({ kind, onStart, onPostpone, onDisableToday }) {
  const isEye = kind === "eye";
  const exercises = isEye ? EYE_EXERCISES : STRETCH_EXERCISES;
  const totalSec = exercises.reduce((sum, item) => sum + item.durationSec, 0);
  const minutes = Math.ceil(totalSec / 60);

  return (
    <CenterModal
      title={isEye ? "눈 운동 시간이에요" : "스트레칭 시간이에요"}
      message={
        isEye
          ? "잠시 눈을 쉬어주세요.\n시작하기를 누르면 안내에 맞춰 자동으로 진행됩니다."
          : "어깨와 목을 풀어줄 시간이에요.\n시작하기를 누르면 안내에 맞춰 자동으로 진행됩니다."
      }
      actions={
        <>
          <button type="button" style={styles.button} onClick={onStart}>
            시작하기
          </button>
          <button type="button" style={styles.buttonSecondary} onClick={onPostpone}>
            10분 뒤 알림
          </button>
          <button
            type="button"
            style={styles.buttonSecondary}
            onClick={() => onDisableToday?.(kind)}
          >
            오늘은 끄기
          </button>
        </>
      }
    >
      <ExercisePreviewCard
        image={WELLNESS_PREVIEWS[kind === "eye" ? "eye" : "stretch"]}
        title={isEye ? "눈 운동" : "스트레칭"}
        durationLabel={`약 ${minutes}분 · ${exercises.length}가지 운동`}
        items={exercises.map((exercise) => exercise.title)}
      />
    </CenterModal>
  );
}

export function StatusAlertModal({ message, onDismiss }) {
  return (
    <CenterModal
      title="자세 알림"
      message={message}
      actions={
        <button type="button" style={styles.button} onClick={onDismiss}>
          확인
        </button>
      }
    />
  );
}
