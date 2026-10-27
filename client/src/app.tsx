import { Route, Routes } from 'react-router-dom';

import MobileLayout from './components/MobileLayout';
import AdminLayout from './components/AdminLayout';
import NotFound from './pages/NotFound/NotFound';
import LoginPage from './pages/login';
import HomePage from './pages/home';
import SchedulePage from './pages/schedule';
import TasksPage from './pages/tasks';
import LessonsPage from './pages/lessons';
import ProgressPage from './pages/progress';
import CompanionPage from './pages/companion';
import SupportPage from './pages/support';
import ContentPage from './pages/content';
import ArticleDetailPage from './pages/article-detail';
import ProfilePage from './pages/me';
import DevSwitchPage from './pages/dev';
import AdminPage from './pages/admin';

const RoutesComponent = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<MobileLayout />}>
        <Route index element={<HomePage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="lessons" element={<LessonsPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="companion" element={<CompanionPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="content" element={<ContentPage />} />
        <Route path="content/:id" element={<ArticleDetailPage />} />
        <Route path="me" element={<ProfilePage />} />
        <Route path="dev" element={<DevSwitchPage />} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default RoutesComponent;
