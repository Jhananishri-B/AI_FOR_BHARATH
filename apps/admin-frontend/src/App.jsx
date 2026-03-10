import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import Layout from './components/Layout'

// ── Lazy-loaded admin pages (code-split) ─────────────────────────────────────
const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const Users = React.lazy(() => import('./pages/Users'))
const Courses = React.lazy(() => import('./pages/Courses'))
const CreateCoursePage = React.lazy(() => import('./pages/CreateCoursePage'))
const EditCoursePage = React.lazy(() => import('./pages/EditCoursePage'))
const Problems = React.lazy(() => import('./pages/Problems'))
const PracticeZone = React.lazy(() => import('./pages/PracticeZone'))
const CertificationQuestions = React.lazy(() => import('./pages/CertificationQuestionsEnhanced'))
const ProctoringReview = React.lazy(() => import('./pages/ProctoringReview'))
const ResultsAnalytics = React.lazy(() => import('./pages/ResultsAnalytics'))
const CertificateManagement = React.lazy(() => import('./pages/CertificateManagement'))
const CertificationTestManager = React.lazy(() => import('./pages/CertificationTestManager'))
const TestsDashboard = React.lazy(() => import('./pages/TestsDashboard'))
const QuestionBanks = React.lazy(() => import('./pages/QuestionBanks'))
const ExamViolationsDashboard = React.lazy(() => import('./pages/ExamViolationsDashboard'))
const TestReview = React.lazy(() => import('./pages/TestReview'))
const UserProgress = React.lazy(() => import('./pages/UserProgress'))
const UserComparison = React.lazy(() => import('./pages/UserComparison'))

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
  </div>
)

// If no token, redirect to the main web frontend login (the single login for everyone)
// If no token, redirect to the main web frontend login (the single login for everyone)
const ProtectedRoute = ({ children }) => {
  const [isVerifying, setIsVerifying] = React.useState(true)
  const [token, setToken] = React.useState(localStorage.getItem('token'))

  React.useEffect(() => {
    // Check if token is in URL (passed from main site)
    const urlParams = new URLSearchParams(window.location.search)
    const urlToken = urlParams.get('token')

    if (urlToken) {
      localStorage.setItem('token', urlToken)
      setToken(urlToken)
      // Clean up URL
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }

    if (!token && !urlToken) {
      // Small delay to prevent flash during SPA hydration/redirect logic
      const timer = setTimeout(() => {
        const loginUrl = import.meta.env.VITE_WEB_URL ? `${import.meta.env.VITE_WEB_URL}/login` : '/login'
        window.location.href = loginUrl
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setIsVerifying(false)
    }
  }, [token])

  if ((!token && !isVerifying) || isVerifying) {
    return <PageLoader />
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
                <Suspense fallback={<PageLoader />}>
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
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}

export default App

