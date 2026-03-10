import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'sonner';
import './App.css';

// ── Lazy-loaded pages (code-split into separate chunks) ──────────────────────
const Login = React.lazy(() => import('./pages/Login'));
const Courses = React.lazy(() => import('./pages/Courses'));
const CourseDetail = React.lazy(() => import('./pages/CourseDetail'));
const ModuleHubPage = React.lazy(() => import('./pages/ModuleHubPage'));
const Quiz = React.lazy(() => import('./pages/Quiz'));
const QuizResults = React.lazy(() => import('./pages/QuizResults'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Tutor = React.lazy(() => import('./pages/Tutor'));
const EnhancedCoachPage = React.lazy(() => import('./pages/EnhancedCoachPage'));
const Lesson = React.lazy(() => import('./pages/Lesson'));
const PracticePage = React.lazy(() => import('./pages/PracticePage'));
const ProblemSolverPage = React.lazy(() => import('./pages/ProblemSolverPage'));
const Leaderboard = React.lazy(() => import('./pages/Leaderboard'));
const CodingTestInterface = React.lazy(() => import('./pages/CodingTestInterface'));
const CodingTestResults = React.lazy(() => import('./pages/CodingTestResults'));

// Certification components (lazy)
const CertificationLanding = React.lazy(() => import('./components/certification/CertificationLanding').then(m => ({ default: m.CertificationLanding })));
const TopicSelection = React.lazy(() => import('./components/certification/TopicSelection').then(m => ({ default: m.TopicSelection })));
const DifficultySelection = React.lazy(() => import('./components/certification/DifficultySelection').then(m => ({ default: m.DifficultySelection })));
const TestSetup = React.lazy(() => import('./components/certification/TestSetup').then(m => ({ default: m.TestSetup })));
const TestResults = React.lazy(() => import('./components/certification/TestResults').then(m => ({ default: m.TestResults })));

// Loading fallback for Suspense boundaries
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-slate-400 text-sm">Loading...</p>
    </div>
  </div>
);

/**
 * Smart root redirect:
 *  - Loading   → spinner (AuthContext is verifying stored token)
 *  - Admin     → /admin/dashboard (full page — separate nginx app)
 *  - Student   → /courses
 *  - Not authed → /login
 */
const RootRedirect = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check for admin role either from AuthContext OR directly from localStorage
  const storedAdminStr = localStorage.getItem('admin_user');
  let isStoredAdmin = false;
  try {
    const parsedAdmin = storedAdminStr ? JSON.parse(storedAdminStr) : null;
    if (parsedAdmin?.email === 'admin@learnquest.com') isStoredAdmin = true;
  } catch (e) { }

  if (user?.email === 'admin@learnquest.com' || isStoredAdmin) {
    // Admin panel is on a separate domain/S3 bucket
    const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174';
    // Pass the token in the URL so the Admin SPA can pick it up (cross-domain auth hint)
    const token = localStorage.getItem('token');
    window.location.replace(`${adminUrl}/dashboard?token=${token}`);
    return null;
  }

  return <Navigate to="/dashboard" replace />;
};

/**
 * Robust absolute redirect to the separate Admin S3 bucket
 */
const RedirectToAdmin = () => {
  const token = localStorage.getItem('token');
  const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174';
  const target = `${adminUrl}/dashboard${token ? `?token=${token}` : ''}`;
  window.location.replace(target);
  return null;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster position="top-right" richColors />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/admin/*" element={<RedirectToAdmin />} />
              <Route path="/" element={<RootRedirect />} />
              <Route path="/courses" element={<Courses />} />

              {/* Public Course Detail */}
              <Route path="/courses/:slug" element={<CourseDetail />} />

              {/* Module Hub */}
              <Route
                path="/courses/:slug/modules/:moduleId"
                element={
                  <ProtectedRoute>
                    <ModuleHubPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/quiz/:sessionId"
                element={
                  <ProtectedRoute>
                    <Quiz />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quiz-results"
                element={
                  <ProtectedRoute>
                    <QuizResults />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coach"
                element={
                  <ProtectedRoute>
                    <EnhancedCoachPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/courses/:slug/modules/:moduleId/topics/:topicId"
                element={
                  <ProtectedRoute>
                    <Lesson />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tutor/:courseId"
                element={
                  <ProtectedRoute>
                    <Tutor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/practice"
                element={
                  <ProtectedRoute>
                    <PracticePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/practice/:problemId"
                element={
                  <ProtectedRoute>
                    <ProblemSolverPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute>
                    <Leaderboard />
                  </ProtectedRoute>
                }
              />
              {/* Certification Routes - Using components from /components/certification */}
              <Route
                path="/certification"
                element={
                  <ProtectedRoute>
                    <CertificationLanding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/certification/topics"
                element={
                  <ProtectedRoute>
                    <TopicSelection />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/certification/difficulty/:topicId"
                element={
                  <ProtectedRoute>
                    <DifficultySelection />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/certifications/proctored/setup/:topicId/:difficulty"
                element={
                  <ProtectedRoute>
                    <TestSetup />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/certifications/proctored/test/:topicId/:difficulty"
                element={
                  <ProtectedRoute>
                    <CodingTestInterface />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/certifications/test/:certificationId"
                element={
                  <ProtectedRoute>
                    <CodingTestInterface />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/certifications/proctored/results"
                element={
                  <ProtectedRoute>
                    <TestResults />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/test-results/:attemptId"
                element={
                  <ProtectedRoute>
                    <CodingTestResults />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
