import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster position="top-right" richColors />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/courses" replace />} />
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
