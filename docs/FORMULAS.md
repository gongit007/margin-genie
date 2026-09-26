# 마진지니 계산 공식 V1.0

엔진 버전: `margin-engine@1.0.0`

모든 금액은 원 단위 반올림.

## 실매출

```
sellerDiscount = listPrice × discountRate
sellerCoupon   = couponAmount   (부담 주체가 SELLER일 때만)
netSales       = listPrice − sellerDiscount − sellerCoupon
```

## 변동비

```
salesFee     = netSales × salesFeeRate + fixedFee
paymentFee   = netSales × paymentFeeRate
advertising  = 개당 고정 | netSales × 광고비율 | 월광고 / 예상판매량
returnCost   = returnRate × (returnShipping + productCost × discardRate)
sellerShip   = 고객부담이면 0, 아니면 shippingCost

variableCost = product + packaging + sellerShip + fees + ads + return + other
contribution = netSales − variableCost
marginRate   = contribution / netSales
```

## 역산 판매가

할인율 `d`, 수수료합 `f`, 광고비율 `a`, 목표마진 `m` (손익분기는 m=0):

```
listPrice = (고정변동비 + 목표개당이익 + 쿠폰보정) / ((1−d)×(1−f−a−m))
```

고정변동비 = 원가+포장+판매자배송+기타+예상반품+수수료정액+고정형광고

## 손익분기 ROAS

광고 전 공헌이익 / 실매출 = m_ad.  `BEP ROAS = 1 / m_ad` (배).

## 용어

화면에 **공헌이익**으로 표기. 고정비·세금 신고액과 혼동하지 않음.
