const WELLNESS_BASE = "./wellness";

const eyeImg = (name) => `${WELLNESS_BASE}/eye-exercise/${name}.svg`;
const stretchImg = (name) => `${WELLNESS_BASE}/stretching/${name}.svg`;

/** @typedef {{ label: string, description: string, image: string, durationSec?: number }} ExerciseStep */
/** @typedef {{ id: string, title: string, summary: string, durationSec: number, steps: ExerciseStep[] }} ExerciseGuide */
/** @typedef {ExerciseStep & { exerciseId: string, exerciseTitle: string, exerciseSummary: string, exerciseDurationSec: number, exerciseIndex: number, stepIndex: number, stepTotal: number, exerciseTotal: number, flatIndex: number }} FlatExerciseStep */

/** @type {ExerciseGuide[]} */
export const EYE_EXERCISES = [
  {
    id: "horizontal",
    title: "좌우 보기",
    summary: "고개는 고정하고 눈만 좌우로 움직입니다.",
    durationSec: 20,
    steps: [
      {
        label: "STEP 1",
        description: "시선을 왼쪽 끝까지 천천히 옮깁니다.",
        image: eyeImg("horizontal-step1"),
      },
      {
        label: "STEP 2",
        description: "정면을 바라본 뒤 오른쪽 끝까지 옮깁니다.",
        image: eyeImg("horizontal-step2"),
      },
      {
        label: "STEP 3",
        description: "왼쪽 ↔ 오른쪽을 부드럽게 반복합니다.",
        image: eyeImg("horizontal-step3"),
      },
    ],
  },
  {
    id: "vertical",
    title: "상하 보기",
    summary: "고개는 움직이지 않고 눈만 위아래로 움직입니다.",
    durationSec: 20,
    steps: [
      {
        label: "STEP 1",
        description: "시선을 위쪽 천장 방향으로 올립니다.",
        image: eyeImg("vertical-step1"),
      },
      {
        label: "STEP 2",
        description: "정면을 바라본 뒤 아래쪽으로 내립니다.",
        image: eyeImg("vertical-step2"),
      },
      {
        label: "STEP 3",
        description: "위 ↔ 아래를 천천히 반복합니다.",
        image: eyeImg("vertical-step3"),
      },
    ],
  },
  {
    id: "circle",
    title: "원 그리기",
    summary: "눈만 움직여 작은 원을 그립니다.",
    durationSec: 20,
    steps: [
      {
        label: "STEP 1",
        description: "시선을 12시 방향(위)으로 올립니다.",
        image: eyeImg("circle-step1"),
      },
      {
        label: "STEP 2",
        description: "시계 방향으로 3시 → 6시 → 9시를 따라갑니다.",
        image: eyeImg("circle-step2"),
      },
      {
        label: "STEP 3",
        description: "작은 원을 3~5바퀴 그린 뒤 반대 방향도 합니다.",
        image: eyeImg("circle-step3"),
      },
    ],
  },
  {
    id: "distance",
    title: "먼 곳 보기",
    summary: "가까운 화면에서 멀리 있는 대상으로 시선을 옮깁니다.",
    durationSec: 20,
    steps: [
      {
        label: "STEP 1",
        description: "모니터에서 시선을 떼고 창문이나 먼 벽을 찾습니다.",
        image: eyeImg("distance-step1"),
      },
      {
        label: "STEP 2",
        description: "6m 이상 먼 곳의 한 지점을 바라봅니다.",
        image: eyeImg("distance-step2"),
      },
      {
        label: "STEP 3",
        description: "눈을 감았다 뜨며 20초간 유지합니다.",
        image: eyeImg("distance-step3"),
      },
    ],
  },
];

/** @type {ExerciseGuide[]} */
export const STRETCH_EXERCISES = [
  {
    id: "neck",
    title: "목 스트레칭",
    summary: "턱을 당겨 목 뒤쪽을 길게 늘립니다.",
    durationSec: 30,
    steps: [
      {
        label: "STEP 1",
        description: "어깨를 내리고 등을 곧게 펴 앉습니다.",
        image: stretchImg("neck-step1"),
      },
      {
        label: "STEP 2",
        description: "턱을 가볍게 당기며 목 뒤가 길어지는 느낌을 유지합니다.",
        image: stretchImg("neck-step2"),
      },
      {
        label: "STEP 3",
        description: "10초 유지 후 천천히 풀어줍니다.",
        image: stretchImg("neck-step3"),
      },
    ],
  },
  {
    id: "shoulder-roll",
    title: "어깨 돌리기",
    summary: "어깨를 크게 원을 그리듯 앞뒤로 돌립니다.",
    durationSec: 30,
    steps: [
      {
        label: "STEP 1",
        description: "팔을 자연스럽게 내리고 어깨를 뒤로 돌립니다.",
        image: stretchImg("shoulder-roll-step1"),
      },
      {
        label: "STEP 2",
        description: "어깨를 위로 올려 앞으로 크게 원을 그립니다.",
        image: stretchImg("shoulder-roll-step2"),
      },
      {
        label: "STEP 3",
        description: "앞 → 뒤 방향으로 5회, 반대 방향 5회 반복합니다.",
        image: stretchImg("shoulder-roll-step3"),
      },
    ],
  },
  {
    id: "wrist",
    title: "손목 스트레칭",
    summary: "키보드·마우스로 굳은 손목을 풀어줍니다.",
    durationSec: 30,
    steps: [
      {
        label: "STEP 1",
        description: "한 팔을 앞으로 뻗고 손바닥을 위로 향합니다.",
        image: stretchImg("wrist-step1"),
      },
      {
        label: "STEP 2",
        description: "다른 손으로 손가락을 몸 쪽으로 당겨 10초 유지합니다.",
        image: stretchImg("wrist-step2"),
      },
      {
        label: "STEP 3",
        description: "손바닥을 아래로 향해 반대 방향도 같은 방법으로 합니다.",
        image: stretchImg("wrist-step3"),
      },
    ],
  },
  {
    id: "chest",
    title: "가슴 펴기",
    summary: "굽은 어깨를 뒤로 모아 가슴을 엽니다.",
    durationSec: 30,
    steps: [
      {
        label: "STEP 1",
        description: "양손을 뒤로 깍지 끼거나 허리에 얹습니다.",
        image: stretchImg("chest-step1"),
      },
      {
        label: "STEP 2",
        description: "어깨를 뒤로 모으며 가슴을 앞으로 엽니다.",
        image: stretchImg("chest-step2"),
      },
      {
        label: "STEP 3",
        description: "10초 유지 후 천천히 풀어줍니다.",
        image: stretchImg("chest-step3"),
      },
    ],
  },
];

export const WELLNESS_PREVIEWS = {
  eye: eyeImg("preview"),
  stretch: stretchImg("preview"),
};

/** @param {ExerciseGuide[]} exercises */
export function flattenExerciseSteps(exercises) {
  /** @type {FlatExerciseStep[]} */
  const flat = [];

  exercises.forEach((exercise, exerciseIndex) => {
    const stepDurationSec = Math.max(
      5,
      Math.round(exercise.durationSec / exercise.steps.length),
    );

    exercise.steps.forEach((step, stepIndex) => {
      flat.push({
        ...step,
        durationSec: stepDurationSec,
        exerciseId: exercise.id,
        exerciseTitle: exercise.title,
        exerciseSummary: exercise.summary,
        exerciseDurationSec: exercise.durationSec,
        exerciseIndex,
        stepIndex,
        stepTotal: exercise.steps.length,
        exerciseTotal: exercises.length,
        flatIndex: flat.length,
      });
    });
  });

  return flat;
}
