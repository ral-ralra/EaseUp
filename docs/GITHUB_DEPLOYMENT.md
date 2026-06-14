# EaseUp GitHub 업로드 및 배포 가이드

## 저장소 정보

| 항목 | 값 |
|------|-----|
| GitHub | https://github.com/ral-ralra/PostureGuard |
| 브랜치 | `main` |
| 제품명 | EaseUp (구 PostureGuard) |

> 저장소 이름을 `EaseUp`으로 바꾸려면 GitHub → Settings → General → Repository name에서 변경 후 remote URL을 갱신하세요.

---

## 1. GitHub에 코드 업로드

### 최초 / 전체 업로드

```bash
git add .
git status
git commit -m "EaseUp v1.0: Electron desktop wellness app"
git push origin main
```

### 이후 변경 업로드

```bash
git add -A
git commit -m "변경 내용 요약"
git push origin main
```

---

## 2. GitHub Actions (자동 CI)

`main` push 또는 PR 시 **Windows CI**가 실행됩니다.

**워크플로:** `.github/workflows/ci.yml`

1. `npm ci`
2. tray PNG 생성
3. `npm run build`
4. `dist/` 아티팩트 업로드

**확인:** GitHub → Actions → CI → 최근 run 녹색 체크

---

## 3. 릴리스 배포 (ZIP)

버전 태그를 push하면 데스크톱 실행 패키지 ZIP이 GitHub Release에 올라갑니다.

```bash
git tag v1.0.0
git push origin v1.0.0
```

**워크플로:** `.github/workflows/release.yml`

**포함 내용:** `dist/`, `electron/`, `src/`, `public/`, `scripts/`, `desktop.bat`, `package.json` 등

### 사용자 설치 (Release ZIP)

1. GitHub Releases에서 `EaseUp-desktop.zip` 다운로드
2. 압축 해제
3. 폴더에서:

```bat
npm install
desktop.bat
```

---

## 4. 로컬 배포 (개발자 PC)

### 개발 모드

```bat
desktop.bat
```

또는:

```bash
npm install
npm run desktop
```

### 프로덕션 모드 (빌드 후 Electron)

```bash
npm run electron:build
```

- `dist/` 빌드 + Electron이 로컬 `dist/index.html` 로드
- Vite dev server 불필요

---

## 5. 배포 전 체크

[DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md) 항목을 순서대로 확인하세요.

---

## 6. .gitignore

다음은 커밋하지 않습니다:

- `node_modules/`
- `dist/` (CI에서 매번 빌드)
- `.env*`

`public/wellness/` SVG는 **커밋 포함** (런타임 에셋)

---

## 7. 트러블슈팅

| 문제 | 해결 |
|------|------|
| CI build 실패 | Actions 로그 → `npm ci` / `npm run build` 오류 확인 |
| 포트 5173 사용 중 | `desktop.bat` 실행 또는 해당 PID 종료 |
| 운동 이미지 안 보임 | `node scripts/copy-wellness-assets.cjs` 후 재빌드 |
| 트레이 아이콘 깨짐 | `node electron/scripts/make-tray-icons.cjs` |

---

## 8. 관련 문서

- [README.md](../README.md) — 프로젝트 개요
- [prd.md](../prd.md) — 제품 요구사항
- [CONVERSATION_AND_PROMPTS.md](./CONVERSATION_AND_PROMPTS.md) — 개발 이력
