import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AlertTriangle, Video, VideoOff, Shield } from 'lucide-react';

/**
 * WebcamProctoring Component
 * Real-time AI proctoring with webcam monitoring
 * Sends frames via WebSocket, displays violations with red border
 */
const WebcamProctoring = ({ attemptId, onViolation }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const noiseCheckIntervalRef = useRef(null);
  const hasStartedRef = useRef(false);
  
  const [isActive, setIsActive] = useState(false);
  const [hasViolation, setHasViolation] = useState(false);
  const [violations, setViolations] = useState([]);
  const [stats, setStats] = useState({
    yaw: 0,
    pitch: 0,
    looking_away: false,
    phone_detected: false,
    multiple_people: false
  });
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [isLoudNoise, setIsLoudNoise] = useState(false);
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Start webcam
  const startWebcam = useCallback(async () => {
    try {
      console.log('🎥 Requesting webcam access...');
      
      // Request camera access - permissions should already be granted from TestSetup
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      console.log('✅ Webcam stream obtained:', stream.getVideoTracks().length, 'video tracks');
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('✅ Video element connected to stream');
        
        // Set muted and autoplay attributes
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        
        // Wait for metadata to load
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current.play();
            console.log('✅ Video playing - webcam active!');
            setIsActive(true); // Mark as active once video is playing
          } catch (playErr) {
            console.error('Error playing video:', playErr);
            // Still try to set active if stream is present
            setIsActive(true);
          }
        };
        
        // Fallback: set active after a short delay if metadata doesn't load
        setTimeout(() => {
          if (streamRef.current && !permissionDenied) {
            console.log('✅ Fallback: Setting webcam active');
            setIsActive(true);
          }
        }, 1000);
      }
      
      setPermissionDenied(false);
      setError(null);
      console.log('✅ Webcam setup complete');
    } catch (err) {
      console.error('❌ Error accessing webcam:', err.name, err.message);
      
      // Don't show intrusive error if permissions not granted
      // User should have granted them in test setup page
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera access denied. Please ensure you granted permissions before starting the test.');
      } else {
        setError('Failed to access webcam. Please check your camera.');
      }
      setPermissionDenied(true);
      setIsActive(false);
    }
  }, []);

  // Stop webcam
  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    // Close existing connection if any
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (err) {
        console.error('Error closing existing WebSocket:', err);
      }
    }

    // Use the API base URL - default to localhost:8000 for development
    const apiHost = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const wsProtocol = apiHost.startsWith('https') ? 'wss:' : 'ws:';
    const wsHost = apiHost.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProtocol}//${wsHost}/api/proctoring/ws/${attemptId}`;
    
    console.log('Connecting to proctoring WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ Proctoring WebSocket connected');
      setError(null); // Clear any previous errors
      setIsActive(true);
    };

    ws.onmessage = async (event) => {
      const response = JSON.parse(event.data);
      
      if (response.status === 'success' && response.data) {
        const data = response.data;
        
        // Update stats
        setStats({
          yaw: data.yaw || 0,
          pitch: data.pitch || 0,
          looking_away: data.looking_away || false,
          phone_detected: data.phone_detected || false,
          multiple_people: data.multiple_people || false
        });
        
        // Handle violations
        if (data.has_violations && data.violations && data.violations.length > 0) {
          setHasViolation(true);
          setViolations(prev => [...data.violations, ...prev].slice(0, 10)); // Keep last 10
          
          // Log violations to certification attempt
          for (const violation of data.violations) {
            try {
              const apiHost = import.meta.env.VITE_API_URL || 'http://localhost:8000';
              await fetch(`${apiHost}/api/certifications/proctoring-event`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                  attempt_id: attemptId,
                  event: {
                    type: 'violation_detected',
                    violation_type: violation.type,
                    severity: violation.severity,
                    message: violation.message,
                    metadata: {
                      yaw: data.yaw,
                      pitch: data.pitch
                    }
                  }
                })
              });
            } catch (err) {
              console.error('Failed to log violation to attempt:', err);
            }
          }
          
          // Notify parent component
          if (onViolation) {
            onViolation(data.violations);
          }
          
          // Clear violation flag after 3 seconds
          setTimeout(() => {
            setHasViolation(false);
          }, 3000);
        }
      } else if (response.status === 'error') {
        console.error('Proctoring error:', response.message);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error. Proctoring may not be working.');
    };

    ws.onclose = (event) => {
      console.log('Proctoring WebSocket closed', event.code, event.reason);
      
      // Don't set isActive to false - camera should stay on even if WS connection drops
      // Attempt to reconnect after 3 seconds if not a clean close
      if (event.code !== 1000 && wsRef.current === ws) {
        console.log('Attempting to reconnect WebSocket in 3 seconds...');
        setTimeout(() => {
          if (wsRef.current === ws || !wsRef.current) {
            console.log('Reconnecting WebSocket...');
            connectWebSocket();
          }
        }, 3000);
      }
    };

    return ws;
  }, [attemptId, onViolation]);

  // Start audio monitoring
  const startAudioMonitoring = useCallback(async () => {
    try {
      // Get microphone access (should already be granted from test setup)
      const micStream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      micStreamRef.current = micStream;
      console.log('✅ Microphone started successfully using pre-granted permissions');
      
      // Create audio context and analyser
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      
      const microphone = audioContext.createMediaStreamSource(micStream);
      microphone.connect(analyser);
      
      // Monitor noise levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const NOISE_THRESHOLD = 40; // Adjust threshold (0-255) - set to 30 to reduce false positives
      const CHECK_INTERVAL = 100; // Check every 100ms
      
      noiseCheckIntervalRef.current = setInterval(async () => {
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const average = sum / dataArray.length;
        
        setNoiseLevel(Math.round(average));
        
        // Check if noise exceeds threshold
        if (average > NOISE_THRESHOLD) {
          setIsLoudNoise(true);
          
          // Send noise violation via WebSocket
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'noise_violation',
              noise_level: Math.round(average),
              threshold: NOISE_THRESHOLD,
              timestamp: Date.now()
            }));
          }
          
          // Log noise violation to certification attempt
          try {
            const apiHost = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            await fetch(`${apiHost}/api/certifications/proctoring-event`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                attempt_id: attemptId,
                event: {
                  type: 'excessive_noise',
                  noise_level: Math.round(average),
                  threshold: NOISE_THRESHOLD,
                  message: `Excessive noise detected (level: ${Math.round(average)})`
                }
              })
            });
          } catch (err) {
            console.error('Failed to log noise violation to attempt:', err);
          }
          
          // Clear loud noise flag after 2 seconds
          setTimeout(() => {
            setIsLoudNoise(false);
          }, 2000);
        }
      }, CHECK_INTERVAL);
      
      console.log('Audio monitoring started');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      // Audio monitoring is optional, don't block proctoring
    }
  }, []);

  // Stop audio monitoring
  const stopAudioMonitoring = useCallback(() => {
    if (noiseCheckIntervalRef.current) {
      clearInterval(noiseCheckIntervalRef.current);
      noiseCheckIntervalRef.current = null;
    }
    
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    setNoiseLevel(0);
    setIsLoudNoise(false);
  }, []);

  // Send frame to server
  const sendFrame = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      if (wsRef.current) {
        console.warn(`WebSocket not ready (state: ${wsRef.current.readyState})`);
      }
      return;
    }

    if (!videoRef.current || !canvasRef.current) {
      console.warn('Video or canvas not available');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Check if video is ready
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn('Video not ready yet (no dimensions)');
      return;
    }

    try {
      const context = canvas.getContext('2d');

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to base64
      const frameData = canvas.toDataURL('image/jpeg', 0.7);

      // Send via WebSocket with current noise level
      wsRef.current.send(JSON.stringify({
        frame: frameData,
        noise_level: noiseLevel
      }));
    } catch (err) {
      console.error('Error sending frame:', err);
    }
  };

  // Start proctoring
  const startProctoring = async () => {
    console.log('🚀 Starting proctoring...');
    await startWebcam();
    connectWebSocket();
    startAudioMonitoring();
    
    // Send frames every 250ms (4 FPS) for quicker detection and response
    intervalRef.current = setInterval(sendFrame, 250);
  };

  // Stop proctoring
  const stopProctoring = () => {
    console.log('🛑 Stopping proctoring...');
    // Stop sending frames
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Close WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ action: 'stop' }));
        wsRef.current.close();
      } catch (err) {
        console.error('Error closing WebSocket:', err);
      }
      wsRef.current = null;
    }
    
    // Stop webcam and audio
    stopWebcam();
    stopAudioMonitoring();
    setIsActive(false);
  };

  // Auto-start on mount (only once) - permissions already granted in TestSetup
  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      
      // Start immediately since permissions are pre-granted
      console.log('🎥 Starting proctoring with pre-granted permissions...');
      startProctoring();
    }
    
    return () => {
      if (hasStartedRef.current) {
        console.log('🛑 Cleaning up proctoring...');
        stopProctoring();
      }
    };
  }, []); // Empty deps - only run once on mount

  // Handle fullscreen changes to reactivate camera if needed (only if truly broken)
  useEffect(() => {
    const handleFullscreenChange = () => {
      console.log('🔄 Fullscreen change detected');
      
      // Only intervene if camera is actually broken after a delay
      setTimeout(() => {
        const video = videoRef.current;
        const stream = streamRef.current;
        
        // Only restart if stream is truly dead (not just paused)
        if (stream && video) {
          const videoTracks = stream.getVideoTracks();
          if (videoTracks.length > 0 && videoTracks[0].readyState === 'live') {
            // Stream is healthy, just ensure video is playing
            if (video.paused) {
              console.log('📹 Resuming video after fullscreen change...');
              video.play().catch(err => {
                console.error('Failed to play video:', err);
              });
            }
          }
        }
      }, 1000);
    };

    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Determine border color based on violations
  const getBorderColor = () => {
    if (hasViolation) return 'border-red-600';
    if (stats.looking_away || stats.phone_detected || stats.multiple_people) {
      return 'border-yellow-500';
    }
    return 'border-green-500';
  };

  return (
    <div className="fixed bottom-20 right-4 z-40 w-64">
      {/* Compact Webcam Preview */}
      <div className="relative">
        <div className={`relative rounded-lg overflow-hidden border-3 ${getBorderColor()} transition-colors duration-300 bg-gray-900 shadow-2xl`}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-48 object-cover"
          />
          
          {/* Hidden canvas for frame capture */}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Compact Status Badge */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 bg-black/80 px-2 py-1 rounded">
              <Shield className={`w-3 h-3 ${isActive ? 'text-green-500' : 'text-gray-400'}`} />
              <span className="text-white text-xs font-medium">
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            {/* Microphone Status & Noise Level */}
            {isActive && (
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${
                isLoudNoise ? 'bg-red-600 animate-pulse' : 'bg-black/80'
              }`}>
                <svg className={`w-3 h-3 ${isLoudNoise ? 'text-white' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
                <div className="flex items-center gap-0.5">
                  <div className={`w-1 h-2 rounded-sm ${noiseLevel > 5 ? 'bg-green-400' : 'bg-gray-600'}`}></div>
                  <div className={`w-1 h-3 rounded-sm ${noiseLevel > 10 ? 'bg-yellow-400' : 'bg-gray-600'}`}></div>
                  <div className={`w-1 h-4 rounded-sm ${noiseLevel > 15 ? 'bg-orange-400' : 'bg-gray-600'}`}></div>
                  <div className={`w-1 h-4 rounded-sm ${noiseLevel > 20 ? 'bg-red-400' : 'bg-gray-600'}`}></div>
                </div>
                <span className="text-white text-[10px]">{noiseLevel}</span>
              </div>
            )}
          </div>
          
          {/* Violation Alert - Compact */}
          {hasViolation && (
            <div className="absolute top-2 right-2">
              <div className="flex items-center gap-1.5 bg-red-600 px-2 py-1 rounded animate-pulse">
                <AlertTriangle className="w-3 h-3 text-white" />
                <span className="text-white text-xs font-bold">Alert!</span>
              </div>
            </div>
          )}
          
          {/* Head Pose Stats - Compact */}
          {isActive && (
            <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-1 rounded text-white text-[10px]">
              <div>Y:{stats.yaw.toFixed(0)}° P:{stats.pitch.toFixed(0)}°</div>
            </div>
          )}
        </div>

        {/* Error Message - Compact */}
        {error && (
          <div className="mt-2 p-2 bg-red-900/90 border border-red-600 rounded">
            <p className="text-red-200 text-xs">{error}</p>
            {permissionDenied && (
              <button
                onClick={startWebcam}
                className="mt-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 w-full"
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>

      {/* Compact Violation Warnings - Show as badges below video */}
      {(stats.looking_away || stats.phone_detected || stats.multiple_people || isLoudNoise) && (
        <div className="mt-2 space-y-1">
          {stats.looking_away && (
            <div className="flex items-center gap-1 p-1.5 bg-yellow-900/90 border border-yellow-600 rounded">
              <AlertTriangle className="w-3 h-3 text-yellow-400 flex-shrink-0" />
              <span className="text-yellow-200 text-xs">Looking away</span>
            </div>
          )}
          
          {stats.phone_detected && (
            <div className="flex items-center gap-1 p-1.5 bg-red-900/90 border border-red-600 rounded">
              <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
              <span className="text-red-200 text-xs font-medium">Phone detected</span>
            </div>
          )}
          
          {stats.multiple_people && (
            <div className="flex items-center gap-1 p-1.5 bg-red-900/90 border border-red-600 rounded">
              <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
              <span className="text-red-200 text-xs font-medium">Multiple people</span>
            </div>
          )}
          
          {isLoudNoise && (
            <div className="flex items-center gap-1 p-1.5 bg-orange-900/90 border border-orange-600 rounded animate-pulse">
              <AlertTriangle className="w-3 h-3 text-orange-400 flex-shrink-0" />
              <span className="text-orange-200 text-xs font-medium">Excessive noise detected</span>
            </div>
          )}
        </div>
      )}

      {/* Violation Count Badge */}
      {violations.length > 0 && (
        <div className="mt-2 bg-black/80 rounded p-2">
          <div className="text-xs text-red-400 font-semibold">
            {violations.length} Violation{violations.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebcamProctoring;
