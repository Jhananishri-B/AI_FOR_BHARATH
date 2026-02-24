import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { quizzesAPI } from '../services/api';
import CodeEditor from '../components/quiz/CodeEditor';
import Layout from '../components/Layout';
import { 
    Clock, 
    ChevronLeft, 
    ChevronRight, 
    CheckCircle, 
    Loader2, 
    AlertCircle,
    Trophy,
    Zap,
    Target,
    BookOpen
} from 'lucide-react';

// A new component to display the quiz results cleanly
const QuizResults = ({ feedback, onRetry, failedProblemIds, onGeneratePracticePlan }) => {
    const navigate = useNavigate();
    const { score, xp_earned, new_total_xp, new_level } = feedback;

    return (
        <div className="flex items-center justify-center min-h-screen p-6">
            <div className="w-full max-w-2xl bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-8 text-center">
                <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h1 className="text-4xl font-bold text-white mb-2">Quiz Complete!</h1>
                <p className="text-slate-400 mb-6 text-lg">Well done, you've completed the quiz.</p>

                <div className="bg-slate-700 rounded-xl p-6 mb-6 grid grid-cols-2 gap-4 text-left">
                    <div>
                        <p className="text-sm text-slate-400">Your Score</p>
                        <p className="text-3xl font-bold text-blue-400">{score}%</p>
                    </div>
                    <div className="flex items-center space-x-2">
                         <Zap className="w-8 h-8 text-yellow-400" />
                        <div>
                            <p className="text-sm text-slate-400">XP Earned</p>
                            <p className="text-3xl font-bold text-white">+{xp_earned}</p>
                        </div>
                    </div>
                </div>

                {/* Adaptive Practice Section */}
                {failedProblemIds && failedProblemIds.length > 0 && (
                    <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 rounded-xl p-6 mb-6 border border-orange-700">
                        <Target className="w-8 h-8 text-orange-400 mx-auto mb-3" />
                        <h3 className="text-xl font-bold text-white mb-2">Need More Practice?</h3>
                        <p className="text-slate-300 mb-4">
                            Don't worry! Let our AI create a personalized practice plan to help you improve.
                        </p>
                        <button
                            onClick={onGeneratePracticePlan}
                            className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-200 font-medium flex items-center mx-auto"
                        >
                            <BookOpen className="w-5 h-5 mr-2" />
                            Build My Personalized Practice Plan
                        </button>
                    </div>
                )}

                <div className="flex justify-center space-x-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-slate-600 text-white px-6 py-3 rounded-lg hover:bg-slate-500 transition-all duration-200 font-medium"
                    >
                        Go to Dashboard
                    </button>
                    <button
                        onClick={onRetry}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        </div>
    );
};


const Quiz = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    
    // --- State Management ---
    const [quizData, setQuizData] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false); // Moved inside
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState(0);
    const [feedback, setFeedback] = useState(null); // Will hold quiz results
    const [failedProblemIds, setFailedProblemIds] = useState([]); // Problems user got wrong
    const [practicePlan, setPracticePlan] = useState(null); // AI-generated practice plan
    const [isLoadingPlan, setIsLoadingPlan] = useState(false); // Loading state for practice plan

    // --- Effects ---
    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const response = await quizzesAPI.getQuizQuestions(sessionId);
                setQuizData(response.data);
                
                const endTime = new Date(response.data.end_time);
                const now = new Date();
                const timeDiff = Math.max(0, Math.floor((endTime - now) / 1000));
                setTimeLeft(timeDiff);
            } catch (err) {
                setError('Failed to load quiz. The session may have expired or is invalid.');
                console.error('Error fetching quiz:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [sessionId]);

    useEffect(() => {
        if (timeLeft <= 0 || !quizData) return;
        
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmitQuiz();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, quizData]);

    // --- Handlers ---
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswerChange = (questionId, answer) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < quizData.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmitQuiz = async () => {
        if (isSubmitting) return; // Guard clause to prevent double submit
        
        setIsSubmitting(true);
        try {
            const answersArray = Object.entries(answers).map(([question_id, answer]) => ({
                question_id,
                answer
            }));

            const response = await quizzesAPI.submitQuiz(sessionId, answersArray);
            setFeedback(response.data); // Set feedback to show the results screen
            
            // Extract failed problem IDs if score is below 80%
            if (response.data.score < 80 && Array.isArray(response.data.wrong_questions)) {
                const ids = response.data.wrong_questions
                    .map(w => (typeof w === 'string' ? w : w.q_id))
                    .filter(Boolean);
                setFailedProblemIds(ids);
            }
        } catch (err) {
            setError('Failed to submit quiz. Please try again.');
            console.error('Error submitting quiz:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRetry = () => {
        // Find the course slug to navigate back and restart
        // This is a simplified approach; in a real app, you might get this from quizData
        navigate('/courses'); 
    };

    const handleGeneratePracticePlan = async () => {
        if (isLoadingPlan || !failedProblemIds.length) return;
        
        setIsLoadingPlan(true);
        try {
            const response = await quizzesAPI.generatePracticePlan(failedProblemIds);
            setPracticePlan(response.data);
        } catch (err) {
            console.error('Error generating practice plan:', err);
            setError('Failed to generate practice plan. Please try again.');
        } finally {
            setIsLoadingPlan(false);
        }
    };

    // --- Render Logic ---

    if (loading) {
        return (
            <Layout showSidebar={false}>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
                        <p className="text-slate-400 text-lg">Loading quiz...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error || !quizData) {
        return (
            <Layout showSidebar={false}>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-white mb-4">Quiz Error</h2>
                        <p className="text-slate-400 mb-6 text-lg">{error || 'Quiz not found'}</p>
                        <button
                            onClick={() => navigate('/courses')}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
                        >
                            Back to Courses
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }
    
    // If feedback is present, show the results screen instead of the quiz
    if (feedback) {
        return (
            <Layout showSidebar={false}>
                <QuizResults 
                    feedback={feedback} 
                    onRetry={handleRetry}
                    failedProblemIds={failedProblemIds}
                    onGeneratePracticePlan={handleGeneratePracticePlan}
                />
                {/* Practice Plan Display */}
                {practicePlan && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">Your Personalized Practice Plan</h2>
                                <button
                                    onClick={() => setPracticePlan(null)}
                                    className="text-slate-400 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>
                            
                            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-6 mb-6 border border-blue-700">
                                <p className="text-slate-200 text-lg leading-relaxed">
                                    {practicePlan.message}
                                </p>
                            </div>
                            
                            <div className="space-y-4">
                                <h3 className="text-xl font-semibold text-white mb-4">Recommended Practice Problems:</h3>
                                {practicePlan.problems.map((problem, index) => (
                                    <Link
                                        key={problem.problem_id}
                                        to={`/practice/${problem.problem_id}`}
                                        className="block bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-all duration-200 border border-slate-600 hover:border-blue-500"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="text-white font-semibold mb-1">
                                                    {index + 1}. {problem.title}
                                                </h4>
                                                <p className="text-slate-400 text-sm">
                                                    Difficulty: <span className="capitalize">{problem.difficulty}</span>
                                                </p>
                                            </div>
                                            <BookOpen className="w-5 h-5 text-blue-400 flex-shrink-0" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            
                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setPracticePlan(null)}
                                    className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-500 transition-all duration-200"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Layout>
        );
    }

    const currentQuestion = quizData.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === quizData.questions.length - 1;
    const isFirstQuestion = currentQuestionIndex === 0;

    return (
        <Layout showSidebar={false}>
            <div className="min-h-screen flex flex-col bg-slate-900 text-white">
                {/* Header */}
                <div className="bg-slate-800 border-b border-slate-700">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                             <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">Python Basics Quiz</h1>
                                <p className="text-slate-400 text-sm">
                                    Question {currentQuestionIndex + 1} of {quizData.questions.length}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-6">
                            <div className="text-right">
                                <div className="text-xl font-bold text-blue-400">
                                    {Math.round(((currentQuestionIndex) / quizData.questions.length) * 100)}%
                                </div>
                                <div className="text-xs text-slate-400">Progress</div>
                            </div>
                             <div className="text-right">
                                <div className="flex items-center space-x-2">
                                    <Clock className="w-5 h-5 text-red-400" />
                                    <div className="text-xl font-bold text-red-400">
                                        {formatTime(timeLeft)}
                                    </div>
                                </div>
                                <div className="text-xs text-slate-400">Time Left</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="w-full max-w-4xl">
                        {/* Progress Bar */}
                         <div className="w-full bg-slate-700 rounded-full h-2 mb-8">
                            <div 
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%` }}
                            />
                        </div>

                        {/* Question Content */}
                        <div className="p-8 bg-slate-800 rounded-2xl border border-slate-700">
                             {currentQuestion.type === 'mcq' && (
                                <>
                                    <h2 className="text-2xl font-semibold text-white mb-6 leading-relaxed">{currentQuestion.prompt}</h2>
                                    <div className="space-y-3">
                                        {currentQuestion.choices.map((choice, index) => (
                                            <label key={index} className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${answers[currentQuestion.id] === String(index) ? 'border-blue-500 bg-blue-900/30' : 'border-slate-600 hover:border-slate-500'}`}>
                                                <input
                                                    type="radio"
                                                    name={`question-${currentQuestion.id}`}
                                                    value={index}
                                                    checked={answers[currentQuestion.id] === String(index)}
                                                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                                    className="sr-only"
                                                />
                                                <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mr-4 flex items-center justify-center ${answers[currentQuestion.id] === String(index) ? 'border-blue-500 bg-blue-500' : 'border-slate-400'}`}>
                                                     {answers[currentQuestion.id] === String(index) && <div className="w-2 h-2 bg-white rounded-full" />}
                                                </span>
                                                <span className="text-slate-200">{choice}</span>
                                            </label>
                                        ))}
                                    </div>
                                </>
                            )}

                            {currentQuestion.type === 'code' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <h2 className="text-2xl font-semibold text-white mb-4 leading-relaxed">{currentQuestion.prompt}</h2>
                                        <div className="space-y-4">
                                            {currentQuestion.public_test_cases.map((ex, idx) => (
                                                <div key={idx}>
                                                    <p className="font-semibold text-slate-300 mb-1">Example {idx + 1}:</p>
                                                    <div className="bg-slate-900 p-3 rounded-lg text-sm font-mono">
                                                        <p><span className="text-slate-400">Input:</span> <span className="text-white">{ex.input}</span></p>
                                                        <p><span className="text-slate-400">Output:</span> <span className="text-white">{ex.expected_output}</span></p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <CodeEditor
                                            value={answers[currentQuestion.id] || currentQuestion.code_starter || ''}
                                            onChange={(code) => handleAnswerChange(currentQuestion.id, code)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Navigation */}
                            <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-700">
                                <button onClick={handlePrevious} disabled={isFirstQuestion} className="px-5 py-2 border border-slate-600 rounded-md text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                                {isLastQuestion ? (
                                    <button onClick={handleSubmitQuiz} disabled={isSubmitting} className="flex items-center px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-md font-semibold disabled:opacity-50">
                                        {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : 'Submit Quiz'}
                                    </button>
                                ) : (
                                    <button onClick={handleNext} className="px-5 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700">Next</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Quiz;