import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  AlertCircle, 
  Clock, 
  Eye, 
  Volume2, 
  Users,
  EyeOff,
  Activity,
  ChevronLeft,
  Send
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { certTestsAPI } from '../services/api';
import { toast } from 'sonner';

export const CodingTestResults = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [reviewRequested, setReviewRequested] = useState(false);
  const [requestingReview, setRequestingReview] = useState(false);

  useEffect(() => {
    fetchResults();
  }, [attemptId]);

  const fetchResults = async () => {
    try {
      console.log('Fetching results for attempt:', attemptId);
      const response = await certTestsAPI.getAttempt(attemptId);
      console.log('Results response:', response);
      
      if (response && response.data) {
        // Check if the test is completed
        if (response.data.status === 'in_progress' || response.data.status === 'started') {
          toast.error('Test is still in progress. Please complete the test first.');
          setResults(null);
        } else {
          setResults(response.data);
          console.log('Results set successfully:', response.data);
        }
      } else {
        console.error('No data in response');
        toast.error('No results data received');
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      console.error('Error details:', error.response?.data);
      
      // Provide more specific error messages
      if (error.response?.status === 404) {
        toast.error('Test attempt not found. Please check the attempt ID.');
      } else if (error.response?.status === 401) {
        toast.error('You are not authorized to view these results. Please log in.');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to load results');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      toast.error('Please enter your feedback');
      return;
    }

    setSubmittingFeedback(true);
    try {
      await certTestsAPI.submitFeedback(attemptId, feedback);
      toast.success('Thank you for your feedback!');
      setFeedback('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const requestReview = async () => {
    setRequestingReview(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/cert-tests/attempts/${attemptId}/request-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: `Score ${score}% is within review threshold (pass: ${passPercentage}%)`,
          student_comment: 'Requesting manual review for score adjustment consideration'
        })
      });
      
      if (response.ok) {
        setReviewRequested(true);
        toast.success('Review request submitted successfully! An admin will review your test.');
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Failed to request review. Please try again.');
      }
    } catch (error) {
      console.error('Error requesting review:', error);
      toast.error('Failed to request review. Please try again.');
    } finally {
      setRequestingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-white text-xl">Loading results...</div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="max-w-md w-full bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <div className="text-white text-2xl font-bold mb-2">Results Not Available</div>
            <p className="text-slate-400 mb-6">
              Unable to load test results. This could happen if:
            </p>
            <ul className="text-left text-slate-400 mb-6 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>The test is still in progress and not yet submitted</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>The test attempt ID is invalid or expired</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>You don't have permission to view these results</span>
              </li>
            </ul>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <Button
                onClick={fetchResults}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const score = results.score || 0;
  const passPercentage = results.settings?.pass_percentage || 70;
  const passed = score >= passPercentage;
  
  // Check if eligible for review (within 10% of pass threshold)
  const reviewThreshold = passPercentage * 0.9; // 90% of pass threshold
  const isEligibleForReview = !passed && score >= reviewThreshold && score < passPercentage;
  const pointsNeeded = passPercentage - score;
  
  // Use backend-calculated values if available
  const resultData = results.result || {};
  const totalQuestions = resultData.total_questions || results.questions?.length || 0;
  const correctAnswers = resultData.passed_questions || results.answers?.filter(a => a.passed)?.length || 0;
  
  // MCQ and Code breakdown
  const mcqCorrect = resultData.mcq_correct || 0;
  const mcqTotal = resultData.mcq_total || 0;
  const codeCorrect = resultData.code_correct || 0;
  const codeTotal = resultData.code_total || 0;
  
  // Debug logging
  console.log('Result Data:', resultData);
  console.log('MCQ Stats:', { mcqCorrect, mcqTotal });
  console.log('Code Stats:', { codeCorrect, codeTotal });
  
  // Calculate wrong and unanswered - MCQs are answered if they're in mcq_answers
  const mcqWrong = mcqTotal - mcqCorrect;
  const codeWrong = codeTotal - codeCorrect;
  const wrongAnswers = mcqWrong + codeWrong;
  const unanswered = 0; // All questions are either correct or wrong (MCQs are always "answered" if presented)
  
  // Calculate test duration and timing
  const startTime = results.started_at ? new Date(results.started_at) : null;
  const endTime = results.finished_at ? new Date(results.finished_at) : null;
  const durationMinutes = startTime && endTime ? Math.round((endTime - startTime) / 1000 / 60) : 0;
  const allocatedTime = results.settings?.duration_minutes || 60;
  const timeUsedPercentage = allocatedTime > 0 ? Math.round((durationMinutes / allocatedTime) * 100) : 0;

  // Calculate proctoring violations from both sources
  const proctoringEvents = results.proctoring_events || [];
  const violations = results.violations || {};
  
  // Count violations by type - use violations object first, then fallback to event counting
  const tabSwitches = violations.tab_switch || violations.tabSwitch || 
                      proctoringEvents.filter(e => e.violation_type === 'tab_switch').length;
  const audioDetections = violations.excessive_noise || 
                          proctoringEvents.filter(e => e.violation_type === 'excessive_noise').length;
  const faceNotDetected = violations.no_face || violations.no_face_detected || 
                          proctoringEvents.filter(e => e.violation_type === 'no_face' || e.violation_type === 'no_face_detected').length;
  const multipleFaces = violations.multiple_people || violations.multiple_faces || 
                        proctoringEvents.filter(e => e.violation_type === 'multiple_people' || e.violation_type === 'multiple_faces').length;
  const lookingAway = violations.looking_away || 
                      proctoringEvents.filter(e => e.violation_type === 'looking_away' || e.violation_type === 'looking_away_warning').length;
  const totalViolations = faceNotDetected + multipleFaces + lookingAway;

  const getGrade = (score) => {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 65) return 'D+';
    if (score >= 60) return 'D';
    return 'F';
  };

  const grade = getGrade(score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">LQ</span>
            </div>
            <h1 className="text-2xl font-bold text-white">LearnQuest Certifications</h1>
          </div>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Test Completed
          </Button>
        </div>

        {/* Performance Badge */}
        <div className="text-center mb-8">
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 px-4 py-2 text-sm">
            Your Performance
          </Badge>
        </div>

        {/* Main Title */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold mb-4">
            <span className="text-white">Test </span>
            <span className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              Results
            </span>
          </h2>
          <p className="text-slate-400 text-lg">
            You have successfully completed the certification assessment. Here's a detailed breakdown of your performance.
          </p>
        </div>

        {/* Score Card */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-2">
                {score}%
              </div>
              <div className="text-3xl font-bold text-white mb-4">
                Grade: {grade}
              </div>
              <p className="text-lg text-slate-300">
                {passed ? 'Congratulations! You passed the test!' : 'Keep practicing to improve your score!'}
              </p>
              
              {/* Review Eligibility Notice */}
              {isEligibleForReview && (
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg max-w-2xl mx-auto">
                  <div className="flex items-start gap-3">
                    <Activity className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-blue-300 mb-1">
                        Eligible for Manual Review
                      </p>
                      <p className="text-xs text-blue-200 mb-3">
                        You scored {score}%, just {pointsNeeded.toFixed(1)}% below the pass threshold. 
                        Your test can be reviewed by an administrator for potential score adjustment.
                      </p>
                      {!reviewRequested && !results.review_requested && (
                        <Button
                          onClick={requestReview}
                          disabled={requestingReview}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {requestingReview ? 'Requesting...' : 'Request Manual Review'}
                        </Button>
                      )}
                      {(reviewRequested || results.review_requested) && (
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                          ✓ Review Requested - Admin will review your test
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Correct Answers */}
          <Card className="bg-gradient-to-br from-green-900/40 to-green-800/20 border-green-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
                <span className="text-4xl font-bold text-green-400">{correctAnswers}</span>
              </div>
              <div className="text-white font-semibold">Correct Answers</div>
              <div className="text-green-300 text-sm">
                {totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100).toFixed(1) : 0}% accuracy
              </div>
            </CardContent>
          </Card>

          {/* Wrong Answers */}
          <Card className="bg-gradient-to-br from-red-900/40 to-red-800/20 border-red-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <XCircle className="w-8 h-8 text-red-400" />
                <span className="text-4xl font-bold text-red-400">{wrongAnswers}</span>
              </div>
              <div className="text-white font-semibold">Wrong Answers</div>
              <div className="text-red-300 text-sm">
                {totalQuestions > 0 ? ((wrongAnswers / totalQuestions) * 100).toFixed(1) : 0}% incorrect
              </div>
            </CardContent>
          </Card>

          {/* Unanswered */}
          <Card className="bg-gradient-to-br from-orange-900/40 to-orange-800/20 border-orange-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <HelpCircle className="w-8 h-8 text-orange-400" />
                <span className="text-4xl font-bold text-orange-400">{unanswered}</span>
              </div>
              <div className="text-white font-semibold">Unanswered</div>
              <div className="text-orange-300 text-sm">
                {totalQuestions > 0 ? ((unanswered / totalQuestions) * 100).toFixed(1) : 0}% skipped
              </div>
            </CardContent>
          </Card>

          {/* Total Questions */}
          <Card className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border-blue-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-8 h-8 text-blue-400" />
                <span className="text-4xl font-bold text-blue-400">{totalQuestions}</span>
              </div>
              <div className="text-white font-semibold">Total Questions</div>
              <div className="text-blue-300 text-sm">Complete assessment</div>
            </CardContent>
          </Card>
        </div>

        {/* Question Type Breakdown */}
        {(mcqTotal > 0 || codeTotal > 0) && (
          <Card className="bg-slate-800/50 border-slate-700 mb-8">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                Score Breakdown by Question Type
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* MCQ Score */}
                {mcqTotal > 0 && (
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-slate-300 font-semibold">Multiple Choice Questions</div>
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        MCQ
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-purple-400">
                        {mcqCorrect}/{mcqTotal}
                      </div>
                      <div className="text-slate-400 text-sm">
                        {mcqTotal > 0 ? ((mcqCorrect / mcqTotal) * 100).toFixed(1) : 0}% correct
                      </div>
                    </div>
                  </div>
                )}

                {/* Code Score */}
                {codeTotal > 0 && (
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-slate-300 font-semibold">Coding Questions</div>
                      <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                        CODE
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-cyan-400">
                        {codeCorrect}/{codeTotal}
                      </div>
                      <div className="text-slate-400 text-sm">
                        {codeTotal > 0 ? ((codeCorrect / codeTotal) * 100).toFixed(1) : 0}% correct
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Details */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Test Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Test Information */}
              <div>
                <h4 className="text-sm font-semibold text-slate-400 mb-3">Test Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Topic</span>
                    <span className="text-white font-medium">{results.settings?.topic_id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Difficulty</span>
                    <Badge className={`
                      ${results.settings?.difficulty === 'easy' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
                      ${results.settings?.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : ''}
                      ${results.settings?.difficulty === 'hard' ? 'bg-red-500/20 text-red-400 border-red-500/30' : ''}
                    `}>
                      {results.settings?.difficulty || 'N/A'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Question Count</span>
                    <span className="text-white font-medium">{totalQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Pass Threshold</span>
                    <span className="text-white font-medium">{results.settings?.pass_percentage || 85}%</span>
                  </div>
                </div>
              </div>

              {/* Time Statistics */}
              <div>
                <h4 className="text-sm font-semibold text-slate-400 mb-3">Time Statistics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Allocated Time</span>
                    <span className="text-white font-medium">{allocatedTime} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Time Used</span>
                    <span className="text-white font-medium">{durationMinutes} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Time Efficiency</span>
                    <Badge className={`
                      ${timeUsedPercentage > 90 ? 'bg-red-500/20 text-red-400 border-red-500/30' : ''}
                      ${timeUsedPercentage > 70 && timeUsedPercentage <= 90 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : ''}
                      ${timeUsedPercentage <= 70 ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
                    `}>
                      {timeUsedPercentage}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Avg. Time/Question</span>
                    <span className="text-white font-medium">
                      {totalQuestions > 0 ? Math.round(durationMinutes / totalQuestions) : 0} min
                    </span>
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div>
                <h4 className="text-sm font-semibold text-slate-400 mb-3">Score Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Correct</span>
                    <span className="text-green-400 font-medium">{correctAnswers}/{totalQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Incorrect</span>
                    <span className="text-red-400 font-medium">{wrongAnswers}/{totalQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Unanswered</span>
                    <span className="text-orange-400 font-medium">{unanswered}/{totalQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Accuracy Rate</span>
                    <span className="text-blue-400 font-medium">
                      {totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>Test Progress</span>
                <span>{totalQuestions - unanswered}/{totalQuestions} questions attempted</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full flex">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600"
                    style={{ width: `${(correctAnswers / totalQuestions) * 100}%` }}
                  />
                  <div 
                    className="bg-gradient-to-r from-red-500 to-red-600"
                    style={{ width: `${(wrongAnswers / totalQuestions) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question-by-Question Breakdown */}
        {results.answers && results.answers.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700 mb-8">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                Question-by-Question Breakdown
              </h3>
              
              <div className="space-y-4">
                {results.answers.map((answer, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border ${
                      answer.passed 
                        ? 'bg-green-900/20 border-green-700/50' 
                        : answer.code 
                          ? 'bg-red-900/20 border-red-700/50'
                          : 'bg-orange-900/20 border-orange-700/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {answer.passed ? (
                          <CheckCircle2 className="w-6 h-6 text-green-400" />
                        ) : answer.code ? (
                          <XCircle className="w-6 h-6 text-red-400" />
                        ) : (
                          <HelpCircle className="w-6 h-6 text-orange-400" />
                        )}
                        <div>
                          <h4 className="text-white font-semibold">Question {answer.question_number + 1}</h4>
                          <p className="text-sm text-slate-400">
                            {answer.passed ? 'Passed all test cases' : answer.code ? 'Failed some test cases' : 'Not attempted'}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${
                        answer.passed 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : answer.code
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                      }`}>
                        {answer.passed ? 'PASSED' : answer.code ? 'FAILED' : 'SKIPPED'}
                      </Badge>
                    </div>

                    {answer.code && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-slate-400">Language:</span>
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                            {answer.language_id === 71 ? 'Python' : 
                             answer.language_id === 63 ? 'JavaScript' :
                             answer.language_id === 54 ? 'C++' : 
                             answer.language_id === 50 ? 'C' :
                             answer.language_id === 62 ? 'Java' : 'Unknown'}
                          </Badge>
                        </div>
                        
                        {answer.test_results && (
                          <div className="text-sm text-slate-300">
                            <span className="text-slate-400">Test Cases: </span>
                            {answer.test_results.results?.filter(r => r.passed).length || 0}/{answer.test_results.results?.length || 0} passed
                          </div>
                        )}
                        
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-blue-400 hover:text-blue-300">
                            View submitted code
                          </summary>
                          <pre className="mt-2 p-3 bg-slate-900 rounded text-xs text-slate-300 overflow-x-auto">
                            <code>{answer.code}</code>
                          </pre>
                        </details>
                      </div>
                    )}

                    {answer.submitted_at && (
                      <div className="mt-2 text-xs text-slate-500">
                        Submitted: {new Date(answer.submitted_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Proctoring Information */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Eye className="w-5 h-5 text-purple-400" />
              <h3 className="text-xl font-bold text-white">Proctoring Information</h3>
            </div>

            {/* Tab Switches and Audio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="bg-slate-700/50 border-slate-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-slate-300 text-sm mb-1">Tab Switches Detected</div>
                      <div className="text-slate-400 text-xs">
                        {tabSwitches === 0 ? 'Perfect attention during test.' : 'Moderate attention during test.'}
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-purple-400">{tabSwitches}</div>
                  </div>
                  <div className="mt-2 h-1 bg-slate-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      style={{ width: `${Math.min(tabSwitches * 10, 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-700/50 border-slate-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-slate-300 text-sm mb-1">Audio Detections</div>
                      <div className="text-slate-400 text-xs">
                        {audioDetections === 0 ? 'Minimal background noise detected.' : 'Some noise detected.'}
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-red-400">{audioDetections}</div>
                  </div>
                  <div className="mt-2 h-1 bg-slate-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                      style={{ width: `${Math.min(audioDetections * 10, 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Video Monitoring */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-blue-400" />
                <h4 className="text-lg font-semibold text-white">Video Monitoring</h4>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="bg-slate-700/50 border-slate-600">
                  <CardContent className="p-4 text-center">
                    <EyeOff className="w-6 h-6 text-red-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-400 mb-1">{faceNotDetected}</div>
                    <div className="text-slate-300 text-xs">Face Not Detected</div>
                    <div className="text-slate-500 text-xs">Instances where face was not visible</div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-700/50 border-slate-600">
                  <CardContent className="p-4 text-center">
                    <Users className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-400 mb-1">{multipleFaces}</div>
                    <div className="text-slate-300 text-xs">Multiple Faces</div>
                    <div className="text-slate-500 text-xs">Additional people detected</div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-700/50 border-slate-600">
                  <CardContent className="p-4 text-center">
                    <Eye className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-400 mb-1">{lookingAway}</div>
                    <div className="text-slate-300 text-xs">Looking Away</div>
                    <div className="text-slate-500 text-xs">Times attention diverted</div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-700/50 border-slate-600">
                  <CardContent className="p-4 text-center">
                    <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-400 mb-1">{totalViolations}</div>
                    <div className="text-slate-300 text-xs">Total Violations</div>
                    <div className="text-slate-500 text-xs">All video monitoring flags</div>
                  </CardContent>
                </Card>
              </div>

              {totalViolations > 0 && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-yellow-300 text-sm">
                    Moderate violations detected. Please ensure proper test environment next time.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Feedback Form */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-white mb-2">Share Your Feedback</h3>
            <p className="text-slate-400 mb-4">
              Help us improve! Share your experience with this certification test.
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us about your experience, any issues you faced, or suggestions for improvement..."
              className="w-full h-32 bg-slate-700 border border-slate-600 rounded-lg p-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
            <div className="flex justify-end mt-4">
              <Button
                onClick={handleSubmitFeedback}
                disabled={submittingFeedback || !feedback.trim()}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Exit Button */}
        <div className="text-center">
          <Button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-6 text-lg"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Exit to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CodingTestResults;
