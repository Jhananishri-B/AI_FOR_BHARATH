import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Target, BookOpen } from 'lucide-react';
import { aiAPI } from '../services/api';

const CoachPage = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi there! I'm Questie, your AI learning coach! 🌟 I'm here to help you stay motivated and guide you on your learning journey. How are you feeling about your progress today?"
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage.trim()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await aiAPI.coach(newMessages);
      const assistantMessage = {
        role: 'assistant',
        content: response.data.response
      };
      
      setMessages([...newMessages, assistantMessage]);
      if (response.data.recommendations) {
        setRecommendations(response.data.recommendations);
      }
    } catch (error) {
      console.error('Error sending message to AI Coach:', error);
      const errorMessage = {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment!"
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Coach</h1>
            <p className="text-slate-400">Meet Questie, your personal learning companion</p>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-sm text-slate-300">
            <strong className="text-purple-400">Questie</strong> is here to motivate you, celebrate your achievements, 
            and help you decide what to learn next. For technical questions about specific courses, 
            visit the AI Tutor within that course.
          </p>
        </div>
      </div>

      {/* Personalized Recommendations */}
      {recommendations && (
        <div className="mb-6 space-y-4">
          {Array.isArray(recommendations.weaker_topics) && recommendations.weaker_topics.length > 0 && (
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center space-x-2 mb-3">
                <Target className="w-5 h-5 text-orange-400" />
                <h3 className="text-white font-semibold">Focus Topics</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendations.weaker_topics.map((t, idx) => (
                  <div key={idx} className="p-3 rounded-md border border-slate-600 bg-slate-900">
                    <div className="text-white font-medium">{t.name || t.topic_id}</div>
                    <div className="text-slate-400 text-sm">Recent mistakes: {t.mistakes}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {Array.isArray(recommendations.gnn_problem_ids) && recommendations.gnn_problem_ids.length > 0 && (
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center space-x-2 mb-3">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-semibold">Recommended Practice Problems</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {recommendations.gnn_problem_ids.map((pid) => (
                  <a
                    key={pid}
                    href={`/practice/${pid}`}
                    className="px-3 py-2 rounded-md border border-slate-600 text-slate-200 hover:bg-slate-700"
                  >
                    Practice #{pid.slice(-6)}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-100 border border-slate-700'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-medium text-purple-400">Questie</span>
                </div>
              )}
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 text-slate-100 border border-slate-700 rounded-lg p-4 max-w-[80%]">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-medium text-purple-400">Questie</span>
              </div>
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                <span className="text-slate-400">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex space-x-3">
        <div className="flex-1">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Questie about your learning goals, progress, or what to learn next..."
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={3}
            disabled={isLoading}
          />
        </div>
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isLoading}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default CoachPage;
