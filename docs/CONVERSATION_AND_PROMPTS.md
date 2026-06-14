# EaseUp 개발 대화·프롬프트 사용 내역

> **세션 ID:** `49857033-200f-4d99-80de-6e5a9f35cf1c`  
> **기간:** 2026-06-13 ~ 2026-06-14 (오프라인 강의)  
> **도구:** Cursor Agent (Claude)  
> **원본 트랜스크립트:**  
> `C:\Users\gicon\.cursor\projects\c-ai-test-06-260613\agent-transcripts\49857033-200f-4d99-80de-6e5a9f35cf1c\49857033-200f-4d99-80de-6e5a9f35cf1c.jsonl`

---

## 1. 프로젝트 진화 요약

```
PostureGuard (React 웹/PWA)
    ↓ Electron 포장, 트레이, 백그라운드
    ↓ 트레이/화면 동기화, Orb-only 제거
    ↓ EaseUp 전면 재설계 (3상태, Face+Pose)
    ↓ 내 자세 보기, 어깨 민감도, 웰니스 가이드
    ↓ 운동 SVG + 자동 진행 UX
```

---

## 2. 사용자 프롬프트 타임라인

### Phase A — PostureGuard Electron (초기)

| # | 요청 요약 | 결과 |
|---|-----------|------|
| 1 | React+Vite PostureGuard를 Electron 데스크톱 앱으로 변환 (트레이, alwaysOnTop, 닫기=숨김) | `electron/` scaffold, `npm run desktop` |
| 2 | 창 닫았더니 사라짐 → 다시 확인 가능하게 | 트레이 복구, showWindow |
| 3 | 백그라운드 모니터링 + 트레이 PNG 아이콘 상태 표시 | `backgroundThrottling: false`, tray mood IPC |
| 4 | 앱 실행 시 트레이 자동 생성, X버튼 종료 금지, 트레이에서만 종료 | `isQuitting`, close preventDefault |
| 5 | 트레이 아이콘 사라짐 / 모니터링 후 트레이 소실 | tray 전역 유지, hide 로직 수정 |
| 6 | 트레이 작업표시줄 자동 고정 | Windows 한계 안내 (OS 기능) |
| 7 | 트레이 표정 = 실시간 자세만 (누적 시간 제거) | `getTrayMoodFromCurrentStatus` |
| 8 | Orb-only 모드 제거, 화면·트레이 동기화 | monitoring emoji-only 분기 삭제 |
| 9 | 카메라/기준자세 저장 버튼 비활성 | video ref, calibration fix |
| 10 | displayStatus 단일 소스, 트레이=화면 동일 | `displayStatus.mood` IPC |
| 11 | "모니터링으로 돌아가기" 삭제, 트레이·화면 불일치 | 버튼/모드 완전 제거 |

### Phase B — EaseUp 전면 재설계

| # | 요청 요약 | 결과 |
|---|-----------|------|
| 12 | PostureGuard → **EaseUp** 처음부터 재설계 (3상태, Face+Pose, 30분 웰니스, 트레이) | `src/` 모듈 구조, constants, hooks, components |
| 13 | 트레이 아이콘 다듬기 | `make-tray-icons.cjs` 4종 PNG |

### Phase C — EaseUp 기능 확장

| # | 요청 요약 | 결과 |
|---|-----------|------|
| 14 | 모니터링 중 **내 자세 보기** / **기준 자세 다시 저장** | `PosturePreviewPanel`, `previewMode` |
| 15 | 어깨 긴장 민감도 향상 (높이+지속+귀-어깨 거리) | `evaluateShoulderTension`, 디버그 표시 |
| 16 | 30분 웰니스 **미리보기** (테스트용) | 웰니스 미리보기 버튼, `isPreview` |
| 17 | 운동 이미지·설명 일치, 단계별 SVG 카드 | `exerciseGuides.js`, `public/wellness/` |
| 18 | 이미지 미표시 + 클릭 과다 → **시작하기 1번 자동 진행** | public SVG 경로, auto-advance timer |
| 19 | **prd.md, README.md 업데이트 + 대화/프롬프트 저장** | 본 문서 포함 |

---

## 3. 주요 사용자 프롬프트 (원문 요지)

### 3.1 Electron 변환 (초기)

> React + Vite PostureGuard를 Windows 데스크톱 앱처럼 Electron으로 변환. 트레이, alwaysOnTop, 닫기=숨김, 기존 기능 유지.

### 3.2 백그라운드 모니터링

> SketchUp, AutoCAD, Chrome 사용 중에도 백그라운드 감지, 트레이 아이콘으로 상태 표시. MediaPipe·Orb·눈 휴식·스트레칭 유지.

### 3.3 EaseUp 재설계 (핵심 PRD 프롬프트)

> 프로젝트명 EaseUp. 3상태(GOOD/TOO_CLOSE/SHOULDER_TENSION). Face Mesh + Pose 교차. 30분 웰니스. 트레이 4종. 중앙 모달. 절전 모드. 데스크톱 전용.

### 3.4 내 자세 보기

> 기준 저장 후 카메라 숨김 → 확인 불가 문제. **내 자세 보기**, **기준 자세 다시 저장** 버튼. 필요할 때만 프리뷰. 감지는 계속.

### 3.5 어깨 민감도

> 어깨 높이 3~5% + 10초 유지, 8% + 5초 즉시. 귀-어깨 거리 감소. 디버그: 높이 변화%, 거리 변화%, 지속 시간.

### 3.6 운동 가이드

> 랜덤/일반 이미지 금지. 운동별 고정 SVG/GIF. STEP 1/2/3 + 설명. Headspace/Apple Fitness 스타일. 이름·이미지 일치.

### 3.7 UX 개선 (최근)

> 이미지 안 나옴 수정. 다음단계/다음운동 클릭 과다 → **시작하기 1번으로 천천히 자동 진행**.

### 3.8 문서화 (현재)

> prd.md, README.md 업데이트 + 대화내용·프롬프트 사용내역 저장.

---

## 4. 구현 결과물 매핑

| 사용자 요구 | 구현 파일/기능 |
|-------------|----------------|
| Electron 트레이 | `electron/main.cjs`, `preload.cjs` |
| 3상태 감지 | `wellnessState.js`, `constants.js` |
| Face/Pose 교차 | `useDetectionLoop.js`, detectors |
| 내 자세 보기 | `PosturePreviewPanel.jsx`, `App.jsx` previewMode |
| 어깨 지속 판정 | `evaluateShoulderTension()` |
| 웰니스 30분 | `useWellnessRoutine.js` |
| 운동 자동 가이드 | `WellnessModals.jsx`, `ExerciseGuideCard.jsx` |
| 운동 SVG | `public/wellness/`, `exerciseGuides.js` |
| 웰니스 미리보기 | `App.jsx` openWellnessPreview |
| 트레이 PNG | `electron/assets/tray-*.png` |

---

## 5. Agent / 프롬프트 사용 패턴

### 사용된 Cursor 기능

- **Agent Mode** — 코드 작성, Electron 설정, React UI
- **Shell** — `npm run build`, `desktop.bat`, SVG 복사 스크립트
- **Grep / Read / SemanticSearch** — 코드베이스 탐색
- **Task (explore subagent)** — 초기 EaseUp 구조 탐색 (Phase B)
- **Conversation handoff** — 긴 세션 요약 후 이어서 작업 (Phase C)

### 프롬프트 작성 특징 (효과적이었던 형식)

1. **문제 → 목표 → 상세 요구사항** 구조 (번호·화살표 플로우)
2. **유지할 것 / 금지할 것** 명시 ("기존 기능 유지", "Orb-only 제거")
3. **UI 텍스트·임계값·메시지** 구체적 예시
4. **UX·성능** 별도 섹션
5. **최종 목표** 한 줄 요약

### 반복 이슈 & 해결

| 이슈 | 원인 | 해결 |
|------|------|------|
| 트레이 아이콘 소실 | tray GC, quit on close | 전역 tray, preventDefault |
| 화면≠트레이 표정 | 별도 mood 계산 | 단일 status → tray IPC |
| 카메라/저장 불가 | video ref, HMR | streamRef, setVideoElement |
| 운동 이미지 blank | Vite base64 + SVG 인코딩 | public/wellness/ 경로 |
| 클릭 과다 | 수동 step navigation | auto-advance timer |

---

## 6. 삭제·의도적 미구현 (Non-Goals)

PostureGuard 시절 기능 중 **EaseUp에서 제거**된 항목:

- Orb-only / emoji-only 모니터링 화면
- "모니터링으로 돌아가기" 버튼
- 자세 점수·게이미화·goodPostureTime 기반 트레이 표정
- 토스트 알림 (→ 중앙 모달)
- PWA / Service Worker (데스크톱 Electron 전용)
- 8종+ 복잡 자세 상태 (→ 3상태)

---

## 7. 현재 알려진 제한

- Windows 작업표시줄 트레이 **자동 고정**은 OS 기능 (앱에서 강제 불가)
- 포트 5173 점유 시 Vite dev server 실패 → `desktop.bat` 정리 또는 프로세스 종료
- 구 baseline에 `earShoulderDistance` 없으면 귀-어깨 지표 비활성 → **기준 자세 다시 저장** 필요
- SVG 운동 일러스트는 텍스트 없는 그림 위주 (설명은 UI 텍스트)

---

## 8. 후속 작업 제안 (미요청)

- `DEPLOYMENT_CHECKLIST.md` EaseUp 기준 갱신
- 어깨 임계값 사용자 설정 UI
- 운동 GIF 교체 (public/wellness/)
- macOS Electron 빌드

---

## 9. 관련 파일

| 파일 | 설명 |
|------|------|
| [prd.md](../prd.md) | 제품 요구사항 문서 |
| [README.md](../README.md) | 설치·실행·구조 |
| [DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md) | 배포 체크 (구 PostureGuard) |

---

*본 문서는 Cursor Agent 세션 요약 및 사용자 프롬프트를 바탕으로 작성되었습니다. 원문 대화는 위 트랜스크립트 JSONL 파일에서 확인할 수 있습니다.*
