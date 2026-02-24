import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { coursesAPI, usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  Lock, 
  Star, 
  Zap, 
  BookOpen, 
  Code, 
  HelpCircle, 
  Edit3,
  Loader2,
  AlertCircle
} from 'lucide-react';

const ModuleHubPage = () => {
  const { slug, moduleId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, refreshUserProgress } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkCompletion = async () => {
      if (course?.id) {
        try {
          await usersAPI.checkCourseCompletion(course.id);
          // Optionally refresh user progress again to reflect the change
          refreshUserProgress();
        } catch (err) {
          console.error("Failed to check/update course completion status:", err);
        }
      }
    };

    // Check completion status when the component mounts and user progress is available
    if (user) {
      checkCompletion();
    }
  }, [user, course?.id]);

  useEffect(() => {
    fetchModuleData();
  }, [slug, moduleId]);

  // Ensure we have fresh progress so locking reflects latest completions
  useEffect(() => {
    if (isAuthenticated) {
      refreshUserProgress();
    }
  }, [isAuthenticated, slug, moduleId]);

  const fetchModuleData = async () => {
    try {
      const response = await coursesAPI.getCourseBySlug(slug);
      const courseData = response.data;
      setCourse(courseData);

      // Find the specific module
      const moduleData = courseData.modules.find(m => m.module_id === moduleId);
      if (moduleData) {
        setModule(moduleData);
      } else {
        setError('Module not found');
      }
    } catch (err) {
      setError('Failed to load module data');
      console.error('Error fetching module:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTopicStatus = (topic, topicIndex) => {
    if (!isAuthenticated) return 'locked';
    
    const isCompleted = user?.completed_topics && user.completed_topics.includes(topic.topic_id);
    const isUnlocked = topicIndex === 0 || 
      (user?.completed_topics && 
       module.topics.slice(0, topicIndex).every(t => user.completed_topics.includes(t.topic_id)));
    
    if (isCompleted) return 'completed';
    if (isUnlocked) return 'unlocked';
    return 'locked';
  };

  const getCardIcon = (type) => {
    switch (type) {
      case 'theory': return <BookOpen className="w-4 h-4" />;
      case 'mcq': return <HelpCircle className="w-4 h-4" />;
      case 'code': return <Code className="w-4 h-4" />;
      case 'fill-in-blank': return <Edit3 className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getCardTypeLabel = (type) => {
    switch (type) {
      case 'theory': return 'Theory';
      case 'mcq': return 'Quiz';
      case 'code': return 'Code';
      case 'fill-in-blank': return 'Fill-in';
      default: return 'Theory';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading module...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !module) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Module Not Found</h2>
            <p className="text-slate-400 mb-6">{error || 'The requested module could not be found.'}</p>
            <Link
              to={`/courses/${slug}`}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
            >
              Back to Course
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
            to={`/courses/${slug}`} 
            className="flex items-center text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {course?.title}
          </Link>
        </nav>

        {/* Module Header */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl mb-8">
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {course?.modules.findIndex(m => m.module_id === moduleId) + 1}
                  </span>
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">{module.title}</h1>
                  <p className="text-slate-400 text-lg">
                    {module.topics?.length || 0} topics • {module.topics?.reduce((sum, topic) => sum + (topic.xp_reward || 50), 0) || 0} XP available
                  </p>
                </div>
              </div>
            </div>
            
            {/* Module Progress */}
            <div className="flex items-center space-x-8 mb-6">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-blue-400" />
                <span className="text-2xl font-bold text-blue-400">
                  {user?.completed_topics ? 
                    module.topics?.filter(topic => user.completed_topics.includes(topic.topic_id)).length || 0 
                    : 0}
                </span>
                <span className="text-slate-400">/{module.topics?.length || 0} completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-2xl font-bold text-yellow-400">
                  {user?.completed_topics ? 
                    module.topics?.filter(topic => user.completed_topics.includes(topic.topic_id))
                      .reduce((sum, topic) => sum + (topic.xp_reward || 50), 0) || 0 
                    : 0}
                </span>
                <span className="text-slate-400">XP earned</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-700 rounded-full h-3 mb-6">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${module.topics?.length ? 
                    ((user?.completed_topics ? 
                      module.topics.filter(topic => user.completed_topics.includes(topic.topic_id)).length 
                      : 0) / module.topics.length) * 100 
                    : 0}%` 
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Topics Grid */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-white mb-2">Topics in This Module</h3>
            <p className="text-slate-400">Complete topics in order to unlock your progress</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {module.topics?.map((topic, topicIndex) => {
              const status = getTopicStatus(topic, topicIndex);
              const isCompleted = status === 'completed';
              const isUnlocked = status === 'unlocked';
              const isLocked = status === 'locked';
              
              return (
                <div 
                  key={topic.topic_id} 
                  className={`
                    relative bg-slate-700 rounded-xl p-6 border transition-all duration-300 transform hover:scale-105
                    ${isCompleted 
                      ? 'border-green-500 shadow-lg shadow-green-500/20' 
                      : isUnlocked 
                        ? 'border-blue-500 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30' 
                        : 'border-slate-600 opacity-60'
                    }
                  `}
                >
                  {/* Topic Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center
                        ${isCompleted 
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                          : isUnlocked 
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                            : 'bg-gradient-to-br from-slate-600 to-slate-700'
                        }
                      `}>
                        <span className="text-white font-bold">{topicIndex + 1}</span>
                      </div>
                      <div>
                        <h4 className={`font-semibold ${isCompleted ? 'text-green-400' : isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                          {topic.title}
                        </h4>
                        <p className="text-slate-400 text-sm">
                          {topic.cards?.length || 0} cards • {topic.xp_reward || 50} XP
                        </p>
                      </div>
                    </div>
                    
                    {/* Status Icon */}
                    <div className="flex items-center">
                      {isCompleted && <CheckCircle className="w-6 h-6 text-green-500" />}
                      {isLocked && <Lock className="w-6 h-6 text-slate-500" />}
                    </div>
                  </div>
                  
                  {/* Card Types Preview */}
                  {topic.cards && topic.cards.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {topic.cards.map((card, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center space-x-1 px-2 py-1 bg-slate-600 rounded text-xs text-slate-300"
                          >
                            {getCardIcon(card.type)}
                            <span>{getCardTypeLabel(card.type)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Action Button */}
                  <div className="mt-4">
                    {isAuthenticated ? (
                      <button
                        onClick={() => {
                          if (isUnlocked) {
                            navigate(`/courses/${slug}/modules/${moduleId}/topics/${topic.topic_id}`);
                          }
                        }}
                        disabled={isLocked}
                        className={`
                          w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2
                          ${isCompleted 
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white' 
                            : isUnlocked 
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white' 
                              : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                          }
                        `}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Completed
                          </>
                        ) : isUnlocked ? (
                          <>
                            <Play className="w-5 h-5" />
                            Start Topic
                          </>
                        ) : (
                          <>
                            <Lock className="w-5 h-5" />
                            Locked
                          </>
                        )}
                      </button>
                    ) : (
                      <Link
                        to="/login"
                        className="w-full py-3 px-4 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <Play className="w-5 h-5" />
                        Sign In to Start
                      </Link>
                    )}
                  </div>
                  
                  {/* Completion Badge */}
                  {isCompleted && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ModuleHubPage;
