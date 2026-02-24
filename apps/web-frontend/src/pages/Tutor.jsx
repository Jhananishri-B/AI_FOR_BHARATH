import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { aiAPI } from '../services/api';
import Layout from '../components/Layout';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  BookOpen,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';

const Tutor = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    setError('');

    try {
      const response = await aiAPI.explain(inputMessage, courseId);
      const data = response.data;
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: data.response,
        imageUrl: data.image_url,
        sources: data.sources || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to get AI response. Please try again.');
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const MessageBubble = ({ message }) => {
    const isUser = message.type === 'user';
    const isError = message.type === 'error';

    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
          {/* Avatar */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isUser ? 'bg-blue-600' : isError ? 'bg-red-600' : 'bg-purple-600'
          }`}>
            {isUser ? (
              <User className="w-4 h-4 text-white" />
            ) : isError ? (
              <AlertCircle className="w-4 h-4 text-white" />
            ) : (
              <Bot className="w-4 h-4 text-white" />
            )}
          </div>

          {/* Message Content */}
          <div className={`rounded-2xl px-4 py-3 ${
            isUser 
              ? 'bg-blue-600 text-white' 
              : isError 
                ? 'bg-red-100 text-red-800 border border-red-200'
                : 'bg-slate-700 text-white'
          }`}>
            <div className="whitespace-pre-wrap">{message.content}</div>
            
            {/* Image if present */}
            {message.imageUrl && (
              <div className="mt-3">
                <div className="flex items-center space-x-2 mb-2">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-400">Referenced Image:</span>
                </div>
                <img 
                  src={message.imageUrl} 
                  alt="Course content" 
                  className="max-w-full h-auto rounded-lg border border-slate-600"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Sources if present */}
            {message.sources && message.sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-600">
                <div className="text-xs text-slate-400 mb-2">Sources:</div>
                <div className="space-y-1">
                  {message.sources.map((source, idx) => (
                    <div key={idx} className="text-xs text-slate-300 bg-slate-800 rounded px-2 py-1">
                      <div className="font-medium">{source.title}</div>
                      <div className="text-slate-400">
                        {source.type} • {Math.round(source.relevance_score * 100)}% relevant
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs opacity-70 mt-2">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout showSidebar={false}>
      <div className="min-h-screen flex flex-col bg-slate-900">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AI Tutor</h1>
              <p className="text-slate-400 text-sm">Ask questions about your course content</p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Welcome to AI Tutor!</h3>
                <p className="text-slate-400 mb-6">
                  Ask me anything about your course content. I can help explain concepts, 
                  analyze images, and provide detailed explanations.
                </p>
                <div className="bg-slate-800 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-slate-300 text-sm">
                    <strong>Try asking:</strong><br />
                    • "Explain this concept"<br />
                    • "What does this diagram show?"<br />
                    • "How does this work?"<br />
                    • "Can you help me understand this topic?"
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {loading && (
                <div className="flex justify-start mb-4">
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-slate-700 rounded-2xl px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        <span className="text-slate-400">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-6 py-2">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-slate-800 border-t border-slate-700 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-3">
              <div className="flex-1">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question about your course content..."
                  className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={1}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                  disabled={loading}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || loading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Tutor;
