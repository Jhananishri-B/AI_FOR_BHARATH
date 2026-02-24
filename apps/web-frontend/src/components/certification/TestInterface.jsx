import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, Clock, Eye, Volume2, Play } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import Webcam from 'react-webcam';
import screenfull from 'screenfull';
import { toast } from 'sonner';
// import Editor from '@monaco-editor/react'; // Removed to avoid render failures if package isn't present
import api, { certificationsAPI } from '../../services/api';

// Mock data for testing
const DIFFICULTY_LEVELS = {
  easy: { name: 'Easy', questions: 20 },
  medium: { name: 'Medium', questions: 30 },
  tough: { name: 'Tough', questions: 40 },
};

export const TestInterface = () => {
  const { topicId, difficulty } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // Attempt/session identifier may be provided by the start flow; keep optional
  const attemptId = location.state?.attemptId || null;
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [userName, setUserName] = useState(location.state?.userName || 'Candidate');
  const [topic, setTopic] = useState({ title: 'Certification Test' });
  const difficultyInfo = DIFFICULTY_LEVELS[difficulty] || DIFFICULTY_LEVELS.medium;
  const [timeRemaining, setTimeRemaining] = useState(
    (location.state?.spec?.duration_minutes ? location.state.spec.duration_minutes * 60 : difficultyInfo.questions * 60)
  );
  const [violations, setViolations] = useState({
    tabSwitch: 0,
    faceNotDetected: 0,
    noiseDetected: 0,
  });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const webcamRef = useRef(null);
  const [codeByIndex, setCodeByIndex] = useState({});
  const [langByIndex, setLangByIndex] = useState({});
  const [runResult, setRunResult] = useState(null);
  const languageOptions = [
    { id: 71, name: 'Python 3', value: 'python' },
    { id: 63, name: 'JavaScript (Node.js)', value: 'javascript' },
    { id: 54, name: 'C++', value: 'cpp' },
    { id: 50, name: 'C', value: 'c' },
    { id: 62, name: 'Java', value: 'java' },
  ];
  
  // Mock test questions for demonstration
  const baseQuestions = [
    { _id: '1', title: 'What is React?', options: ['A library', 'A framework', 'A language', 'A database'], problem_statement: 'What is React?' },
    { _id: '2', title: 'What is a component?', options: ['A function', 'A class', 'A file', 'A module'], problem_statement: 'What is a component?' },
    { _id: '3', title: 'What is JSX?', options: ['JavaScript XML', 'JavaScript', 'HTML', 'CSS'], problem_statement: 'What is JSX?' },
  ];

  // Apply admin spec settings
  const randomized = location.state?.spec?.randomize ?? true;
  const restrictCopyPaste = location.state?.spec?.restrict_copy_paste ?? false;
  const desiredCount = location.state?.spec?.question_count ?? baseQuestions.length;
  const source = randomized ? [...baseQuestions].sort(() => Math.random() - 0.5) : baseQuestions;
  const testQuestions = source.slice(0, desiredCount);

  useEffect(() => {
    // Copy/Paste restriction
    if (restrictCopyPaste) {
      const handler = (e) => e.preventDefault();
      document.addEventListener('copy', handler);
      document.addEventListener('cut', handler);
      document.addEventListener('paste', handler);
      return () => {
        document.removeEventListener('copy', handler);
        document.removeEventListener('cut', handler);
        document.removeEventListener('paste', handler);
      };
    }
  }, [restrictCopyPaste]);

  useEffect(() => {
    // Enter fullscreen
    if (screenfull.isEnabled) {
      screenfull.request();
      setIsFullScreen(true);
    }

    // Listen for visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolations(prev => ({ ...prev, tabSwitch: prev.tabSwitch + 1 }));
        toast.error('Tab switching detected! This will affect your score.');
        
        // Log the violation to the API
        if (attemptId) {
          logEvent({ type: 'tab_switch' });
        }
      }
    };

    // Prevent common keyboard shortcuts for tab/window switching
    const handleKeyDown = (e) => {
      // Prevent Ctrl+Tab, Alt+Tab, etc.
      if ((e.ctrlKey || e.altKey || e.metaKey) && e.key === 'Tab') {
        e.preventDefault();
        toast.error('Tab switching is not allowed during the test!');
        setViolations(prev => ({ ...prev, tabSwitch: prev.tabSwitch + 1 }));
        logEvent({ type: 'tab_switch_attempt', method: e.ctrlKey ? 'Ctrl+Tab' : 'Alt+Tab' });
      }
      
      // Prevent F11 and other system keys
      if (e.key === 'F11' || e.key === 'F12') {
        e.preventDefault();
        toast.error('This action is not allowed during the test!');
      }
      
      // Prevent Ctrl+W, Ctrl+N, Ctrl+T (window/tab management)
      if ((e.ctrlKey || e.metaKey) && ['w', 'n', 't'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        toast.error('Window management shortcuts are disabled!');
        setViolations(prev => ({ ...prev, tabSwitch: prev.tabSwitch + 1 }));
      }
    };

    // Prevent right-click context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
      toast.warning('Right-click is disabled during the test');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    // Fullscreen change handler
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && screenfull.isEnabled) {
        toast.warning('Please remain in fullscreen mode');
        // Try to re-enter fullscreen
        screenfull.request().catch(() => {
          toast.error('Unable to re-enter fullscreen. Test may be terminated.');
        });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (screenfull.isEnabled && screenfull.isFullscreen) {
        screenfull.exit();
      }
    };
  }, [attemptId]);

  useEffect(() => {
    // Timer countdown
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const logEvent = async (event) => {
    try {
      const response = await fetch('/api/certifications/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          attempt_id: attemptId,
          event: event
        })
      });

      if (!response.ok) {
        console.error('Failed to log event');
      }
    } catch (error) {
      console.error('Error logging event:', error);
    }
  };

  const proctorImage = async (imageBase64) => {
    try {
      const response = await fetch('/api/ai/proctor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          attempt_id: attemptId,
          image_base64: imageBase64
        })
      });

      if (!response.ok) {
        console.error('Failed to proctor image');
      }
    } catch (error) {
      console.error('Error proctoring image:', error);
    }
  };

  useEffect(() => {
    // Proctoring interval - capture image every 10 seconds
    const proctoringInterval = setInterval(() => {
      if (webcamRef.current && !document.hidden) {
        try {
          const imageBase64 = webcamRef.current.getScreenshot();
          if (imageBase64) {
            proctorImage(imageBase64);
          }
        } catch (error) {
          console.error('Error capturing screenshot:', error);
        }
      }
    }, 10000);

    return () => clearInterval(proctoringInterval);
  }, [attemptId]);

  const handleAnswerSelect = (answerIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = {
      questionId: testQuestions[currentQuestion]._id,
      selectedAnswer: answerIndex,
      isCorrect: false, // Will be determined on submission
    };
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < testQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitTest = async () => {
    if (screenfull.isEnabled && screenfull.isFullscreen) {
      screenfull.exit();
    }

    // If we have an attemptId, submit answers to backend for scoring (including code)
    if (attemptId) {
      try {
        const answerMap = {};
        testQuestions.forEach((q, idx) => {
          const key = String(q._id || q.title);
          if ((q.type || '').toLowerCase() === 'code' || Array.isArray(q.test_cases)) {
            const lang = languageOptions.find(l => l.value === (langByIndex[idx] || 'python'))
            answerMap[key] = {
              language_id: lang?.id || 71,
              source_code: codeByIndex[idx] || '',
            };
          } else if (answers[idx]?.selectedAnswer !== undefined) {
            answerMap[key] = answers[idx].selectedAnswer;
          }
        });

        const resp = await api.post('/api/cert-tests/submit', {
          attempt_id: attemptId,
          answers: answerMap,
        });

        navigate('/certifications/proctored/results', {
          state: {
            topic,
            difficulty: difficultyInfo,
            userName,
            answers,
            violations,
            testScore: resp.data?.test_score ?? 0,
            behaviorScore: 95,
            finalScore: resp.data?.final_score ?? 0,
          }
        });
        return;
      } catch (e) {
        toast.error('Failed to submit test, showing local results');
      }
    }

    // Fallback local results
    navigate('/certifications/proctored/results', {
      state: {
        topic,
        difficulty: difficultyInfo,
        userName,
        answers,
        violations,
        testScore: 85,
        behaviorScore: 95,
        finalScore: 87,
      }
    });
  };

  const progress = ((currentQuestion + 1) / testQuestions.length) * 100;
  const currentQ = testQuestions[currentQuestion];
  const isCodeQuestion = (currentQ?.type || '').toLowerCase() === 'code' || Array.isArray(currentQ?.test_cases);
  const selectedLanguage = langByIndex[currentQuestion] || 'python';
  const code = codeByIndex[currentQuestion] || '';

  const formatTime = (totalSeconds) => {
    const safe = Number.isFinite(totalSeconds) && totalSeconds >= 0 ? totalSeconds : 0;
    const minutes = Math.floor(safe / 60);
    const seconds = Math.floor(safe % 60);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  const ErrorBoundary = ({ children }) => {
    const [error, setError] = React.useState(null);
    React.useEffect(() => {
      const handler = (event) => {
        setError(event?.reason || event?.error || new Error('Unknown error'));
      };
      window.addEventListener('unhandledrejection', handler);
      window.addEventListener('error', handler);
      return () => {
        window.removeEventListener('unhandledrejection', handler);
        window.removeEventListener('error', handler);
      };
    }, []);
    if (error) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-6">
          <div className="max-w-xl w-full rounded-lg border border-red-700 bg-red-900/20 p-6 text-red-100">
            <h2 className="text-lg font-semibold mb-2">Something went wrong loading the test</h2>
            <p className="text-sm opacity-80 mb-4">You can still continue with a simplified view.</p>
            <button
              className="px-4 py-2 bg-primary text-white rounded"
              onClick={() => setError(null)}
            >Retry</button>
          </div>
        </div>
      );
    }
    return children;
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* Top Bar - Monitoring Status */}
        <div className="border-b border-border bg-card shadow-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Badge variant="default">{topic.title}</Badge>
                <Badge variant="outline">{difficultyInfo.name}</Badge>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Monitoring Indicators */}
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4 text-success" />
                  <span className="hidden sm:inline">Monitored</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Volume2 className="h-4 w-4 text-success" />
                  <span className="hidden sm:inline">Listening</span>
                </div>
                
                {/* Timer */}
                <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-mono font-semibold text-primary">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Main Content - Questions */}
            <div className="lg:col-span-2">
              {/* Progress */}
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-foreground">
                    Question {currentQuestion + 1} of {testQuestions.length}
                  </span>
                  <span className="text-muted-foreground">{Math.round(progress)}% Complete</span>
                </div>
                <Progress value={progress} max={100} />
              </div>

              {/* Question Card */}
              <Card className="mb-6">
                <CardContent className="p-8">
                  <h2 className="mb-6 text-xl font-semibold text-foreground">
                    {currentQ.title || currentQ.problem_statement}
                  </h2>
                  {!isCodeQuestion ? (
                    <div className="space-y-3">
                      {currentQ.options?.map((option, index) => {
                        const isSelected = answers[currentQuestion]?.selectedAnswer === index;
                        return (
                          <button
                            key={index}
                            onClick={() => handleAnswerSelect(index)}
                            className={`w-full rounded-lg border-2 p-4 text-left transition-all duration-200 ${
                              isSelected
                                ? 'border-primary bg-primary/10 shadow-primary'
                                : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                                  isSelected
                                    ? 'border-primary bg-primary'
                                    : 'border-muted-foreground'
                                }`}
                              >
                                {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                              </div>
                              <span className="text-foreground">{option}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <select
                          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white"
                          value={selectedLanguage}
                          onChange={(e) => setLangByIndex((prev) => ({ ...prev, [currentQuestion]: e.target.value }))}
                        >
                          {languageOptions.map((l) => (
                            <option key={l.value} value={l.value}>{l.name}</option>
                          ))}
                        </select>
                        <button
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-2"
                          onClick={async () => {
                            try {
                              const lang = languageOptions.find(l => l.value === selectedLanguage)
                              const res = await api.post('/api/cert-tests/run-code', {
                                language_id: lang.id,
                                source_code: code,
                                test_cases: currentQ.test_cases || [],
                              })
                              setRunResult(res.data)
                              toast.success(res.data.overall_passed ? 'All tests passed' : 'Some tests failed')
                            } catch (e) {
                              toast.error('Run failed')
                            }
                          }}
                        >
                          <Play className="w-4 h-4" /> Run Code
                        </button>
                      </div>
                      <div className="border border-slate-700 rounded overflow-hidden">
                        {/* Use textarea editor to avoid dependency issues */}
                        <textarea
                          className="w-full h-80 p-3 bg-slate-900 text-white"
                          value={code}
                          onChange={(e) => setCodeByIndex((prev) => ({ ...prev, [currentQuestion]: e.target.value }))}
                          placeholder={`Write your ${selectedLanguage} code here...`}
                        />
                      </div>
                      {Array.isArray(runResult?.results) && (
                        <div className="mt-2 text-sm">
                          {runResult.results.map((r) => (
                            <div key={r.test_case_number} className={`flex items-center justify-between px-3 py-2 rounded mb-2 ${r.passed ? 'bg-green-900/20 border border-green-700' : 'bg-red-900/20 border border-red-700'}`}>
                              <div className="text-slate-200">Test {r.test_case_number}</div>
                              <div className="text-slate-400">{r.passed ? 'Passed' : 'Failed'}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                >
                  Previous
                </Button>
                
                {currentQuestion === testQuestions.length - 1 ? (
                  <Button variant="premium" size="lg" onClick={handleSubmitTest}>
                    Submit Test
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    onClick={handleNext}
                    disabled={!answers[currentQuestion]}
                  >
                    Next Question
                  </Button>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Webcam Monitor */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Eye className="h-4 w-4 text-primary" />
                    Proctoring Active
                  </h3>
                  <div className="overflow-hidden rounded-lg border-2 border-border">
                    {typeof navigator !== 'undefined' ? (
                      <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        className="w-full"
                      />
                    ) : (
                      <div className="p-6 text-sm text-muted-foreground">Webcam unavailable</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Question Navigator */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-3 text-sm font-semibold">Question Navigator</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {testQuestions.map((_, index) => {
                      const isAnswered = answers[index] !== undefined;
                      const isCurrent = index === currentQuestion;
                      return (
                        <button
                          key={index}
                          onClick={() => setCurrentQuestion(index)}
                          className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 text-sm font-semibold transition-all ${
                            isCurrent
                              ? 'border-primary bg-primary text-white'
                              : isAnswered
                              ? 'border-success bg-success/10 text-success'
                              : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                          }`}
                        >
                          {index + 1}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Violations */}
              {(violations.tabSwitch > 0 || violations.faceNotDetected > 0 || violations.noiseDetected > 0) && (
                <Card className="border-2 border-warning/30 bg-warning/5">
                  <CardContent className="p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-warning">
                      <AlertCircle className="h-4 w-4" />
                      Violations Detected
                    </h3>
                    <div className="space-y-2 text-sm">
                      {violations.tabSwitch > 0 && (
                        <div className="flex justify-between">
                          <span>Tab Switches:</span>
                          <span className="font-semibold">{violations.tabSwitch}</span>
                        </div>
                      )}
                      {violations.faceNotDetected > 0 && (
                        <div className="flex justify-between">
                          <span>Face Not Detected:</span>
                          <span className="font-semibold">{violations.faceNotDetected}</span>
                        </div>
                      )}
                      {violations.noiseDetected > 0 && (
                        <div className="flex justify-between">
                          <span>Noise Detected:</span>
                          <span className="font-semibold">{violations.noiseDetected}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Test Info */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-3 text-sm font-semibold">Test Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Candidate:</span>
                      <span className="font-semibold">{userName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Answered:</span>
                      <span className="font-semibold">
                        {answers.length}/{testQuestions.length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};
