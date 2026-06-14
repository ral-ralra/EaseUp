# EaseUp 배포 전 체크리스트

> Windows Electron 데스크톱 앱 (EaseUp v1.0)  
> 구 PostureGuard PWA 체크리스트는 Electron 전용으로 대체됨

---

## GitHub / CI

- [ ] `main` 브랜치 push 시 GitHub Actions CI 빌드 성공
- [ ] `npm ci` → tray icons → `npm run build` 통과
- [ ] Actions 탭에서 `easeup-dist` 아티팩트 생성 확인
- [ ] (선택) `v1.0.0` 태그 push → Release ZIP 생성

---

## 로컬 개발 실행

- [ ] `npm install` 완료
- [ ] `desktop.bat` 또는 `npm run desktop` 실행
- [ ] Vite `127.0.0.1:5173` + Electron 창 정상 오픈
- [ ] 포트 5173 충돌 시 `desktop.bat`이 정리하는지 확인

---

## 프로덕션 실행 (로컬)

- [ ] `npm run electron:build` 성공
- [ ] `dist/index.html` + `dist/wellness/` 포함 확인
- [ ] Electron이 `dist/index.html` 로드 (dev server 없이)
- [ ] 카메라 권한 허용

---

## Electron / 트레이

- [ ] 앱 시작 시 트레이 아이콘 자동 생성 (`tray-idle.png`)
- [ ] 창 X 클릭 → 종료 아님, 트레이로 숨김
- [ ] 트레이 더블클릭 → 창 다시 표시
- [ ] 트레이 메뉴 **종료** → 앱 완전 종료
- [ ] 모니터링 중 창 숨김 → 감지 계속 (`backgroundThrottling: false`)

---

## 트레이 아이콘 ↔ 화면 상태

- [ ] GOOD → `tray-good.png` 😊
- [ ] TOO_CLOSE → `tray-too-close.png` 👀
- [ ] SHOULDER_TENSION → `tray-shoulder.png` 😣
- [ ] 대기/중지 → `tray-idle.png` ⚪
- [ ] 앱 화면 문구와 트레이 tooltip 일치

---

## 카메라 / 기준 자세

- [ ] 카메라 권한 허용 시 setup 프리뷰 표시
- [ ] **기준 자세 저장** → 얼굴+어깨 baseline 저장
- [ ] **모니터링 시작** → 프리뷰 숨김, 트레이만
- [ ] **내 자세 보기** → 패널 + 디버그 수치 + 프리뷰
- [ ] **기준 자세 다시 저장** → 재측정 + 성공 모달
- [ ] 패널 닫기 → 프리뷰 숨김, 감지 유지

---

## 자세 감지

- [ ] TOO_CLOSE: 화면 가까워질 때 10초 후 중앙 모달
- [ ] SHOULDER_TENSION: 어깨 긴장 지속 시 알림
- [ ] 동일 상태 10분 쿨다운
- [ ] **경고음 끄기** 옵션 동작
- [ ] **절전 모드** (2.5초 주기) 동작

---

## 웰니스 루틴

- [ ] 30분 알림 (눈 ↔ 스트레칭 교차)
- [ ] **시작하기** 1회 → 단계 자동 진행
- [ ] `public/wellness/` SVG 이미지 표시
- [ ] **웰니스 미리보기** (눈/스트레칭) 테스트
- [ ] 10분 뒤 알림 / 오늘은 끄기

---

## 배포 후 사용자 안내

- [ ] README.md 설치·실행 방법 최신
- [ ] Node.js 18+ 필요 안내
- [ ] 웹캠 필요 안내
- [ ] 카메라 영상 미전송 개인정보 안내

---

## (선택) GitHub 저장소 이름

현재 remote: `ral-ralra/PostureGuard`  
EaseUp으로 통일하려면 GitHub Settings → Repository name → `EaseUp` 변경 후:

```bash
git remote set-url origin https://github.com/ral-ralra/EaseUp.git
```
