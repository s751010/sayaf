import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider, Spinner } from "@/components/ui";
import { ErrorBoundary } from "@/components/ErrorBoundary";

/**
 * ⚠️ **`MenuPage` وحدها تبقى في الحزمة الرئيسية** — وهذا القرار لا يُعكس:
 * تُفتح من كود QR مطبوع على طاولة، على بيانات جوّال داخل مبنى، ورحلةُ شبكة
 * إضافية لجلب قطعتها تُدفع قبل أن يرى الزبون صنفاً واحداً.
 *
 * و`Landing` كانت معها هنا بلا سبب: ١٥٥٢ سطراً من شيفرة تسويق **ينزّلها كل
 * زائر منيو ولا يفتحها أبداً**. صارت كسولة، وزائر الهبوط يدفع قطعةً واحدة
 * إضافية — وهو على شبكة أفضل وسياق أصبر، وصفحته ليست أكثر مسار في المنتج.
 *
 * (`themes.ts` و`patterns.ts` تبقيان في الرئيسية على أي حال — يستوردهما
 * `MenuHeader` — فالخارج شيفرة الهبوط وحدها لا الطوابع.)
 */
import MenuPage from "@/pages/MenuPage";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import { slugFromRequest } from "@/lib/menuUrl";

const Landing = lazy(() => import("@/pages/Landing"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogPostPage = lazy(() => import("@/pages/BlogPost"));
const Dashboard = lazy(() => import("@/pages/dashboard/Dashboard"));
/** متابعة الطلب — رابط يُحفظ ويُرسَل، لا لوحة تختفي بأول تحديث. */
const OrderStatus = lazy(() => import("@/pages/OrderStatus"));
const Founder = lazy(() => import("@/pages/founder/Founder"));
const Demo = lazy(() => import("@/pages/Demo"));
const Help = lazy(() => import("@/pages/Help"));
const ApiDocs = lazy(() => import("@/pages/ApiDocs"));
const About = lazy(() => import("@/pages/About"));
/** دليل المطاعم — صفحة فهرس عامة تنمو مع كل تاجر جديد. */
const Restaurants = lazy(() => import("@/pages/Restaurants"));

const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Stamp = lazy(() => import("@/pages/Stamp"));
// الصفحتان القانونيتان في قطعة واحدة: تتقاسمان القالب وكتلة الهوية، ومن يفتح
// إحداهما غالباً يفتح الأخرى.
const Privacy = lazy(() => import("@/pages/Legal").then((m) => ({ default: m.Privacy })));
const Terms = lazy(() => import("@/pages/Legal").then((m) => ({ default: m.Terms })));

/**
 * هل فُتح التطبيق على نطاق فرعي لمطعم؟ يُحسب مرّة عند التحميل — المضيف لا
 * يتغيّر داخل الجلسة، وحسابُه في كل تصيير هدرٌ بلا سبب.
 */
const ON_MENU_HOST =
  typeof window !== "undefined" &&
  slugFromRequest(window.location.host, "/") !== null;

function PageLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/**
                  * ⚠️ **على نطاق فرعي، `/` هو المنيو لا صفحة الهبوط.**
                  *
                  * `aldiwan.cloudmenu.sa/` يجب أن يفتح منيو الديوان؛ وتوجيهه
                  * إلى صفحة التسويق كان سيجعل كل كود QR على النطاق الفرعي
                  * يعرض إعلاناً عن المنصّة بدل منيو المطعم.
                  */}
                <Route
                  path="/"
                  element={
                    ON_MENU_HOST ? (
                      <ErrorBoundary>
                        <MenuPage />
                      </ErrorBoundary>
                    ) : (
                      <Landing />
                    )
                  }
                />
                <Route path="/demo" element={<Demo />} />
                <Route path="/help" element={<Help />} />
                <Route path="/about" element={<About />} />
                <Route path="/restaurants" element={<Restaurants />} />
                <Route path="/docs/api" element={<ApiDocs />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                <Route path="/login" element={<Login />} />
                {/* قبل `/:slug` — مسارات ثابتة لا يجوز أن يلتقطها slug مطعم. */}
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/stamp" element={<Stamp />} />
                <Route path="/o/:id" element={<OrderStatus />} />
                <Route path="/dashboard/*" element={<Dashboard />} />
                {/* `/*` لأن اللوحة صارت أقساماً براوتر فرعي داخلها. */}
                <Route path="/founder/*" element={<Founder />} />
                {/* slug المطعم — يلتقط أي مسار من مستوى واحد.
                    حاجز خطأ خاص: انهيار منيو مطعم لا يجب أن يُسقط التطبيق كله. */}
                <Route
                  path="/:slug"
                  element={
                    <ErrorBoundary>
                      <MenuPage />
                    </ErrorBoundary>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
