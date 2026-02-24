import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { 
  Brain, 
  MessageCircle, 
  Target, 
  BookOpen, 
  Zap, 
  TrendingUp,
  Bell,
  CheckCircle,
  Clock,
  Star,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Lightbulb,
  Trophy,
  BarChart3,
  Users,
  Settings,
  Send,
  Loader2,
  AlertCircle
} from 'lucide-react';

const EnhancedCoachPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [topicRecommendations, setTopicRecommendations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [userStats, setUserStats] = useState(null);

  // Initialize with welcome message
  useEffect(() => {
    if (isAuthenticated) {
      setMessages([{
        id: 1,
        role: 'assistant',
        content: `Hello ${user?.name || 'Student'}! I'm Questie, your AI learning coach. I'm here to help you learn from your mistakes and improve your skills. What would you like to work on today?`,
        timestamp: new Date()
      }]);
      loadTopicRecommendations();
      loadNotifications();
      loadUserStats();
    }
  }, [isAuthenticated, user]);

  const loadTopicRecommendations = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/ai-quiz/recommend-topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          user_id: user?.id,
          course_id: null
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setTopicRecommendations(data.recommended_topics || []);
      }
    } catch (error) {
      console.error('Error loading topic recommendations:', error);
    }
  };

  const loadNotifications = async () => {
    // Simulate notifications for now
    setNotifications([
      {
        id: 1,
        type: 'recommendation',
        title: 'New Topic Recommendation',
        message: 'Based on your recent quiz performance, I recommend focusing on Python Functions',
        timestamp: new Date(),
        read: false
      },
      {
        id: 2,
        type: 'achievement',
        title: 'Learning Streak!',
        message: 'You\'ve been learning for 5 days straight! Keep it up!',
        timestamp: new Date(),
        read: false
      }
    ]);
  };

  const loadUserStats = async () => {
    // Simulate user stats
    setUserStats({
      totalQuizzes: 12,
      averageScore: 78,
      learningStreak: 5,
      topicsCompleted: 8,
      xpEarned: 1250,
      weakAreas: ['Python Functions', 'Data Structures'],
      strongAreas: ['Basic Syntax', 'Variables']
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: newMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/ai/coach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopicClick = async (topic) => {
    const message = `I want to learn about ${topic.topic_name}. Can you help me understand this topic better?`;
    setNewMessage(message);
    setActiveTab('chat');
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
            <p className="text-slate-400">Please log in to access your AI coach.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-slate-900">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Questie AI Coach</h1>
                  <p className="text-slate-400">Your personalized learning companion</p>
                </div>
              </div>
              
              {/* Notifications */}
              <div className="relative">
                <button className="p-2 text-slate-400 hover:text-white transition-colors">
                  <Bell className="w-6 h-6" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Navigation Tabs */}
              <div className="bg-slate-800 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Coach Features</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'chat' 
                        ? 'bg-purple-600 text-white' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Chat with Questie</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('topics')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'topics' 
                        ? 'bg-purple-600 text-white' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <Target className="w-5 h-5" />
                    <span>Topic Recommendations</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('stats')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'stats' 
                        ? 'bg-purple-600 text-white' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span>Learning Analytics</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'notifications' 
                        ? 'bg-purple-600 text-white' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <Bell className="w-5 h-5" />
                    <span>Notifications</span>
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {notifications.filter(n => !n.read).length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              {userStats && (
                <div className="bg-slate-800 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Learning Streak</span>
                      <span className="text-green-400 font-semibold">{userStats.learningStreak} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Average Score</span>
                      <span className="text-blue-400 font-semibold">{userStats.averageScore}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">XP Earned</span>
                      <span className="text-yellow-400 font-semibold">{userStats.xpEarned}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Chat Interface */}
              {activeTab === 'chat' && (
                <div className="bg-slate-800 rounded-xl h-[600px] flex flex-col">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-4 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-700 text-white'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-70 mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-slate-700 text-white p-4 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Questie is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="border-t border-slate-700 p-4">
                    <div className="flex space-x-4">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Ask Questie anything about your learning..."
                        className="flex-1 bg-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled={isLoading}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || isLoading}
                        className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <Send className="w-5 h-5" />
                        <span>Send</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Topic Recommendations */}
              {activeTab === 'topics' && (
                <div className="space-y-6">
                  <div className="bg-slate-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-white">Recommended Topics</h2>
                      <button
                        onClick={loadTopicRecommendations}
                        className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Refresh</span>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {topicRecommendations.map((topic, index) => (
                        <div
                          key={index}
                          className="bg-slate-700 rounded-lg p-6 hover:bg-slate-600 transition-colors cursor-pointer"
                          onClick={() => handleTopicClick(topic)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-semibold text-white">{topic.topic_name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              topic.priority === 'high' ? 'bg-red-500 text-white' :
                              topic.priority === 'medium' ? 'bg-yellow-500 text-white' :
                              'bg-green-500 text-white'
                            }`}>
                              {topic.priority}
                            </span>
                          </div>
                          <p className="text-slate-300 text-sm mb-3">{topic.reason}</p>
                          <div className="flex items-center justify-between text-sm text-slate-400">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{topic.estimated_time}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4" />
                              <span className="capitalize">{topic.difficulty}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Learning Analytics */}
              {activeTab === 'stats' && userStats && (
                <div className="space-y-6">
                  <div className="bg-slate-800 rounded-xl p-6">
                    <h2 className="text-2xl font-bold text-white mb-6">Learning Analytics</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <div className="bg-slate-700 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <Trophy className="w-8 h-8 text-yellow-400" />
                          <div>
                            <p className="text-slate-400 text-sm">Total Quizzes</p>
                            <p className="text-2xl font-bold text-white">{userStats.totalQuizzes}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-slate-700 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <TrendingUp className="w-8 h-8 text-green-400" />
                          <div>
                            <p className="text-slate-400 text-sm">Average Score</p>
                            <p className="text-2xl font-bold text-white">{userStats.averageScore}%</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-slate-700 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <Zap className="w-8 h-8 text-blue-400" />
                          <div>
                            <p className="text-slate-400 text-sm">Learning Streak</p>
                            <p className="text-2xl font-bold text-white">{userStats.learningStreak} days</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-slate-700 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <BookOpen className="w-8 h-8 text-purple-400" />
                          <div>
                            <p className="text-slate-400 text-sm">Topics Completed</p>
                            <p className="text-2xl font-bold text-white">{userStats.topicsCompleted}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-700 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-3">Areas to Improve</h3>
                        <div className="space-y-2">
                          {userStats.weakAreas.map((area, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <AlertCircle className="w-4 h-4 text-red-400" />
                              <span className="text-slate-300">{area}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-slate-700 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-3">Strong Areas</h3>
                        <div className="space-y-2">
                          {userStats.strongAreas.map((area, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-slate-300">{area}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications */}
              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`bg-slate-800 rounded-lg p-4 border-l-4 ${
                        notification.type === 'recommendation' ? 'border-blue-500' :
                        notification.type === 'achievement' ? 'border-green-500' :
                        'border-yellow-500'
                      } ${!notification.read ? 'bg-slate-700' : ''}`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white">{notification.title}</h3>
                          <p className="text-slate-300 mt-1">{notification.message}</p>
                          <p className="text-slate-400 text-sm mt-2">
                            {notification.timestamp.toLocaleString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-4 mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EnhancedCoachPage;
