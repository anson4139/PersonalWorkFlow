# Finance 題庫與完整解題過程

> 內容包含：題目、選項、正確答案、解題過程。

---

## 1. Future Value

**題目：**  
If you invest $500 today, what is the future value you will earn in twenty years? Assume the interest rate is 8%.

**選項：**  
(a) 734.66.  
(b) 1680.24.  
(c) 2,480.32.  
(d) 2,330.48.

**答案：d. 2,330.48**

**解題過程：**

公式：

```math
FV = PV(1+r)^n
```

代入：

```math
FV = 500(1+0.08)^{20}
```

```math
FV = 500(1.08)^{20} = 2,330.48
```

---

## 2. Interest on Interest 利息的利息

**題目：**  
If you invest $500 today, what is the interest on interest (利息的利息) you will earn in twenty years? Assume the interest rate is 8%.

**選項：**  
(a) 680.24.  
(b) 1,030.48.  
(c) 1480.32.  
(d) 225.47.

**答案：b. 1,030.48**

**解題過程：**

第 1 題的未來值：

```math
FV = 2,330.48
```

總利息：

```math
2,330.48 - 500 = 1,830.48
```

單利利息：

```math
500 \times 8\% \times 20 = 800
```

利息的利息：

```math
1,830.48 - 800 = 1,030.48
```

---

## 3. 存到 8,000,000 要多久

**題目：**  
If you are saving up (存錢) to buy a house for $8,000,000, and you have $1,000,000 today. The rate of return (報酬率, 機會成本) on your money is 6%. How long will you have to wait (必須等多久)?

**選項：**  
(a) 35.69.  
(b) 116.67.  
(c) 13.33.  
(d) 11.11.

**答案：a. 35.69**

**解題過程：**

公式：

```math
FV = PV(1+r)^n
```

代入：

```math
8,000,000 = 1,000,000(1.06)^n
```

```math
8 = (1.06)^n
```

取自然對數：

```math
n = \frac{\ln 8}{\ln 1.06}
```

```math
n = 35.69
```

---

## 4. 10 年翻倍的報酬率

**題目：**  
If an investment promises to double your money in 10 years (此項投資保證你可以在10年內將原始投資金額變成兩倍), what is the approximate rate of return on the investment?

**選項：**  
(a) 13.89%.  
(b) 7.18%.  
(c) 8.02%.  
(d) 20%.

**答案：b. 7.18%**

**解題過程：**

公式：

```math
2 = (1+r)^{10}
```

```math
r = 2^{1/10} - 1
```

```math
r = 0.0718 = 7.18\%
```

---

## 5. 永續年金現值

**題目：**  
What is the present value of the investment that promised to pay $600 at the end of each year and the cash flow continues forever (每年$600持續到永久)? Assume that the interest rate is 7%.

**選項：**  
(a) 4,200.  
(b) 11,666.67.  
(c) 8,571.43.  
(d) 12,000.

**答案：c. 8,571.43**

**解題過程：**

永續年金公式：

```math
PV = \frac{C}{r}
```

代入：

```math
PV = \frac{600}{0.07}
```

```math
PV = 8,571.43
```

---

## 6. 年金隱含利率

**題目：**  
Suppose we were examining (檢視) an asset that promised to pay $600 at the end of each of the next five years. If we offer $2200 for this annuity today (這項年金投資今天必須花費$2200), what is the implicit (隱含) interest rate?

**選項：**  
(a) 3.67%.  
(b) 11.32%.  
(c) 27.27%.  
(d) 36.36%.

**答案：b. 11.32%**

**解題過程：**

題目給：

```math
PV = 2,200
```

```math
C = 600
```

```math
n = 5
```

年金現值公式：

```math
PV = C \times \frac{1-(1+r)^{-n}}{r}
```

代入：

```math
2,200 = 600 \times \frac{1-(1+r)^{-5}}{r}
```

解出：

```math
r \approx 11.32\%
```

---

## 7. Bond Yield to Maturity

**題目：**  
Suppose you are considering buying (考慮購買) a bond with 10 years to maturity. The coupon rate (票面利率) of the bond is 8%, and the principal (本金) is $1,000. It sells for $900 (今天要付$900購買). What is the yield to maturity of this bond?

**選項：**  
(a) 1.06%.  
(b) 9.60%  
(c) 8%.  
(d) 9%.

**答案：b. 9.60%**

**解題過程：**

債券價格公式：

```math
P = C \times \frac{1-(1+y)^{-n}}{y} + \frac{F}{(1+y)^n}
```

題目給：

```math
P = 900
```

```math
C = 1,000 \times 8\% = 80
```

```math
F = 1,000
```

```math
n = 10
```

代入：

```math
900 = 80 \times \frac{1-(1+y)^{-10}}{y} + \frac{1,000}{(1+y)^{10}}
```

解出：

```math
y \approx 9.60\%
```

---

## 8. 8% 票息債券，市場殖利率 9%，應付多少

**題目：**  
Suppose you are considering buying a bond with 10 years to maturity. The coupon rate of the bond is 8%, and the principal is $1,000. The yield to maturity of a similar bond is 9%. How much do you want to pay for this 8% coupon rate bond?

**選項：**  
(a) 935.82  
(b) 422.41  
(c) 473.75.  
(d) 1067.10.

**答案：a. 935.82**

**解題過程：**

公式：

```math
P = C \times \frac{1-(1+y)^{-n}}{y} + \frac{F}{(1+y)^n}
```

代入：

```math
C = 80
```

```math
y = 9\%
```

```math
n = 10
```

```math
F = 1,000
```

```math
P = 80 \times \frac{1-(1.09)^{-10}}{0.09} + \frac{1,000}{(1.09)^{10}}
```

```math
P = 935.82
```

---

## 9. 哪個投資年化報酬率最高

**題目：**  
Which of the following investments offers the highest annualized rate of return? (Comparing the rate)

**選項：**  
(a) You invest $400 today at 10% compoundingly.  
(b) You will get $580 in two years if you invest $500 today.  
(c) You will get $1000 in three years if you invest $800 today.  
(d) You will get $850 in three years if you invest $600.

**答案：d. You will get $850 in three years if you invest $600.**

**解題過程：**

a：

```math
r = 10\%
```

b：

```math
r = \left(\frac{580}{500}\right)^{1/2}-1
```

```math
r = 7.70\%
```

c：

```math
r = \left(\frac{1000}{800}\right)^{1/3}-1
```

```math
r = 7.72\%
```

d：

```math
r = \left(\frac{850}{600}\right)^{1/3}-1
```

```math
r = 12.31\%
```

最高的是 d。

---

## 10. 債券價格高於面額時，YTM 與票面利率關係

**題目：**  
You are considering the purchase of a bond with a par value of $1,000 and a coupon rate of 8%. The bond is currently priced at $1,100. Which of the following statements is true about the relationship between the bond’s price and its yield to maturity?

**選項：**  
(a) The bond’s YTM is equal to the coupon rate.  
(b) The bond’s YTM is higher than 8%.  
(c) The bond’s YTM is lower than 8%.  
(d) The bond’s YTM is higher than the coupon rate because it is priced at a premium.

**答案：c. The bond’s YTM is lower than 8%.**

**解題過程：**

債券面額：

```math
1,000
```

目前價格：

```math
1,100
```

票面利率：

```math
8\%
```

當債券價格高於面額，稱為 premium bond。

Premium bond 的特性：

```math
YTM < Coupon\ Rate
```

所以：

```math
YTM < 8\%
```

---

## 11. 貨幣時間價值何者錯誤

**題目：**  
Which of the following statements about the time value of money is incorrect?

**選項：**  
(a) A dollar in hand today is worth more than a dollar promised at some time in the future.  
(b) The trade-off between money now and money later depends on the rate you can earn by investing.  
(c) Future value is the cash value of an investment at some time in the future.  
(d) For a given time period, the lower the interest rate, the larger the future value.

**答案：d. For a given time period, the lower the interest rate, the larger the future value.**

**解題過程：**

錯在 d。

未來值公式：

```math
FV = PV(1+r)^n
```

利率越高，未來值越大。

所以正確觀念應該是：

```math
higher\ interest\ rate \Rightarrow larger\ future\ value
```

---

## 12. 何者不是資本預算本質

**題目：**  
Which of the following is not the essence of capital budgeting?

**選項：**  
(a) Size of future cash flows.  
(b) Timing of future cash flows.  
(c) How to raise capital.  
(d) Risk of future cash flows.

**答案：c. How to raise capital.**

**解題過程：**

資本預算主要評估投資專案是否值得做，核心包含：

- 現金流大小
- 現金流時間
- 現金流風險

「如何籌資」屬於融資決策，不是資本預算的核心。

---

## 13. 哪種債券利率風險較高

**題目：**  
Which bond suffers from greater interest rate risk?

**選項：**  
(a) bonds with a lower coupon rate.  
(b) bonds with a higher coupon rate.  
(c) bonds with a shorter maturity.  
(d) bonds with a smaller principal.

**答案：a. bonds with a lower coupon rate.**

**解題過程：**

利率風險較高的債券通常具有：

- 低票面利率
- 長到期期間

因為低票息債券的現金流較集中在未來本金償還，對折現率變動更敏感。

---

## 14. Agency Problem 的主要原因

**題目：**  
What is the main cause of the agency problem?

**選項：**  
(a) The ownership of a corporation can be readily transferred.  
(b) the shareholders in a corporation have limited liability for debts.  
(c) the financial manager attempts to maximize the market value of the existing stock.  
(d) the dispersion of ownership for a corporation.

**答案：d. the dispersion of ownership for a corporation.**

**解題過程：**

代理問題來自於：

```math
所有權與經營權分離
```

當股東眾多且分散時，經理人可能追求自身利益，而不一定完全追求股東利益最大化。

---

## 15. 獨資與合夥為何成長常受限制

**題目：**  
Why is the ability of sole proprietorships and partnerships to grow often limited?

**選項：**  
(a) the owners have unlimited liabilities.  
(b) the ownership can be transferred.  
(c) the stockholders can elect the board of directors.  
(d) The managers control the corporation.

**答案：a. the owners have unlimited liabilities.**

**解題過程：**

獨資與合夥企業的問題：

```math
業主負無限責任
```

因此籌資能力有限，企業規模成長容易受限制。

---

## 16. 貸款類型何者正確

**題目：**  
Which of the following statements about loan types is correct?

**選項：**  
(a) In a pure discount loan, the borrower pays equal total payments every period.  
(b) In an interest-only loan, the borrower repays (償付) part of the principal (本金) every period.  
(c) In an amortized loan with fixed payments, the interest portion declines over time and the principal portion rises over time.  
(d) In an amortized loan, the ending loan balance (餘額) always stays the same.

**答案：c. In an amortized loan with fixed payments, the interest portion declines over time and the principal portion rises over time.**

**解題過程：**

固定本息攤還貸款中，每期總付款固定。

一開始本金餘額高，因此利息占比高。

隨著本金逐漸償還：

```math
利息部分下降
```

```math
本金部分上升
```

所以 c 正確。

---

## 17. 哪家銀行 EAR 較高

**題目：**  
Two banks offer different interest rates on savings accounts. Bank A offers an interest rate of 6% compounded quarterly, while Bank B offers an interest rate of 5.9% compounded monthly. Which bank provides the higher Effective Annual Rate (EAR)?

**選項：**  
(a) Bank A.  
(b) Bank B.  
(c) Both banks provide the same EAR.  
(d) It depends on the principal amount invested.

**答案：a. Bank A.**

**解題過程：**

EAR 公式：

```math
EAR = \left(1+\frac{APR}{m}\right)^m - 1
```

Bank A：

```math
EAR_A = \left(1+\frac{0.06}{4}\right)^4 - 1
```

```math
EAR_A = 6.136\%
```

Bank B：

```math
EAR_B = \left(1+\frac{0.059}{12}\right)^{12} - 1
```

```math
EAR_B = 6.062\%
```

所以 Bank A 較高。

---

## 18. 10,000 貸款，年利率 6%，5 年本息攤還

**題目：**  
You are taking out a loan of $10,000 with an annual interest rate of 6%, to be paid back over 5 years with annual payments. What is the annual payment amount for this amortized loan?

**選項：**  
(a) $2,365.47.  
(b) $2500.00.  
(c) $2,373.96.  
(d) $2426.73.

**答案：c. $2,373.96**

**解題過程：**

年金付款公式：

```math
PMT = \frac{PV \times r}{1-(1+r)^{-n}}
```

代入：

```math
PV = 10,000
```

```math
r = 6\%
```

```math
n = 5
```

```math
PMT = \frac{10,000 \times 0.06}{1-(1.06)^{-5}}
```

```math
PMT = 2,373.96
```

---

## 19. NT$2,500,000，120 期，年利率 6%，月複利

**題目：**  
If you borrow NT$2,500,000 as a personal loan and agree to repay it in 120 equal monthly payments. The annual interest rate is 6%, compounded monthly. How much should you pay each month?

**選項：**  
(a) NT$25,000.00  
(b) NT$27,755.13  
(c) NT$30,000.00  
(d) NT$32,418.50.

**答案：b. NT$27,755.13**

**解題過程：**

月利率：

```math
r = \frac{6\%}{12} = 0.5\%
```

期數：

```math
n = 120
```

公式：

```math
PMT = \frac{PV \times r}{1-(1+r)^{-n}}
```

代入：

```math
PMT = \frac{2,500,000 \times 0.005}{1-(1.005)^{-120}}
```

```math
PMT = 27,755.13
```

---

## 20. Callable 與 Putable Bond 何者正確

**題目：**  
Which of the following statements is correct?

**選項：**  
(a) A callable (可贖回) bond gives the bondholder (債券持有者) the right to force the issuer to repurchase the bond at a stated (預先談好的履約價) price.  
(b) A putable (可賣回) bond gives the issuer the right to retire the bond before maturity at a stated price.  
(c) A putable bond allows the holder to force the issuer to buy the bond back at a stated price.  
(d) A callable bond and a putable bond give the same right to the issuer.

**答案：c. A putable bond allows the holder to force the issuer to buy the bond back at a stated price.**

**解題過程：**

Callable bond：

```math
發行人有權提前贖回債券
```

Putable bond：

```math
債券持有人有權要求發行人買回債券
```

所以 c 正確。

---

## 21. 利率大幅下降，發行人較可能執行哪種權利

**題目：**  
If interest rates fall significantly, the issuer is more likely to exercise (履約) the feature on a:

**選項：**  
(a) putable bond.  
(b) callable bond.  
(c) discount bond.  
(d) bond with a lower coupon rate.

**答案：b. callable bond.**

**解題過程：**

當市場利率下降，發行人可以用較低利率重新發債。

所以發行人會傾向贖回舊的高利率債券。

這是 callable bond 的特性。

---

## 22. 預期股價上漲，哪個選擇較吸引人

**題目：**  
Suppose you expect a stock price to increase in the future. Which of the following is generally more attractive?

**選項：**  
(a) Buy a put option.  
(b) Buy a call option.  
(c) Sell a call option.  
(d) Sell the stock short.

**答案：b. Buy a call option.**

**解題過程：**

買權 call option 給持有人：

```math
未來以履約價買進股票的權利
```

如果預期股價上漲，買 call 可以受益。

---

## 23. 波動度增加對選擇權價值影響

**題目：**  
Which of the following statements is correct?

**選項：**  
(a) An increase in stock price volatility will decrease the value of both call options and put options.  
(b) An increase in stock price volatility will increase the value of call options but decrease the value of put options.  
(c) An increase in stock price volatility will increase the value of both call options and put options.  
(d) Stock price volatility has no effect on option values.

**答案：c. An increase in stock price volatility will increase the value of both call options and put options.**

**解題過程：**

選擇權的損失有限，獲利潛力因波動度提高而增加。

因此波動度上升通常會使：

```math
Call\ option\ value\ 上升
```

```math
Put\ option\ value\ 上升
```

---

## 24. 貸款金額與期數不變，利率上升，月付款會如何

**題目：**  
Suppose the loan amount and the number of payments stay the same. If the interest rate increases, the monthly payment on an amortized loan will:

**選項：**  
(a) decrease.  
(b) increase.  
(c) stay the same.  
(d) become zero.

**答案：b. increase.**

**解題過程：**

攤還貸款公式：

```math
PMT = \frac{PV \times r}{1-(1+r)^{-n}}
```

當：

```math
PV\ 不變
```

```math
n\ 不變
```

```math
r\ 上升
```

則：

```math
PMT\ 上升
```

---

## 25. 公司財務管理主要目標

**題目：**  
The primary goal of financial management in a corporation is to:

**選項：**  
(a) maximize dividends paid to shareholders.  
(b) maximize the current value per share of existing stock.  
(c) maximize market share.  
(d) minimize operating costs

**答案：b. maximize the current value per share of existing stock.**

**解題過程：**

公司財務管理的主要目標是：

```math
最大化現有股東每股股票的目前價值
```

也就是：

```math
maximize\ shareholder\ wealth
```

不是單純最大化股利、市占率或最小化成本。

