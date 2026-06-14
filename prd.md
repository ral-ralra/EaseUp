# EaseUp PRD (Product Requirements Document)

> **프로젝트명:** EaseUp  
> **태그라인:** 조금 더 편하게 일하자  
> **버전:** 1.0 (Electron Desktop MVP)  
> **최종 업데이트:** 2026-06-14  
> **이전 프로젝트:** PostureGuard → EaseUp 전면 재설계

---

## 1. Product Overview

EaseUp은 Windows 데스크톱 전용 Electron 앱으로, 웹캠과 MediaPipe를 활용해 **장시간 컴퓨터 작업 중** 눈 피로·어깨 긴장·화면 과근접을 조용히 감지하고 안내하는 AI 웰니스 코치입니다.

사용자의 카메라 영상은 **외부 서버로 전송되지 않으며**, PC 내부(On-Device)에서만 분석됩니다.

### 핵심 컨셉

- 자세를 **감시**하는 앱이 아니라, 업무 중 **조용히 챙겨주는** 코치
- SketchUp, AutoCAD, Chrome, Office 등 **다른 프로그램 사용 중**에도 트레이에서 백그라운드 동작
- 상태는 **3가지**로 단순화하여 이해하기 쉽게 유지

---

## 2. Goals

| 목표 | 설명 |
|------|------|
| 조용한 모니터링 | 평소 카메라 프리뷰 숨김, 트레이 아이콘으로 상태 표시 |
| On-Device 분석 | MediaPipe Face Mesh + Pose, 영상 외부 전송 없음 |
| 실용적 감지 | 화면 거리 + 어깨 긴장, 지속 시간 기반 판정 |
| 웰니스 루틴 | 30분마다 눈 운동 / 스트레칭 교차 안내 |
| 필요 시 확인 | 내 자세 보기, 기준 자세 재저장, 웰니스 미리보기 |
| 데스크톱 UX | 닫기 = 트레이 숨김, 종료는 트레이 메뉴에서만 |

---

## 3. Non-Goals

- 모바일 브라우저 / 모바일 앱 지원
- 서버 저장, 계정, 로그인, 클라우드 동기화
- 의료 진단·치료 목적 기능
- 카메라 영상 녹화·업로드
- PostureGuard 시절의 Orb-only 모드, 자세 점수 게이미화, 토스트 알림 UI

---

## 4. Target Users

- 장시간 노트북·데스크탑 작업자 (사무직, 개발자, 학생)
- CAD/3D/디자인 툴 사용자 (SketchUp, AutoCAD, LayOut 등)
- 강한 경고보다 **부드러운 안내**를 원하는 사용자

---

## 5. Supported Environment

| 항목 | 내용 |
|------|------|
| OS | Windows 10/11 (Electron) |
| 런타임 | Node.js, Electron 35+ |
| 카메라 | 웹캠 (getUserMedia) |
| AI | MediaPipe Face Mesh + Pose (CDN) |
| 저장 | LocalStorage |

---

## 6. Wellness Status (3 States)

| 상태 | 코드 | 조건 | 트레이 |
|------|------|------|--------|
| 좋음 | `GOOD` | 기준 대비 정상 | 😊 good |
| 화면 가까움 | `TOO_CLOSE` | 눈 간 거리 ≥ 기준 × 1.175 | 👀 too-close |
| 어깨 긴장 | `SHOULDER_TENSION` | 높이/귀-어깨 거리 + 지속 시간 | 😣 shoulder |

**우선순위:** `TOO_CLOSE` > `SHOULDER_TENSION` > `GOOD`

---

## 7. Core User Flow

```
앱 실행 → 트레이 아이콘 자동 생성
    ↓
기준 자세 저장 (얼굴 + 어깨)
    ↓
모니터링 시작 → 카메라 프리뷰 숨김, 트레이만 표시
    ↓
백그라운드 감지 (Face/Pose 교차, 1초 주기)
    ↓
상태 이상 10초 유지 → 중앙 모달 알림 (+ 선택적 비프음)
    ↓
30분마다 눈 운동 ↔ 스트레칭 교차 안내
    ↓
창 닫기 → 트레이로 숨김 (감지 계속)
    ↓
트레이 메뉴 "종료" → 앱 완전 종료
```

---

## 8. Functional Requirements

### 8.1 화면 거리 감지 (Face Mesh)

- **기준값:** 양쪽 눈 바깥쪽 랜드마크(33, 263) 간 거리
- **판정:** 현재 eyeDistance ≥ baseline × `TOO_CLOSE_RATIO` (1.175)
- **메시지:** "화면과 조금 가까워졌어요. 눈이 피곤할 수 있어요."

### 8.2 어깨 긴장 감지 (Pose)

**기준값 (기준 자세 저장 시):**
- 어깨 평균 Y: `(leftShoulder.y + rightShoulder.y) / 2`
- 귀-어깨 평균 거리: `avg(dist(leftEar, leftShoulder), dist(rightEar, rightShoulder))`

**판정 (OR 조건, 지속 시간 포함):**

| 조건 | 임계값 | 유지 시간 |
|------|--------|-----------|
| 어깨 높이 상승 (mild) | 기준 대비 +1.5% | 10초 |
| 어깨 높이 상승 (strong) | 기준 대비 +2.5% | 5초 |
| 귀-어깨 거리 감소 | 기준 대비 -1.5% | 10초 |

- 후보 조건 해제 시 타이머 리셋
- **메시지:** "어깨에 힘이 들어간 상태가 이어지고 있어요. 어깨를 한번 툭 내려놓아 보세요."

> 임계값은 `src/state/constants.js`에서 조정 가능

### 8.3 감지 성능

- 카메라 해상도: 320×240
- Face Mesh / Pose **교차 실행** (동시 실행 아님)
- 감지 주기: 1초 (active) / 2초 (5분 GOOD 후) / 2.5초 (절전 모드)
- `backgroundThrottling: false` + `powerSaveBlocker`로 창 숨김 시에도 감지 유지

### 8.4 알림 정책

- 상태 이상 **10초 유지** 후 중앙 모달 표시
- 동일 상태 **10분 쿨다운**
- 경고음 끄기 옵션 (Web Audio API)
- 토스트 알림 **사용 안 함** (중앙 모달만)

### 8.5 모니터링 중 카메라 확인

| 기능 | 동작 |
|------|------|
| **내 자세 보기** | 오버레이 패널: 상태, 거리, 어깨, 디버그 수치, 카메라 프리뷰 |
| **기준 자세 다시 저장** | 프리뷰 표시 → 기준 초기화 → 재측정 → 성공 모달 → 프리뷰 숨김 |
| **UX** | 평소 프리뷰 숨김, 패널 열릴 때만 렌더링 |
| **감지** | 패널 닫아도 MediaPipe 감지 계속 |

**디버그 표시 (내 자세 보기):**
- 현재 어깨 높이 변화 (%)
- 현재 귀-어깨 거리 변화 (%)
- 긴장 지속 시간 (초)

### 8.6 웰니스 루틴

- **주기:** 30분마다 교차 (눈 운동 → 스트레칭 → 눈 운동 …)
- **연기:** 10분 뒤 알림
- **끄기:** 오늘은 끄기 (해당 종류 skip 후 30분 타이머)

**눈 운동 4종 (각 20초, 3단계):**
1. 좌우 보기
2. 상하 보기
3. 원 그리기
4. 먼 곳 보기

**스트레칭 4종 (각 30초, 3단계):**
1. 목 스트레칭
2. 어깨 돌리기
3. 손목 스트레칭
4. 가슴 펴기

**가이드 UX:**
- 알림 → **시작하기 1회** → 단계별 **자동 진행** (눈 7초/단계, 스트레칭 10초/단계)
- 운동별 전용 SVG 일러스트 (`public/wellness/`)
- 진행 바 + "N초 후 다음 안내" 표시
- **웰니스 미리보기** 버튼으로 30분 대기 없이 테스트 가능 (타이머 영향 없음)

### 8.7 Electron 트레이

| mood | PNG | 상태 |
|------|-----|------|
| good | tray-good.png | GOOD |
| too-close | tray-too-close.png | TOO_CLOSE |
| shoulder | tray-shoulder.png | SHOULDER_TENSION |
| idle | tray-idle.png | 대기 / 모니터링 중지 |

- 앱 화면 상태와 트레이 아이콘 **단일 소스** (`statusToTrayMood`)
- 창 닫기/최소화 → `hide()` (종료 아님)
- 트레이 더블클릭 → 창 표시
- 트레이 메뉴: 열기, 음소거, 종료

### 8.8 설정

- 절전 모드 (감지 주기 2.5초)
- 경고음 끄기
- LocalStorage 저장 (`easeup-settings-v1`)

---

## 9. Architecture

```
src/
├── App.jsx                    # 메인 대시보드
├── main.jsx
├── state/
│   ├── constants.js           # 임계값, 메시지, 랜드마크
│   └── wellnessState.js       # 상태 판정, 어깨 긴장 평가
├── services/
│   ├── faceMeshDetector.js    # 화면 거리
│   ├── poseDetector.js        # 어깨 + 귀-어깨 거리
│   ├── scriptLoader.js        # MediaPipe CDN 로더
│   └── storage.js
├── hooks/
│   ├── useDetectionLoop.js    # Face/Pose 교차 감지 루프
│   └── useWellness.js         # 알림 정책, 웰니스 타이머
├── components/
│   ├── PosturePreviewPanel.jsx
│   ├── WellnessModals.jsx
│   ├── ExerciseGuideCard.jsx
│   └── CenterModal.jsx
├── data/
│   └── exerciseGuides.js      # 운동 카드 데이터
├── assets/                    # SVG 소스 (빌드 시 public으로 복사)
└── styles/theme.js

electron/
├── main.cjs                   # BrowserWindow, Tray, IPC
├── preload.cjs
├── assets/tray-*.png
└── scripts/make-tray-icons.cjs

public/wellness/               # 런타임 운동 이미지 (SVG)
```

---

## 10. Privacy Requirements

- 카메라 영상 서버 전송 **없음**
- 녹화 **없음**
- 분석은 브라우저/Electron 렌더러 메모리 내에서만 수행
- 설정은 LocalStorage에만 저장

---

## 11. Success Metrics

- 1분 내 기준 자세 저장 완료율
- 트레이 아이콘과 앱 화면 상태 일치율
- 백그라운드 모니터링 중 감지 지속률
- 웰니스 가이드 완료율 (자동 진행 UX)
- 사용자가 "내 자세 보기"로 상태 확인 가능

---

## 12. Release Checklist

- [ ] `desktop.bat` 또는 `npm run desktop` 실행
- [ ] 카메라 권한 허용
- [ ] 기준 자세 저장 → 모니터링 시작
- [ ] 창 닫기 후 트레이 유지 + 감지 지속
- [ ] TOO_CLOSE / SHOULDER_TENSION 알림 (10초 유지)
- [ ] 내 자세 보기 / 기준 자세 다시 저장
- [ ] 웰니스 미리보기 → 시작하기 → 자동 가이드 + 이미지 표시
- [ ] 트레이 아이콘 ↔ 화면 상태 동기화
- [ ] 트레이 메뉴 종료

---

## 13. Project History (PostureGuard → EaseUp)

| 단계 | 내용 |
|------|------|
| Phase 1 | PostureGuard React 웹앱 + PWA |
| Phase 2 | Electron 데스크톱 포장, 트레이, 백그라운드 모니터링 |
| Phase 3 | 트레이/화면 상태 동기화, Orb-only 모드 제거 |
| Phase 4 | **EaseUp 전면 재설계** — 3상태, Face+Pose, 모듈 구조 |
| Phase 5 | 내 자세 보기, 기준 재저장, 어깨 민감도 개선 |
| Phase 6 | 운동 가이드 SVG + 자동 진행 UX |

상세 대화·프롬프트 기록: [docs/CONVERSATION_AND_PROMPTS.md](docs/CONVERSATION_AND_PROMPTS.md)
