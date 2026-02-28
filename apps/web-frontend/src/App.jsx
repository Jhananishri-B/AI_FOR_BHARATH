import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import ModuleHubPage from './pages/ModuleHubPage';
import Quiz from './pages/Quiz';
import QuizResults from './pages/QuizResults';
import Dashboard from './pages/Dashboard';
import Tutor from './pages/Tutor';
import CoachPage from './pages/CoachPage';
import EnhancedCoachPage from './pages/EnhancedCoachPage';
import Lesson from './pages/Lesson';
import PracticePage from './pages/PracticePage';
import ProblemSolverPage from './pages/ProblemSolverPage';
import Leaderboard from './pages/Leaderboard';
// Certification pages - using components from /components/certification
import { CertificationLanding } from './components/certification/CertificationLanding';
import { TopicSelection } from './components/certification/TopicSelection';
import { DifficultySelection } from './components/certification/DifficultySelection';
import { TestSetup } from './components/certification/TestSetup';
import { TestResults } from './components/certification/TestResults';
import CodingTestInterface from './pages/CodingTestInterface';
import CodingTestResults from './pages/CodingTestResults';
import { Toaster } from 'sonner';
import './App.css';

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
    // Admin panel is a separate compiled React app at /admin — needs full page reload
    window.location.replace('/admin/dashboard');
    return null;
  }

  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster position="top-right" richColors />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
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

          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
