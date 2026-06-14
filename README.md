# EaseUp

**조금 더 편하게 일하자**

EaseUp은 Windows 데스크톱용 AI 웰니스 코치입니다. 웹캠과 MediaPipe로 화면 거리·어깨 긴장을 조용히 감지하고, 30분마다 눈 운동과 스트레칭을 안내합니다. 카메라 영상은 PC 내부에서만 처리되며 외부로 전송되지 않습니다.

> 이 프로젝트는 PostureGuard에서 EaseUp으로 전면 재설계되었습니다.

---

## 주요 기능

### 자세·웰니스 감지 (3상태)

| 상태 | 설명 |
|------|------|
| GOOD | 좋은 자세 유지 중 |
| TOO_CLOSE | 화면과 너무 가까움 (눈 피로) |
| SHOULDER_TENSION | 어깨 긴장 (높이 + 귀-어깨 거리, 지속 시간) |

### 데스크톱·트레이

- Electron 트레이 아이콘으로 실시간 상태 표시
- 창 닫기 → 트레이로 숨김 (백그라운드 감지 유지)
- 다른 앱 사용 중에도 모니터링 계속

### 모니터링 중 확인

- **내 자세 보기** — 상태·거리·어깨·디버그 수치·카메라 프리뷰
- **기준 자세 다시 저장** — 재측정 후 자동 숨김
- 평소에는 카메라 프리뷰 숨김 (성능)

### 웰니스 루틴

- 30분마다 눈 운동 ↔ 스트레칭 교차
- **시작하기 1번** → 단계별 자동 진행 (클릭 최소화)
- 운동별 전용 SVG 가이드 이미지
- **웰니스 미리보기** — 30분 대기 없이 테스트

---

## 빠른 시작

### 사전 요구

- Node.js 18+
- Windows 10/11
- 웹캠

### 설치 및 실행

```bat
npm install
desktop.bat
```

또는:

```bash
npm install
npm run desktop
```

- Vite dev server: `http://127.0.0.1:5173`
- Electron 창이 자동으로 열립니다

### 프로덕션 빌드 + Electron

```bash
npm run electron:build
```

---

## 사용 방법

1. 앱 실행 → 카메라 권한 허용
2. **기준 자세 저장** — 얼굴과 어깨가 보이도록 앉기
3. **모니터링 시작** — 카메라 프리뷰 숨김, 트레이에서 상태 확인
4. 필요 시 **내 자세 보기** / **기준 자세 다시 저장**
5. 창 닫기 → 트레이에 남음 (감지 계속)
6. 완전 종료 → 트레이 아이콘 우클릭 → **종료**

### 웰니스 테스트

대시보드 하단 **웰니스 미리보기**:
- **눈 운동 확인** / **스트레칭 확인**
- **시작하기** 한 번 → 자동으로 단계 진행

---

## npm Scripts

| 명령 | 설명 |
|------|------|
| `npm run dev` | Vite 개발 서버 (wellness SVG 복사 포함) |
| `npm run build` | 프로덕션 빌드 (`public/wellness/` → `dist/`) |
| `npm run desktop` | Vite + Electron 동시 실행 |
| `npm run electron:build` | 빌드 후 Electron 프로덕션 실행 |

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Desktop | Electron 35 |
| UI | React 19, Vite 8 |
| AI | MediaPipe Face Mesh + Pose (CDN) |
| 저장 | LocalStorage |
| 스타일 | 인라인 theme (`src/styles/theme.js`) |

---

## 프로젝트 구조

```
├── src/                 # React 앱
├── electron/            # Electron main, preload, 트레이 PNG
├── public/wellness/       # 운동 가이드 SVG (런타임)
├── scripts/               # wellness SVG 복사 스크립트
├── docs/                  # 대화·프롬프트 기록
├── prd.md                 # 제품 요구사항 문서
├── desktop.bat            # Windows 실행 배치
└── README.md
```

---

## 감지 임계값 조정

`src/state/constants.js`:

```javascript
TOO_CLOSE_RATIO = 1.175
SHOULDER_HEIGHT_RISE_MILD_PCT = 1.5
SHOULDER_HEIGHT_RISE_STRONG_PCT = 2.5
EAR_SHOULDER_DISTANCE_DECREASE_MILD_PCT = 1.5
SHOULDER_TENSION_HOLD_MS = 10_000
SHOULDER_TENSION_STRONG_HOLD_MS = 5_000
```

---

## 운동 가이드 이미지

- **소스:** `src/assets/eye-exercise/`, `src/assets/stretching/`
- **런타임:** `public/wellness/` (빌드/dev 시 자동 복사)
- **데이터:** `src/data/exerciseGuides.js`
- GIF로 교체 시 `exerciseGuides.js`의 경로만 수정

트레이 아이콘 재생성:

```bash
node electron/scripts/make-tray-icons.cjs
```

---

## 개인정보

- 카메라 영상은 외부 서버로 전송되지 않습니다
- 영상은 녹화·저장되지 않습니다
- 설정은 브라우저 LocalStorage에만 저장됩니다

---

## GitHub · 배포

| 항목 | 링크 |
|------|------|
| 저장소 | https://github.com/ral-ralra/PostureGuard |
| CI | push/PR 시 Windows 빌드 (`.github/workflows/ci.yml`) |
| Release | `v*` 태그 push → ZIP 릴리스 (`.github/workflows/release.yml`) |

상세: [docs/GITHUB_DEPLOYMENT.md](docs/GITHUB_DEPLOYMENT.md) · [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

### GitHub 업로드

```bash
git add -A
git commit -m "변경 내용 요약"
git push origin main
```

### 릴리스

```bash
git tag v1.0.0
git push origin v1.0.0
```

---

| 파일 | 내용 |
|------|------|
| [prd.md](prd.md) | 제품 요구사항 (PRD) |
| [docs/CONVERSATION_AND_PROMPTS.md](docs/CONVERSATION_AND_PROMPTS.md) | 개발 대화·프롬프트 사용 내역 |
| [docs/GITHUB_DEPLOYMENT.md](docs/GITHUB_DEPLOYMENT.md) | GitHub 업로드·CI·릴리스 |
| [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) | 배포 전 체크리스트 |

---

## 라이선스

Private project (오프라인 강의용)
