import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';

// Остальные страницы загружаются «лениво» — отдельным файлом, только когда на них переходят.
// Так главная открывается быстрее: браузеру не нужно сразу скачивать код всех страниц.
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const AdmissionPage = lazy(() => import('./pages/AdmissionPage').then((m) => ({ default: m.AdmissionPage })));
const ContactsPage = lazy(() => import('./pages/ContactsPage').then((m) => ({ default: m.ContactsPage })));
const ContestPage = lazy(() => import('./pages/ContestPage').then((m) => ({ default: m.ContestPage })));
const CategoryPage = lazy(() => import('./pages/CategoryPage').then((m) => ({ default: m.CategoryPage })));
const DirectionsPage = lazy(() => import('./pages/DirectionsPage').then((m) => ({ default: m.DirectionsPage })));
const EquipmentPage = lazy(() => import('./pages/DocListPage').then((m) => ({ default: m.EquipmentPage })));
const EventsPlanPage = lazy(() => import('./pages/DocListPage').then((m) => ({ default: m.EventsPlanPage })));
const VacanciesPage = lazy(() => import('./pages/VacanciesPage').then((m) => ({ default: m.VacanciesPage })));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage').then((m) => ({ default: m.DocumentsPage })));
const FaqPage = lazy(() => import('./pages/FaqPage').then((m) => ({ default: m.FaqPage })));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage').then((m) => ({ default: m.FeedbackPage })));
const NewsItemPage = lazy(() => import('./pages/NewsItemPage').then((m) => ({ default: m.NewsItemPage })));
const NewsPage = lazy(() => import('./pages/NewsPage').then((m) => ({ default: m.NewsPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage').then((m) => ({ default: m.ResourcesPage })));
const RoomsPage = lazy(() => import('./pages/RoomsPage').then((m) => ({ default: m.RoomsPage })));
const SchedulePage = lazy(() => import('./pages/SchedulePage').then((m) => ({ default: m.SchedulePage })));
const SearchPage = lazy(() => import('./pages/SearchPage').then((m) => ({ default: m.SearchPage })));
const TeamPage = lazy(() => import('./pages/TeamPage').then((m) => ({ default: m.TeamPage })));
// Админ-панель — отдельный большой кусок кода, посетители сайта его не скачивают
const AdminApp = lazy(() => import('./admin/AdminApp'));

/**
 * Старый адрес /programs: «программы» теперь называются направлениями и живут на /directions.
 * Фильтры из старых ссылок сохраняем (dir → category).
 */
function ProgramsRedirect() {
  const [params] = useSearchParams();
  const next = new URLSearchParams(params);
  const dir = next.get('dir');
  if (dir) {
    next.delete('dir');
    next.set('category', dir);
  }
  const query = next.toString();
  return <Navigate to={`/directions${query ? `?${query}` : ''}`} replace />;
}

/**
 * Карта сайта: какой адрес какую страницу открывает.
 * Все страницы сайта вложены в Layout — поэтому у каждой есть шапка и подвал.
 * Админ-панель (/admin) — со своим оформлением, без шапки и подвала сайта.
 */
export default function App() {
  return (
    <Routes>
      <Route
        path="admin/*"
        element={
          <Suspense fallback={<div className="min-h-screen bg-surface" />}>
            <AdminApp />
          </Suspense>
        }
      />

      <Route element={<Layout />}>
        <Route index element={<HomePage />} />

        {/* О центре */}
        <Route path="about" element={<AboutPage />} />
        <Route path="about/equipment" element={<EquipmentPage />} />
        <Route path="about/rooms" element={<RoomsPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="events-plan" element={<EventsPlanPage />} />
        <Route path="documents" element={<DocumentsPage />} />

        {/* Обучение */}
        <Route path="directions" element={<DirectionsPage />} />
        <Route path="directions/:slug" element={<CategoryPage />} />
        <Route path="programs" element={<ProgramsRedirect />} />
        <Route path="admission" element={<AdmissionPage />} />
        <Route path="vacancies" element={<VacanciesPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="resources" element={<ResourcesPage />} />

        {/* Новости и поиск */}
        <Route path="news" element={<NewsPage />} />
        <Route path="news/:id" element={<NewsItemPage />} />
        <Route path="search" element={<SearchPage />} />

        {/* Конкурс и связь */}
        <Route path="vysshiy-pilotazh" element={<ContestPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="privacy" element={<PrivacyPage />} />

        {/* Любой другой адрес — «страница не найдена» */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
