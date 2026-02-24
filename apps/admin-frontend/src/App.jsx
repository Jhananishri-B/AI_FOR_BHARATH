import React, { useEffect } from 'react'
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
import Certification from './pages/Certification'
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

function App() {
  // Capture token from URL on first load and store in localStorage
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const tokenFromUrl = params.get('token')
      if (tokenFromUrl) {
        localStorage.setItem('token', tokenFromUrl)
        // Optional: trigger any auth state updates here if you have a context
        // Clean the URL (remove token)
        window.history.replaceState({}, document.title, '/')
      }
    } catch (e) {
      // no-op
    }
  }, [])

  return (
    <>
      <Toaster position="top-right" richColors />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/users/:userId/progress" element={<UserProgress />} />
        <Route path="/users/compare" element={<UserComparison />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/create" element={<CreateCoursePage />} />
        <Route path="/courses/:id/edit" element={<EditCoursePage />} />
        <Route path="/problems" element={<Problems />} />
        <Route path="/practice-zone" element={<PracticeZone />} />
        {/** Legacy Certification management removed to avoid confusion */}
        <Route path="/certifications/:certId/questions" element={<CertificationQuestions />} />
        <Route path="/tests" element={<TestsDashboard />} />
        <Route path="/certification-tests" element={<CertificationTestManager />} />
        <Route path="/question-banks" element={<QuestionBanks />} />
        <Route path="/proctoring-review" element={<ProctoringReview />} />
        <Route path="/exam-violations" element={<ExamViolationsDashboard />} />
        <Route path="/test-review" element={<TestReview />} />
        <Route path="/results-analytics" element={<ResultsAnalytics />} />
        <Route path="/certificate-management" element={<CertificateManagement />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
    </>
  )
}

export default App
