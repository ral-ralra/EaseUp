# PostureGuard

PostureGuard는 웹캠과 MediaPipe Face Mesh를 활용해 브라우저 내부에서 자세, 눈 피로, 휴식 루틴을 도와주는 AI 건강 코치 웹앱입니다.

## 주요 기능

- 웹캠 기반 On-Device 자세 감지
- 기준 자세 저장 및 실시간 모니터링
- 건강 코치 Orb 상태 표시
- 오늘의 자세 점수와 통계
- 20-20-20 눈 휴식 알림
- 1시간 간격 앉은 자세 스트레칭 안내
- LocalStorage 기반 일일 기록 저장
- PWA 설치 및 기본 오프라인 지원

## 사용 방법

1. HTTPS 주소 또는 localhost에서 앱을 엽니다.
2. 카메라 권한을 허용합니다.
3. 카메라를 보며 바른 자세를 맞춘 뒤 `기준 자세 저장`을 누릅니다.
4. `모니터링 시작`을 누르면 작은 건강 코치 Orb만 남습니다.
5. Orb를 클릭하면 preview 화면에서 통계와 설정을 확인할 수 있습니다.

## 기술 스택

- React
- Vite
- MediaPipe Face Mesh
- Web Camera API
- Web Audio API
- LocalStorage
- Service Worker / Web App Manifest

## 개인정보 보호

카메라 영상은 외부 서버로 전송되지 않으며 브라우저 내부 메모리에서만 처리됩니다. 통계와 설정 데이터는 사용자의 브라우저 LocalStorage에 저장됩니다.

## 배포 주소

- Production URL: `배포 후 이곳에 URL을 입력하세요`

## 로컬 실행

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
```
