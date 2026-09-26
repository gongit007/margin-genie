# 마진지니 (Margin Genie)

온라인 판매자가 **팔기 전에** 공헌이익·실마진·손익분기·채널 비교를 보는 수익성 엔진입니다.
숫자는 React가 아니라 `src/engine`이 계산합니다.

## 실행

```bash
npm install
npm test
npm run dev
```

개발 서버: http://localhost:5174

## 원칙

- AI/화면은 계산하지 않음
- 수수료는 채널 정책 객체 (기준일·출처·VERIFIED/ESTIMATED/USER_DEFINED)
- 결과는 회계상 순이익이 아니라 **공헌이익**
- 스마트스토어는 판매수수료와 Npay를 분리

공사주(사주) 앱과 별도 폴더입니다.
