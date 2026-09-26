# 마진지니 (Margin Genie)

온라인 판매자가 **팔기 전에** 공헌이익·실마진·손익분기·채널 비교를 보는 수익성 엔진입니다.
숫자는 React가 아니라 `src/engine`이 계산합니다.

## 실행

```bash
npm install
npm test
npm run test:e2e
npm run dev
```

개발 서버: http://localhost:5174

PWA 오프라인 캐시는 프로덕션 빌드(`npm run build && npm run preview`)에서 service worker가 등록됩니다.

## CI

GitHub Actions에서 `npm test`, `npm run build`, `npm run test:e2e`를 실행합니다.

## 배포 (Vercel)

1. [vercel.com](https://vercel.com)에서 이 저장소를 Import
2. Framework Preset: **Vite** (자동 감지)
3. Build Command: `npm run build` · Output: `dist`
4. Deploy

로컬에서 프로덕션 빌드 확인:

```bash
npm run build
npm run preview
```

`vercel.json`에 SPA 라우팅 설정이 포함되어 있습니다.

## 원칙

- AI/화면은 계산하지 않음
- 수수료는 채널 정책 객체 (기준일·출처·VERIFIED/ESTIMATED/USER_DEFINED)
- 결과는 회계상 순이익이 아니라 **공헌이익**
- 스마트스토어는 판매수수료와 Npay를 분리

공사주(사주) 앱과 별도 폴더입니다.
