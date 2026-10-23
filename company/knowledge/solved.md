# سجلّ ما حُلّ — لا يُعاد فتحه

قبل أن تقترح شيئاً ابحث هنا (`grep`). ما فيه مُنجَز ومحروس؛ إعادة اقتراحه هدرٌ
لوقت المالك. يُضاف السطر عند كل دمج: **ماذا** · **أين** · **الحارس** · **الطلب**.

| ماذا | أين | الحارس | الطلب |
|---|---|---|---|
| تسعة طوابع ببنى مختلفة + عناوين أقسام بأغلفة وحركة | `lib/themes.ts` · `menu-skins.css` · `SectionHeading.tsx` | `invariants.test.ts` (بصمة الألوان) | #23 #24 #25 |
| مبدّل اللغة في زاوية الترويسة | `chrome.tsx` (`LangToggle`) · `SkinHeads.tsx` (`Corner`) | — | #25 |
| الوضع الإنجليزي كاملاً (أقسام · SAR · وحدات · lang/dir · `?lang=en`) | `MenuPage.tsx` · `categories.ts` (`categoryLabel`) | `legal.test.ts` | #26 |
| زرّ الرجوع يغلق نافذة الطبق + رابط `?dish=` | `MenuPage.tsx` (`openDishView`) | — | #26 |
| بحث عربي متسامح | `lib/arabic.ts` | `legal.test.ts` | #26 |
| سعر صفر لا يُعرض · إعادة المحاولة · لون شريط المتصفّح من الطابع | `DishCard.tsx` · `MenuPage.tsx` | — | #26 |
| «لأعلى» لا يختبئ خلف شريط الطلب · تمرير يحترم تقليل الحركة | `MenuPage.tsx` | — | #26 |
| تركيز نافذة الطبق واسمها | `DishModal.tsx` | — | #26 |
| canonical للدليل والدخول · noindex لغير الموجود | `Restaurants.tsx` · `Login.tsx` · `NotFound.tsx` | — | #26 |
| تحويل `/pricing` `/contact` `/faq` وحجزها | `_redirects` · `shared/menu-url.mjs` | `legal.test.ts` | #26 |
| سياسة الخصوصية والشروط على نظام حماية البيانات | `Legal.tsx` · `lib/legal.ts` | — | #26 |
| موافقة البكسل · إشعار الجمع في الطلب والولاء | `PixelConsent.tsx` · `CartReview.tsx` · `LoyaltyCard.tsx` | `legal.test.ts` | #26 |
| عبارات الهيئة (٢٠٠٠ سعرة · ٤٠٠ ملغم) على المنيو الرقمي | `MenuPage.tsx` · `lib/nutrition.ts` | — | #26 |
| جملة الضريبة الواحدة · الخصم المحسوب · لا علم | `lib/legal.ts` · `site.tsx` · `seasons.ts` | `legal.test.ts` | #26 |
| «شامل الضريبة» بلا رقم ضريبي لا يظهر (منيو · سلّة · مطبوع) · الإعدادات تمنع «غير شاملة» بلا رقم | `isVatNumber` | `legal.test.ts` | #27 |
| موافقة صريحة بمربّع عند التسجيل | `Login.tsx` | — | #27 |
| حقن `$'` في وسوم المشاركة · CSP مقصور على مشروعنا · `url-guard` · `webhook-dispatch` بلا تحويلات · حدّ الحساب في `menu-scan` · أخطاء `api` العامّة | `shared/menu-meta.mjs` · `_headers` · `supabase/functions/*` | `parity.test.ts` · `url-guard.test.ts` | #26 (الدوال تنتظر نشر المالك) |
| المدونة مطابقة للمنتج (١٨ مقالاً · ٩ صور) | `content/articles/` | `articles.test.ts` · `parity.test.ts` | #27 |
| فيديو الإطلاق ٣٢ ث عمودي · دليل الهويّة PDF وحزمة الأصول | خارج المستودع (أُرسلت للمالك) | — | — |
