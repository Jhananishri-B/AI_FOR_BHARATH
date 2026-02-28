import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Courses from './pages/Courses'
import CreateCoursePage from './pages/CreateCoursePage'
import EditCoursePage from './pages/EditCoursePage'
import Problems from './pages/Problems'
import PracticeZone from './pages/PracticeZone'
import CertificationQuestions from './pages/CertificationQuestionsEnhanced'
import ProctoringReview from './pages/ProctoringReview'
import ResultsAnalytics from './pages/ResultsAnalytics'
import CertificateManagement from './pages/CertificateManagement'
import CertificationTestManager from './pages/CertificationTestManager'
import TestsDashboard from './pages/TestsDashboard'
import QuestionBanks from './pages/QuestionBanks'
import ExamViolationsDashboard from './pages/ExamViolationsDashboard'
import TestReview from './pages/TestReview'
import UserProgress from './pages/UserProgress'
import UserComparison from './pages/UserComparison'

// If no token, redirect to the main web frontend login (the single login for everyone)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  if (!token) {
    window.location.href = '/login'
    return null
  }
  return children
}

function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* All admin routes are protected — redirect to /login if no token */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/users/:userId/progress" element={<UserProgress />} />
                  <Route path="/users/compare" element={<UserComparison />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/courses/create" element={<CreateCoursePage />} />
                  <Route path="/courses/:id/edit" element={<EditCoursePage />} />
                  <Route path="/problems" element={<Problems />} />
                  <Route path="/practice-zone" element={<PracticeZone />} />
                  <Route path="/certifications/:certId/questions" element={<CertificationQuestions />} />
                  <Route path="/tests" element={<TestsDashboard />} />
                  <Route path="/certification-tests" element={<CertificationTestManager />} />
                  <Route path="/question-banks" element={<QuestionBanks />} />
                  <Route path="/proctoring-review" element={<ProctoringReview />} />
                  <Route path="/exam-violations" element={<ExamViolationsDashboard />} />
                  <Route path="/test-review" element={<TestReview />} />
                  <Route path="/results-analytics" element={<ResultsAnalytics />} />
                  <Route path="/certificate-management" element={<CertificateManagement />} />
                  {/* Default: redirect / to /dashboard */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}

export default App
