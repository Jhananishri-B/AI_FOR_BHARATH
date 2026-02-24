import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '@lottiefiles/react-lottie-player';

const LessonComplete = ({ 
  lessonTitle = "What are Data Structures?", 
  xpEarned = 120, 
  onBackToModule,
  onRetakeLesson,
  isVisible = true 
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Show confetti immediately
      setShowConfetti(true);
      
      // Show content after a short delay
      setTimeout(() => {
        setShowContent(true);
      }, 500);
    }
  }, [isVisible]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { 
      scale: 0.8, 
      opacity: 0,
      y: 50
    },
    visible: { 
      scale: 1, 
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        duration: 0.8
      }
    }
  };

  const textVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 12,
        duration: 0.6
      }
    }
  };

  const xpVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.5,
      y: 20
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 10,
        delay: 0.3,
        duration: 0.7
      }
    }
  };

  const buttonVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 12,
        delay: 0.6,
        duration: 0.6
      }
    },
    hover: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    },
    tap: {
      scale: 0.95
    }
  };

  const floatingEmojiVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0,
      rotate: -180
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        delay: 0.8,
        duration: 0.8
      }
    },
    float: {
      y: [-10, 10, -10],
      rotate: [-5, 5, -5],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-[#0E1626] flex items-center justify-center z-50 overflow-hidden">
      {/* Full-screen confetti animation */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Player
              autoplay
              loop={false}
              src="/animations/confetti.json"
              style={{ width: '100%', height: '100%' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating emojis */}
      <motion.div
        className="absolute top-20 left-20 text-6xl"
        variants={floatingEmojiVariants}
        initial="hidden"
        animate={["visible", "float"]}
      >
        🎉
      </motion.div>

      <motion.div
        className="absolute top-32 right-24 text-5xl"
        variants={floatingEmojiVariants}
        initial="hidden"
        animate={["visible", "float"]}
        transition={{ delay: 0.2 }}
      >
        ✨
      </motion.div>

      <motion.div
        className="absolute bottom-32 left-16 text-4xl"
        variants={floatingEmojiVariants}
        initial="hidden"
        animate={["visible", "float"]}
        transition={{ delay: 0.4 }}
      >
        🎊
      </motion.div>

      <motion.div
        className="absolute bottom-20 right-20 text-5xl"
        variants={floatingEmojiVariants}
        initial="hidden"
        animate={["visible", "float"]}
        transition={{ delay: 0.6 }}
      >
        ⭐
      </motion.div>

      {/* Main content */}
      <motion.div
        className="relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate={showContent ? "visible" : "hidden"}
      >
        <motion.div
          className="bg-gradient-to-b from-green-400 to-teal-600 rounded-3xl p-8 max-w-md mx-4 shadow-2xl"
          variants={cardVariants}
        >
          {/* Trophy Animation */}
          <motion.div
            className="flex justify-center mb-6"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.2,
              duration: 1
            }}
          >
            <Player
              autoplay
              loop={true}
              src="/animations/trophy.json"
              style={{ width: '200px', height: '200px' }}
            />
          </motion.div>

          {/* Main Title */}
          <motion.h1
            className="text-4xl font-bold text-white text-center mb-4"
            variants={textVariants}
          >
            Lesson Complete!
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-lg text-white text-center mb-6 opacity-90"
            variants={textVariants}
          >
            Great job completing '{lessonTitle}'!
          </motion.p>

          {/* XP Reward Section */}
          <motion.div
            className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-4 mb-6 backdrop-blur-sm"
            variants={xpVariants}
          >
            <motion.div
              className="flex items-center justify-center space-x-2 mb-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 10,
                delay: 0.8
              }}
            >
              <span className="text-2xl">⚡</span>
              <span className="text-xl font-bold text-white">
                You earned {xpEarned} XP!
              </span>
            </motion.div>
            <motion.p
              className="text-sm text-white text-center opacity-80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              Keep up the amazing work!
            </motion.p>
          </motion.div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <motion.button
              className="w-full bg-white text-green-600 font-semibold py-3 px-6 rounded-xl hover:bg-green-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 focus:ring-offset-transparent"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={onBackToModule}
            >
              Back to Module
            </motion.button>
            
            {onRetakeLesson && (
              <motion.button
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-transparent"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={onRetakeLesson}
              >
                Retake Lesson for Better Learning
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LessonComplete;
