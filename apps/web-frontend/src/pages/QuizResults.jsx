import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { 
  Trophy, 
  Zap, 
  Star, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  Home,
  RotateCcw,
  Target,
  Award
} from 'lucide-react';

const QuizResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const result = location.state?.result;
  const quizTitle = location.state?.quizTitle || 'Quiz';

  if (!result) {
    return (
      <Layout showSidebar={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">No Results Found</h2>
            <p className="text-slate-400 mb-6 text-lg">Quiz results not available.</p>
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

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreMessage = (score) => {
    if (score >= 90) return 'Outstanding! You\'re a true master!';
    if (score >= 80) return 'Excellent work! You\'re doing great!';
    if (score >= 70) return 'Good effort! Keep up the momentum!';
    if (score >= 60) return 'Not bad! Practice makes perfect!';
    return 'Keep studying! Every expert was once a beginner!';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return <Trophy className="w-8 h-8" />;
    if (score >= 60) return <Star className="w-8 h-8" />;
    return <Target className="w-8 h-8" />;
  };

  return (
    <Layout showSidebar={false}>
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          {/* Main Results Card */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                  {getScoreIcon(result.score)}
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h1>
              <p className="text-blue-100">{quizTitle}</p>
            </div>

            <div className="p-8">
              {/* Score Display */}
              <div className="text-center mb-8">
                <div className={`text-8xl font-bold ${getScoreColor(result.score)} mb-4`}>
                  {result.score}%
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  {getScoreMessage(result.score)}
                </h2>
                <p className="text-slate-400 text-lg">
                  You answered {result.correct_answers} out of {result.total_questions} questions correctly.
                </p>
              </div>

              {/* XP and Level Info */}
              <div className="bg-slate-700 rounded-xl p-6 mb-8">
                <h3 className="text-lg font-bold text-white mb-4 text-center">Rewards Earned</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-green-400">+{result.xp_earned}</div>
                    <div className="text-sm text-slate-400">XP Earned</div>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Star className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-blue-400">{result.new_total_xp}</div>
                    <div className="text-sm text-slate-400">Total XP</div>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-purple-400">Level {result.new_level}</div>
                    <div className="text-sm text-slate-400">New Level</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center justify-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Back to Dashboard
                </button>
                <button
                  onClick={() => navigate('/courses')}
                  className="flex items-center justify-center px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Try Another Quiz
                </button>
              </div>

              {/* Performance Insights */}
              <div className="bg-slate-700 rounded-xl p-6 mb-8">
                <h3 className="text-lg font-bold text-white mb-4 text-center">Performance Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-slate-600 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <CheckCircle className="w-6 h-6 text-green-400 mr-2" />
                      <div className="text-2xl font-bold text-green-400">{result.correct_answers}</div>
                    </div>
                    <div className="text-sm text-slate-300">Correct Answers</div>
                  </div>
                  <div className="text-center p-4 bg-slate-600 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <XCircle className="w-6 h-6 text-red-400 mr-2" />
                      <div className="text-2xl font-bold text-red-400">
                        {result.total_questions - result.correct_answers}
                      </div>
                    </div>
                    <div className="text-sm text-slate-300">Incorrect Answers</div>
                  </div>
                  <div className="text-center p-4 bg-slate-600 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <Target className="w-6 h-6 text-blue-400 mr-2" />
                      <div className="text-2xl font-bold text-blue-400">{result.score}%</div>
                    </div>
                    <div className="text-sm text-slate-300">Overall Score</div>
                  </div>
                </div>
              </div>

              {/* Wrong Answers Review */}
              {result.wrong_questions && result.wrong_questions.length > 0 && (
                <div className="bg-slate-700 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 text-center">
                    Questions to Review
                  </h3>
                  <div className="space-y-4">
                    {result.wrong_questions.map((wrong, index) => (
                      <div key={index} className="border border-red-500/50 rounded-lg p-4 bg-red-500/10">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-red-400">
                            Question {index + 1}
                          </span>
                          <div className="text-sm text-red-300">
                            Your answer: {wrong.user_answer} | Correct: {wrong.correct_answer}
                          </div>
                        </div>
                        <p className="text-sm text-slate-300">
                          Review this topic to improve your understanding.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default QuizResults;
