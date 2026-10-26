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
| فشل الشبكة في اللوحة لا يعرض «أنشئ مطعمك» · إعادة محاولة · ترويسة اللوحة على 320 | `Dashboard.tsx` | `e2e/dashboard.spec.ts` (٥٠٠ + 320) | #28 |
| «شامل الضريبة» في التذكرة وصفحة المتابعة بلا رقم | `PickupTicket.tsx` · `OrderStatus.tsx` | `legal.test.ts` (مسح كل `app/src`) | #28 |
| رموز الحساسية لا تُقصّ بصمت (+N) · ترويسة الصفحات العامّة على 320–399 | `DishCard.tsx` (`MetaRow`) · `site.tsx` | — | #28 |
| عامل الخدمة لا يخزّن ردّاً فاشلاً ولا HTML مكان JS · مخابئ بإصدار | `public/sw.js` | `sw.test.ts` | #28 |
| الخصوصية: نقل البيانات بلا ادّعاء ضمانات · وعد الحذف مطابق لإجراء مكتوب · إفصاح التحليلات · GA4 بلا `page_view` تلقائي · `deploy.yml` حُذف · `plausible.io` في CSP | `Legal.tsx` · `runbooks/account-deletion.md` · `track.ts` · `_headers` | — | #29 |
| رفع الطوابع التسعة: ضغطٌ وأسعار مصفوفة ونافذة بحركة كل طابع · عيوب الجودة السبعة · «بيت طين نجدي» | `DishCard.tsx` · `menu-skins.css` · `SkinHeads.tsx` (`MudHead`) | `invariants.test.ts` (بصمة مجمّدة) | #30 |
| طابع عاشر «محمصة» · المنتقي يرتّب حسب نوع النشاط بلا تطبيق · «نجدي» اسماً · «10 طوابع» في كل موضع | `themeSuggest.ts` · `ThemeSuggest.tsx` · `SkinHeads.tsx` (`BagHead`) | `theme-suggest.test.ts` · `invariants.test.ts` (`ADDED`) · e2e المنتقي | #31 |
