import React, { useState, useEffect } from 'react';
import { ChevronRight, Zap, TrendingUp, Flame } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import certificationService from '../../services/certificationService';
import { motion } from 'framer-motion';

const DIFFICULTY_LEVELS = [
  {
    id: 'easy',
    name: 'Easy',
    icon: Zap,
    description: 'Fundamental concepts and basic questions',
    duration: '30 minutes',
    questions: 20,
    color: 'from-green-500 to-emerald-500',
    passingScore: 70,
  },
  {
    id: 'medium',
    name: 'Medium',
    icon: TrendingUp,
    description: 'Intermediate knowledge and practical scenarios',
    duration: '45 minutes',
    questions: 30,
    color: 'from-yellow-500 to-orange-500',
    passingScore: 75,
  },
  {
    id: 'tough',
    name: 'Tough',
    icon: Flame,
    description: 'Advanced topics and complex problem-solving',
    duration: '60 minutes',
    questions: 40,
    color: 'from-red-500 to-rose-500',
    passingScore: 85,
  },
];

export const DifficultySelection = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopic();
  }, [topicId]);

  const fetchTopic = async () => {
    try {
      setLoading(true);
      console.log('Fetching topic for ID:', topicId);
      const specs = await certificationService.getPublicSpecs();
      const foundTopic = specs.find(s => s.cert_id === topicId);
      console.log('Found topic:', foundTopic);
      
      if (foundTopic) {
        setTopic({ title: foundTopic.cert_id });
      } else {
        // If not found by _id, try with title or use first certification
        console.log('Topic not found by ID, using fallback');
        const fallbackTopic = certifications[0];
        if (fallbackTopic) {
          setTopic(fallbackTopic);
        }
      }
    } catch (error) {
      console.error('Error fetching topic:', error);
      // Set a mock topic to prevent "Topic not found" error
      setTopic({
        _id: topicId || '1',
        title: 'Sample Certification',
        description: 'Test your knowledge',
        difficulty: 'Medium',
        duration_minutes: 60,
        pass_percentage: 70
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedLevel && topicId) {
      navigate(`/certifications/proctored/setup/${topicId}/${selectedLevel.id || selectedLevel}`);
    }
  };

  const handleBack = () => {
    navigate('/certification/topics');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl">Topic not found</p>
          <button onClick={() => navigate('/certification/topics')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
            Back to Topics
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-5xl"
        >
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="mb-4 inline-block rounded-full bg-blue-500/20 px-4 py-2 text-blue-300 text-sm font-medium border border-blue-500/30">
              Step 2 of 3
            </div>
            <h1 className="mb-4 font-display text-3xl font-bold text-white sm:text-4xl">
              Select Difficulty Level
            </h1>
            <p className="text-lg text-slate-400">
              Testing for <span className="font-semibold text-blue-400">{topic.title}</span>
            </p>
          </div>

          {/* Difficulty Cards */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {DIFFICULTY_LEVELS.map((level, index) => {
              const Icon = level.icon;
              const isSelected = selectedLevel?.id === level.id;
              
              return (
                <motion.div
                  key={level.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div
                    className={`flex h-full cursor-pointer flex-col rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-slate-800/50 p-6 ${
                      isSelected
                        ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                        : 'border-slate-700 hover:border-blue-400'
                    }`}
                    onClick={() => setSelectedLevel(level)}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${level.color}`}>
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      {isSelected && (
                        <div className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">Selected</div>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{level.name}</h3>
                    <p className="text-base text-slate-400 mb-4">{level.description}</p>
                    <div className="mt-auto space-y-2 text-sm">
                      <div className="flex items-center justify-between rounded-md bg-slate-700/50 p-2">
                        <span className="text-slate-400">Duration:</span>
                        <span className="font-semibold text-white">{level.duration}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-md bg-slate-700/50 p-2">
                        <span className="text-slate-400">Questions:</span>
                        <span className="font-semibold text-white">{level.questions}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-md bg-slate-700/50 p-2">
                        <span className="text-slate-400">Passing Score:</span>
                        <span className="font-semibold text-white">{level.passingScore}%</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Selected Level Summary */}
          {selectedLevel && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8"
            >
              <div className="rounded-xl border-2 border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br ${selectedLevel.color}`}>
                      <selectedLevel.icon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-400">You've Selected</div>
                      <div className="text-2xl font-bold text-blue-400">{selectedLevel.name} Level</div>
                      <div className="text-sm text-slate-400">
                        {selectedLevel.questions} questions • {selectedLevel.duration}
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-2 bg-yellow-600 text-white text-base font-bold rounded-lg">
                    {selectedLevel.passingScore}% to pass
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={handleBack}
              className="w-full sm:w-auto border-2 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white px-6 py-3 rounded-lg font-semibold transition-all"
            >
              Back
            </button>
            <button
              onClick={handleContinue}
              disabled={!selectedLevel}
              className={`w-full sm:w-auto flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedLevel
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              Continue to Setup
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
