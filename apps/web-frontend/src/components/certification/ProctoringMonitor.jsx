import React, { useEffect, useRef, useState, useCallback } from 'react';
import api from '../../services/api';

const ProctoringMonitor = ({ attemptId, onViolation }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  
  const [status, setStatus] = useState('initializing');
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [faceDetected, setFaceDetected] = useState(true);
  const [violations, setViolations] = useState([]);

  // Initialize media streams
  useEffect(() => {
    initializeProctoring();
    
    return () => {
      cleanup();
    };
  }, []);

  // Cleanup function
  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const initializeProctoring = async () => {
    try {
      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('getUserMedia is not supported in this browser');
        setStatus('not_supported');
        return;
      }

      // Request camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;

      // Set up video
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsInline', 'true');
        
        // Wait for video to be ready and play
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
            .then(() => {
              console.log('Proctoring camera started');
            })
            .catch(err => {
              console.error('Error playing video:', err);
            });
        };
      }

      // Set up audio analysis
      setupAudioAnalysis(stream);

      // Set up visibility change detection
      document.addEventListener('visibilitychange', handleVisibilityChange);
      document.addEventListener('blur', handleBlur);
      window.addEventListener('focus', handleFocus);
      
      // Set up tab switch detection
      document.addEventListener('keydown', handleKeyDown);

      setPermissionsGranted(true);
      setStatus('active');

      // Start proctoring loop
      startProctoringLoop();

    } catch (error) {
      console.error('Error accessing media devices:', error);
      setStatus('permission_denied');
      let errorMessage = 'Camera/Mic Required - ';
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera and microphone access.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera or microphone found.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Camera/microphone is already in use.';
      }
      
      logEvent({
        type: 'permission_denied',
        error: error.message
      });
    }
  };

  const setupAudioAnalysis = (stream) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);

    analyser.fftSize = 2048;
    microphone.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current || !permissionsGranted) {
      return;
    }

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.7);
      
      return imageBase64.split(',')[1]; // Remove data:image/jpeg;base64, prefix
    } catch (error) {
      console.error('Error capturing frame:', error);
      return null;
    }
  };

  const analyzeAudio = () => {
    if (!analyserRef.current) return null;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate RMS (Root Mean Square) for volume
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / bufferLength) / 255;

    // Detect voice activity (simple heuristic)
    const voiceActivity = rms > 0.1;

    return {
      rms: rms,
      voice_activity: voiceActivity,
      timestamp: new Date().toISOString()
    };
  };

  const sendToProctor = async (imageBase64) => {
    try {
      const response = await api.post('/api/ai/proctor', {
        attempt_id: attemptId,
        image_base64: imageBase64,
        timestamp: new Date().toISOString()
      });

      if (response.data.violations && response.data.violations.length > 0) {
        setViolations(response.data.violations);
        if (onViolation) {
          onViolation(response.data.violations);
        }
      }

      // Update face detection status
      setFaceDetected(response.data.face_detected);

      return response.data;
    } catch (error) {
      console.error('Error sending to proctor:', error);
      return null;
    }
  };

  const sendAudioEvent = async (audioFeatures) => {
    try {
      await api.post('/api/ai/proctor/audio', {
        attempt_id: attemptId,
        audio_features: audioFeatures,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending audio event:', error);
    }
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      logEvent({
        type: 'tab_switch',
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleBlur = () => {
    logEvent({
      type: 'window_blur',
      timestamp: new Date().toISOString()
    });
  };

  const handleFocus = () => {
    logEvent({
      type: 'window_focus',
      timestamp: new Date().toISOString()
    });
  };

  const handleKeyDown = (event) => {
    // Detect attempts to switch tabs or print screen
    if (event.ctrlKey || event.metaKey) {
      if (event.key === 'Tab' || event.key === 't') {
        logEvent({
          type: 'tab_switch_attempt',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    if (event.key === 'PrintScreen') {
      logEvent({
        type: 'screenshot_attempt',
        timestamp: new Date().toISOString()
      });
    }
  };

  const logEvent = async (event) => {
    try {
      await api.post('/api/certifications/event', {
        attempt_id: attemptId,
        event: event
      });
    } catch (error) {
      console.error('Error logging event:', error);
    }
  };

  const startProctoringLoop = () => {
    // Capture and send frames every 10 seconds
    intervalRef.current = setInterval(async () => {
      const imageBase64 = captureFrame();
      if (imageBase64) {
        await sendToProctor(imageBase64);
      }

      // Analyze audio
      const audioFeatures = analyzeAudio();
      if (audioFeatures) {
        // Check for anomalies
        if (audioFeatures.rms > 0.8 || audioFeatures.rms < 0.01) {
          await sendAudioEvent(audioFeatures);
        }
      }
    }, 10000); // 10 seconds interval
  };

  return (
    <div className="proctoring-monitor">
      {/* Video element for capturing - kept hidden as it's only for analysis */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: 'none' }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Status indicator */}
      <div className={`fixed top-4 right-4 z-50 p-3 rounded-lg shadow-lg ${
        status === 'active' ? 'bg-green-500' : 
        status === 'permission_denied' ? 'bg-red-500' : 
        'bg-yellow-500'
      } text-white`}>
        <div className="flex items-center gap-2">
          {status === 'active' && permissionsGranted ? (
            <>
              <div className={`w-3 h-3 rounded-full ${faceDetected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
              <span className="text-sm font-medium">
                Proctoring Active
              </span>
            </>
          ) : (
            <span className="text-sm font-medium">
              {status === 'permission_denied' ? 'Camera/Mic Required' : 'Initializing...'}
            </span>
          )}
        </div>
      </div>

      {/* Violations banner */}
      {violations.length > 0 && (
        <div className="fixed top-20 right-4 z-50 p-3 rounded-lg shadow-lg bg-red-500 text-white animate-shake">
          <span className="text-sm font-medium">
            Warning: {violations.join(', ')} detected
          </span>
        </div>
      )}
    </div>
  );
};

export default ProctoringMonitor;
