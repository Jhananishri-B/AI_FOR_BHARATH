import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { coursesAPI, quizzesAPI, usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { 
  BookOpen, 
  Zap, 
  Clock, 
  ArrowLeft, 
  Play, 
  CheckCircle,
  Bot,
  Lock,
  Star,
  Loader2,
  AlertCircle
} from 'lucide-react';

const CourseDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, refreshUserProgress } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await coursesAPI.getCourseBySlug(slug);
        setCourse(response.data);
      } catch (err) {
        setError('Failed to load course');
        console.error('Error fetching course:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [slug]);

  // Keep progress fresh so module unlocks reflect latest completions
  useEffect(() => {
    if (isAuthenticated) {
      refreshUserProgress();
    }
  }, [isAuthenticated, slug]);

  // When the user completes all modules, trigger a final check
  useEffect(() => {
    if (course && user) {
      const allModuleIds = course.modules.map(m => m.module_id);
      const completedModules = new Set(user.completed_modules || []);
      const isCourseComplete = allModuleIds.every(id => completedModules.has(id));

      if (isCourseComplete) {
        // Call the check endpoint to finalize completion on the backend
        usersAPI.checkCourseCompletion(course.id || course.slug)
          .then(() => {
            // Refresh user data to get the `completed_courses` update
            refreshUserProgress();
          })
          .catch(err => {
            console.error("Error finalizing course completion:", err);
          });
      }
    }
  }, [user, course, refreshUserProgress]);

  // Refresh progress when returning to this page
  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated) {
        refreshUserProgress();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, refreshUserProgress]);

  const handleStartQuiz = async () => {
    if (!course?.id) return;
    
    try {
      // Generate AI quiz for this course
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/ai-quiz/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          course_id: course.id,
          difficulty: 'medium',
          num_questions: 5
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate quiz');
      }
      
      const quizData = await response.json();
      navigate(`/quiz/${quizData.session_id}`);
    } catch (err) {
      console.error('Error starting quiz:', err);
      setError('Failed to start quiz. Please try again.');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading course...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !course) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Course Not Found</h2>
            <p className="text-slate-400 mb-6">{error || 'The requested course could not be found.'}</p>
            <Link
              to="/courses"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
            >
              Back to Courses
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        {/* Breadcrumb */}
        <nav className="flex items-center mb-8" aria-label="Breadcrumb">
          <Link 
            to="/courses" 
            className="flex items-center text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Link>
        </nav>

        {/* Course Header */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl mb-8">
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">{course.title}</h1>
                  <p className="text-slate-400 text-lg leading-relaxed">{course.description}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-8 mb-6">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-2xl font-bold text-yellow-400">{course.xp_reward}</span>
                <span className="text-slate-400">XP Reward</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="text-2xl font-bold text-blue-400">{course.modules?.length || 0}</span>
                <span className="text-slate-400">Modules</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to={`/tutor/${course.id}`}
                    className="flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg"
                  >
                    <Bot className="w-5 h-5 mr-2" />
                    Ask AI Tutor
                  </Link>
                  <button
                    onClick={handleStartQuiz}
                    className="flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Take AI Quiz
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Sign In to Start Learning
                </Link>
              )}
            </div>

          </div>
        </div>

        {/* Visual Journey Map */}
        {course.modules && course.modules.length > 0 && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-white mb-2">Your Learning Journey</h3>
              <p className="text-slate-400">Complete modules in order to unlock your path to mastery</p>
            </div>
            
            {/* Journey Path */}
            <div className="relative">
              {/* Path Line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 transform -translate-y-1/2 rounded-full opacity-30"></div>
              
              {/* Module Nodes */}
              <div className="relative flex justify-between items-center">
                {course.modules.map((module, moduleIndex) => {
                  // Fallback unlock: if previous module's all topics are completed, unlock this module
                  let prevModuleCompleted = false;
                  if (moduleIndex > 0) {
                    const prev = course.modules[moduleIndex - 1];
                    const prevTopics = prev?.topics || [];
                    const completedTopicsSet = new Set(user?.completed_topics || []);
                    prevModuleCompleted = prevTopics.length > 0 && prevTopics.every(t => completedTopicsSet.has(t.topic_id));
                  }
                  const isUnlocked = moduleIndex === 0 
                    || (user?.completed_modules && user.completed_modules.includes(module.module_id))
                    || prevModuleCompleted;
                  const isCompleted = user?.completed_modules && user.completed_modules.includes(module.module_id);
                  const totalTopics = module.topics?.length || 0;
                  const completedTopics = user?.completed_topics ? 
                    module.topics?.filter(topic => user.completed_topics.includes(topic.topic_id)).length || 0 : 0;
                  
                  return (
                    <div key={module.module_id} className="flex flex-col items-center group">
                      {/* Module Node */}
                      <div 
                        className={`
                          relative w-20 h-20 rounded-full flex items-center justify-center cursor-pointer
                          transition-all duration-300 transform group-hover:scale-110
                          ${isCompleted 
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30' 
                            : isUnlocked 
                              ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50' 
                              : 'bg-gradient-to-br from-slate-600 to-slate-700 cursor-not-allowed opacity-50'
                          }
                        `}
                        onClick={() => {
                          if (isUnlocked && isAuthenticated) {
                            navigate(`/courses/${slug}/modules/${module.module_id}`);
                          }
                        }}
                      >
                        {/* Module Number */}
                        <span className="text-white font-bold text-xl">
                          {moduleIndex + 1}
                        </span>
                        
                        {/* Status Icons */}
                        {isCompleted && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        )}
                        
                        {!isUnlocked && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-500 rounded-full flex items-center justify-center">
                            <Lock className="w-4 h-4 text-white" />
                          </div>
                        )}
                        
                        {/* Hover Effect */}
                        <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                    </div>
                      
                      {/* Module Info */}
                      <div className="mt-4 text-center max-w-32">
                        <h4 className={`text-sm font-semibold mb-1 ${isCompleted ? 'text-green-400' : isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                        {module.title}
                      </h4>
                        <div className="flex items-center justify-center space-x-1 text-xs text-slate-400">
                          <Star className="w-3 h-3" />
                          <span>{completedTopics}/{totalTopics}</span>
                        </div>
                        <div className="flex items-center justify-center space-x-1 text-xs text-slate-400 mt-1">
                          <Zap className="w-3 h-3" />
                          <span>{module.topics?.reduce((sum, topic) => sum + (topic.xp_reward || 50), 0) || 0} XP</span>
                    </div>
                  </div>
                  
                      {/* Progress Ring */}
                      {isUnlocked && !isCompleted && (
                        <div className="absolute inset-0 w-20 h-20">
                          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                            <circle
                              cx="40"
                              cy="40"
                              r="36"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              className="text-slate-700"
                            />
                            <circle
                              cx="40"
                              cy="40"
                              r="36"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 36}`}
                              strokeDashoffset={`${2 * Math.PI * 36 * (1 - completedTopics / totalTopics)}`}
                              className="text-blue-500 transition-all duration-500"
                            />
                          </svg>
                                </div>
                              )}
                            </div>
                  );
                })}
              </div>
            </div>
            
            {/* Journey Stats */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-700 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-1">Total Modules</h4>
                <p className="text-2xl font-bold text-blue-400">{course.modules.length}</p>
                          </div>
                          
              <div className="bg-slate-700 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-1">Completed</h4>
                <p className="text-2xl font-bold text-green-400">
                  {user?.completed_modules ? user.completed_modules.length : 0}
                </p>
                        </div>
              
              <div className="bg-slate-700 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-white" />
                    </div>
                <h4 className="text-lg font-semibold text-white mb-1">Total XP</h4>
                <p className="text-2xl font-bold text-yellow-400">{course.xp_reward}</p>
                </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CourseDetail;
