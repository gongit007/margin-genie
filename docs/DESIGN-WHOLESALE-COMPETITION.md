# 도매 경쟁가 탭 — 설계

**버전:** 1.0 · **상태:** Step 3 구현 중

## 목표

도매매·도매꾹·도매토피아에서 **같은 상품을 파는 다른 셀러**의 Listing을 검색·표시하고,  
**최저 도매가**를 마진 계산기(`productCost`)에 넘긴다.

## 사용자 Journey

```text
1. 도매매 상품번호 입력 (앵커)
2. 공급 정보 카드 확인
3. 「경쟁 셀러 검색」 → 3개 도매처 후보 Listing
4. 행 클릭 → 상품 상세 페이지 (새 탭)
5. 「이 도매가로 마진 보기」→ /#calculator + productCost 프리필
```

## 화면 구조 (`/intelligence`)

| 탭 | 내용 |
|---|---|
| **도매 경쟁가** | 공급 카드 + 검색 + 3플랫폼 테이블 + 마진 연동 |
| 소매 6마켓 | (후속) 스마트스토어·쿠팡 등 |

## 테이블 컬럼 (도매)

| 컬럼 | 설명 |
|---|---|
| 도매처 | 도매매 / 도매꾹 / 도매토피아 |
| 등록 | 발견 / 수동 / 미발견 |
| 동일상품 판정 | EXACT … UNKNOWN + Evidence |
| 판매자 | 상호 |
| 상품명 | Listing 제목 |
| 도매가 | 판매가 |
| 배송 | 배송비 |
| 실효가 | 도매가 + 배송 |
| 상세 | 링크 → 셀러 상품 페이지 |

## 데이터 (Adapter 전)

- **Stub:** `63253617` (터치라이프 T45) + 검색어 `T45 10개`
- **실 연동:** 플랫폼별 `WholesaleAdapter.search()` · `getListing()`

## 마진 연동

```text
competitor_min (EXACT_MATCH) → MarginInput.productCost
→ /#s={encoded} 또는 /#calculator 직접 이동
```

## 검색 전략 (실 Adapter)

1. Product DNA → model / quantity / brand  
2. 플랫폼 검색 API 또는 공개 검색 URL  
3. 후보 N건 → Matching Engine  
4. EXACT / PROBABLE만 경쟁가 집계  
