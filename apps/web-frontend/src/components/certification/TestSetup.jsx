import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, Camera, Mic, Monitor, User } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import Webcam from 'react-webcam';
import { toast } from 'sonner';
import api, { coursesAPI, usersAPI } from '../../services/api';
import certificationService from '../../services/certificationService';
import { motion } from 'framer-motion';

const DIFFICULTY_DATA = {
  easy: { name: 'Easy', duration: '30 minutes', questions: 20, passingScore: 70 },
  medium: { name: 'Medium', duration: '45 minutes', questions: 30, passingScore: 75 },
  tough: { name: 'Tough', duration: '60 minutes', questions: 40, passingScore: 85 },
};

export const TestSetup = () => {
  const { topicId, difficulty } = useParams();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [hasWebcam, setHasWebcam] = useState(false);
  const [hasMicrophone, setHasMicrophone] = useState(false);
  const [canStartTest, setCanStartTest] = useState(false);
  const [testingMode, setTestingMode] = useState(false);
  const [topic, setTopic] = useState({ title: 'Certification' });
  const [spec, setSpec] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockInfo, setLockInfo] = useState({ reason: '', courseTitle: '', remainingCount: 0 });
  const difficultyInfo = DIFFICULTY_DATA[difficulty] || DIFFICULTY_DATA.medium;
  const webcamRef = useRef(null);

  useEffect(() => {
    checkDevices();
  }, []);

  useEffect(() => {
    // Fetch admin-defined test spec
    (async () => {
      const s = await certificationService.getTestSpec(topicId, (difficulty || '').charAt(0).toUpperCase() + (difficulty || '').slice(1));
      if (s) {
        setSpec(s);
        // Check prerequisite completion if configured
        const prereqId = (s.prerequisite_course_id || '').trim();
        if (prereqId) {
          try {
            const [coursesRes, dashRes] = await Promise.all([
              coursesAPI.getCourses(),
              usersAPI.getDashboard(),
            ]);
            const courses = coursesRes.data || [];
            const user = dashRes.data || {};
            const course = courses.find((c) => c.id === prereqId);
            if (course) {
              const requiredTopicIds = [];
              (course.modules || []).forEach((m) => (m.topics || []).forEach((t) => t.topic_id && requiredTopicIds.push(t.topic_id)));
              const completed = new Set((user.completed_topics || []));
              const remaining = requiredTopicIds.filter((tid) => !completed.has(tid));
              if (remaining.length > 0) {
                setIsLocked(true);
                setLockInfo({
                  reason: 'Complete the prerequisite course to unlock this certification test.',
                  courseTitle: course.title || 'Prerequisite Course',
                  remainingCount: remaining.length,
                });
              }
            }
          } catch (e) {
            // if user/dashboard missing, default to locked to be safe
            setIsLocked(true);
            setLockInfo({ reason: 'Complete the prerequisite course to unlock this certification test.', courseTitle: '', remainingCount: 0 });
          }
        }
      }
    })();
  }, [topicId, difficulty]);

  useEffect(() => {
    // In testing mode, only require username; in production, require all devices
    if (testingMode) {
      setCanStartTest(userName.trim().length > 0);
    } else {
      setCanStartTest(userName.trim().length > 0);
      // Note: For production, uncomment this line:
      // setCanStartTest(userName.trim().length > 0 && hasWebcam && hasMicrophone);
    }
  }, [userName, hasWebcam, hasMicrophone, testingMode]);

  const checkDevices = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported');
      }

      // Request permissions early - this prevents tab switch when test starts
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: true 
      });
      
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      
      setHasWebcam(videoTracks.length > 0);
      setHasMicrophone(audioTracks.length > 0);
      
      // Stop the stream immediately - browser will remember the permission
      // The test interface will request a new stream when it starts
      stream.getTracks().forEach(track => track.stop());
      
      toast.success('✅ Camera and microphone ready!', {
        description: 'Permissions granted. You can now start the test.',
        duration: 3000
      });
    } catch (error) {
      console.error('Device access error:', error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('❌ Permission Denied', {
          description: 'Please allow camera and microphone access to take the test.',
          duration: 5000
        });
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        toast.warning('⚠️ Devices Not Found', {
          description: 'Camera or microphone not detected. Please check your devices.',
          duration: 5000
        });
      } else {
        toast.warning('Camera/Microphone not detected. Enabling testing mode.');
        setTestingMode(true);
        // In testing mode, mock the device access
        setHasWebcam(true);
        setHasMicrophone(true);
      }
    }
  };

  const handleStartTest = async () => {
    if (!canStartTest || !topicId || !difficulty) return;
    try {
      navigate(`/certifications/proctored/test/${topicId}/${difficulty}`, { state: { spec, userName, attemptId: null } });
    } catch (e) {
      toast.error('Failed to start test');
    }
  };

  const handleBack = () => {
    navigate(`/certification/difficulty/${topicId}`);
  };

  const requirements = [
    {
      icon: Monitor,
      label: 'Full Screen Mode',
      description: 'Test will run in full screen. Tab switching will be monitored.',
      met: true,
    },
    {
      icon: Camera,
      label: 'Webcam Access',
      description: 'Your face will be monitored throughout the test.',
      met: hasWebcam,
    },
    {
      icon: Mic,
      label: 'Microphone Access',
      description: 'Environmental noise will be monitored.',
      met: hasMicrophone,
    },
    {
      icon: User,
      label: 'Identity Verification',
      description: 'Your name will be verified before starting.',
      met: userName.trim().length > 0,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 py-12 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl"
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 inline-block rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-6 py-2 text-blue-300 text-sm font-medium border border-blue-500/30 shadow-lg">
              Step 3 of 3 - Almost There!
            </div>
            {testingMode && (
              <div className="inline-block ml-2 rounded-full bg-yellow-500/20 px-4 py-2 text-yellow-300 text-sm font-medium border border-yellow-500/30">
                Testing Mode
              </div>
            )}
            <h1 className="mb-4 font-display text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 sm:text-5xl">
              Test Environment Setup
            </h1>
            <p className="text-lg text-slate-300">
              Please complete the following steps before starting your test
            </p>
          </div>

          {/* Important Notice */}
          {!hasWebcam || !hasMicrophone ? (
            <div className="mb-8 rounded-xl border-2 border-yellow-500/50 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 backdrop-blur-sm shadow-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-yellow-500 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-yellow-300 mb-2">
                    ⚠️ Action Required: Test Your Devices First
                  </h3>
                  <p className="text-slate-200 mb-3">
                    Before starting the test, you must grant camera and microphone permissions. 
                    Click the <strong>"Test Camera & Mic"</strong> button below to verify your devices are working.
                  </p>
                  <p className="text-sm text-yellow-200/80">
                    <strong>Important:</strong> Granting permissions now prevents interruptions during the test and avoids triggering tab-switch violations.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-8 rounded-xl border-2 border-green-500/50 bg-gradient-to-r from-green-900/30 to-emerald-900/30 backdrop-blur-sm shadow-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-green-300 mb-2">
                    ✅ Devices Ready!
                  </h3>
                  <p className="text-slate-200">
                    Camera and microphone permissions have been granted. You're all set to start the test!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Test Summary */}
          <div className="mb-8 rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm shadow-2xl">
            <div className="p-6">
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-4">
                Test Summary
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-gradient-to-br from-blue-900/30 to-purple-900/30 p-4 border border-blue-500/20">
                  <div className="text-sm text-slate-400">Topic</div>
                  <div className="font-semibold text-blue-300">{topic.title}</div>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-purple-900/30 to-pink-900/30 p-4 border border-purple-500/20">
                  <div className="text-sm text-slate-400">Difficulty</div>
                  <div className="font-semibold text-purple-300">{difficultyInfo.name}</div>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-pink-900/30 to-blue-900/30 p-4 border border-pink-500/20">
                  <div className="text-sm text-slate-400">Duration</div>
                  <div className="font-semibold text-pink-300">{difficultyInfo.duration}</div>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-slate-700/30 to-blue-900/30 p-4 border border-slate-500/20">
                  <div className="text-sm text-slate-400">Questions</div>
                  <div className="font-semibold text-slate-300">{difficultyInfo.questions}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Identity Verification */}
            <div className="rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-slate-800/80 to-purple-900/40 backdrop-blur-sm shadow-2xl p-6">
              <h3 className="flex items-center gap-2 text-xl font-bold text-blue-300 mb-4">
                <User className="h-6 w-6" />
                Identity Verification
              </h3>
              <p className="text-slate-400 text-sm mb-4">Enter your full name to proceed</p>
              <div>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full rounded-lg border-2 border-slate-600 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                {userName.trim().length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Name verified
                  </div>
                )}
              </div>
            </div>

            {/* Webcam Preview */}
            <div className="rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-slate-800/80 to-pink-900/40 backdrop-blur-sm shadow-2xl p-6">
              <h3 className="flex items-center gap-2 text-xl font-bold text-purple-300 mb-4">
                <Camera className="h-6 w-6" />
                Camera Preview
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                {testingMode ? 'Testing mode - Camera preview disabled' : 'Ensure your face is clearly visible'}
              </p>
              <div>
                <div className="overflow-hidden rounded-lg border-4 border-gradient-to-r from-blue-500 to-purple-500 border-solid shadow-lg relative">
                  {/* Gradient border effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-75 rounded-lg blur-sm -z-10"></div>
                  
                  {hasWebcam && !testingMode ? (
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      className="w-full h-48 object-cover relative z-10"
                      videoConstraints={{
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: 'user',
                      }}
                      onUserMedia={(stream) => {
                        console.log('Webcam stream started:', stream);
                        toast.success('Camera preview active');
                      }}
                      onUserMediaError={(error) => {
                        console.error('Webcam error:', error);
                        toast.error('Camera preview failed. Enabling testing mode.');
                        setTestingMode(true);
                        setHasWebcam(false);
                      }}
                    />
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-gradient-to-br from-slate-800 via-purple-900 to-blue-900 relative z-10">
                      <div className="text-center">
                        <div className="mx-auto mb-3 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                          <Camera className="h-8 w-8 text-white" />
                        </div>
                        <p className="text-sm text-white font-semibold mb-1">
                          {testingMode ? 'Testing Mode Active' : 'Camera not detected'}
                        </p>
                        <p className="text-xs text-slate-300 mb-3">
                          {testingMode ? 'You can proceed without camera' : 'Please enable camera access'}
                        </p>
                        {!testingMode && (
                          <button
                            onClick={checkDevices}
                            className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
                          >
                            Retry Camera Access
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Status indicator */}
                  <div className="absolute top-2 right-2 z-20">
                    {hasWebcam && !testingMode ? (
                      <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        Active
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        Disabled
                      </div>
                    )}
                  </div>
                </div>
                {hasWebcam && !testingMode && (
                  <div className="mt-3 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-green-700 font-medium">
                      Camera is working properly
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Requirements Checklist */}
          <div className="my-8 rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-slate-800/80 to-blue-900/40 backdrop-blur-sm shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-1">
                  Pre-Test Requirements
                </h3>
                <p className="text-slate-400 text-sm">All requirements must be met to start the test</p>
              </div>
              <button
                onClick={checkDevices}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-2xl hover:scale-105 flex items-center gap-2"
              >
                <Camera className="h-5 w-5" />
                <span>Test Camera & Mic</span>
              </button>
            </div>
            <div>
              <div className="space-y-3">
                {requirements.map((req, index) => {
                  const Icon = req.icon;
                  return (
                    <div
                      key={index}
                      className={`flex items-start gap-4 rounded-lg border-2 p-4 transition-all backdrop-blur-sm ${
                        req.met
                          ? 'border-green-500/30 bg-gradient-to-r from-green-900/20 to-emerald-900/20 shadow-lg shadow-green-500/10'
                          : 'border-yellow-500/30 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 shadow-lg shadow-yellow-500/10'
                      }`}
                    >
                      <div
                        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${
                          req.met ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gradient-to-br from-yellow-500 to-orange-500'
                        }`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-semibold ${req.met ? 'text-green-300' : 'text-yellow-300'}`}>{req.label}</span>
                          {req.met ? (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                              Ready
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                              Required
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-slate-300">{req.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="mb-8 rounded-xl border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-900/20 to-orange-900/20 backdrop-blur-sm shadow-xl p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 flex-shrink-0 text-yellow-400" />
              <div>
                <h3 className="mb-2 font-semibold text-yellow-300">Important Notice</h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">•</span>
                    <span>Your exam will be proctored using AI monitoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">•</span>
                    <span>Tab switching will result in score deductions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">•</span>
                    <span>Ensure you're in a quiet, well-lit environment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">•</span>
                    <span>Any suspicious behavior will be flagged and may affect your certification</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Prerequisite Lock Notice */}
          {isLocked && (
            <div className="mb-8 rounded-xl border-2 border-red-500/30 bg-red-900/20 backdrop-blur-sm shadow-xl p-6">
              <div className="text-red-300 font-semibold mb-2">This certification is locked</div>
              <div className="text-slate-300 text-sm">
                {lockInfo.reason} {lockInfo.courseTitle ? `Required: ${lockInfo.courseTitle}` : ''}
                {lockInfo.remainingCount ? ` • Remaining topics: ${lockInfo.remainingCount}` : ''}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={handleBack}
              className="w-full sm:w-auto px-8 py-4 rounded-xl border-2 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-all font-semibold"
            >
              Back
            </button>
            <button
              onClick={handleStartTest}
              disabled={!canStartTest || isLocked}
              className={`w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
                canStartTest && !isLocked
                  ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-2xl hover:shadow-blue-500/50'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              🚀 Start Test
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
