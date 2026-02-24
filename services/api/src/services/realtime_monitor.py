import asyncio
import threading
import time
import base64
import io
import cv2
import numpy as np
import sounddevice as sd
from datetime import datetime
from typing import Dict, Any, Optional, Callable
import logging
from collections import deque

from ..services.proctoring_service import ProctoringService
from ..models.proctoring import Violation, ProctoringConfig, ProctoringSession

logger = logging.getLogger(__name__)

class RealTimeMonitor:
    def __init__(self, proctoring_service: ProctoringService):
        self.proctoring_service = proctoring_service
        self.active_sessions: Dict[str, ProctoringSession] = {}
        self.monitoring_threads: Dict[str, threading.Thread] = {}
        self.stop_events: Dict[str, threading.Event] = {}
        self.violation_callbacks: Dict[str, Callable] = {}
        
        # Audio configuration
        self.audio_sample_rate = 16000
        self.audio_channels = 1
        self.audio_chunk_size = 1024
        
        # Video configuration
        self.video_fps = 30
        self.frame_buffer_size = 10
        
    def start_session(self, session_id: str, user_id: str, test_session_id: str, 
                     config: ProctoringConfig, violation_callback: Optional[Callable] = None) -> bool:
        """Start real-time monitoring for a session"""
        try:
            if session_id in self.active_sessions:
                logger.warning(f"Session {session_id} is already active")
                return False
            
            # Create proctoring session
            session = ProctoringSession(
                session_id=session_id,
                user_id=user_id,
                test_session_id=test_session_id,
                config=config,
                started_at=datetime.now()
            )
            
            self.active_sessions[session_id] = session
            self.stop_events[session_id] = threading.Event()
            
            if violation_callback:
                self.violation_callbacks[session_id] = violation_callback
            
            # Start monitoring threads
            self._start_video_monitoring(session_id)
            self._start_audio_monitoring(session_id)
            
            logger.info(f"Started monitoring session {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to start session {session_id}: {e}")
            return False
    
    def stop_session(self, session_id: str) -> bool:
        """Stop real-time monitoring for a session"""
        try:
            if session_id not in self.active_sessions:
                logger.warning(f"Session {session_id} is not active")
                return False
            
            # Signal stop event
            if session_id in self.stop_events:
                self.stop_events[session_id].set()
            
            # Wait for threads to finish
            if session_id in self.monitoring_threads:
                thread = self.monitoring_threads[session_id]
                thread.join(timeout=5.0)
            
            # Clean up
            self.active_sessions.pop(session_id, None)
            self.stop_events.pop(session_id, None)
            self.violation_callbacks.pop(session_id, None)
            self.monitoring_threads.pop(session_id, None)
            
            logger.info(f"Stopped monitoring session {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to stop session {session_id}: {e}")
            return False
    
    def _start_video_monitoring(self, session_id: str):
        """Start video monitoring thread"""
        def video_monitor():
            session = self.active_sessions[session_id]
            stop_event = self.stop_events[session_id]
            
            logger.info(f"Started video monitoring for session {session_id}")
            
            while not stop_event.is_set():
                try:
                    # This would be replaced with actual video stream processing
                    # For now, we'll simulate the monitoring
                    time.sleep(1.0 / self.video_fps)
                    
                    # Process video frame (placeholder)
                    # In real implementation, this would process frames from the webcam stream
                    
                except Exception as e:
                    logger.error(f"Video monitoring error for session {session_id}: {e}")
                    break
            
            logger.info(f"Stopped video monitoring for session {session_id}")
        
        thread = threading.Thread(target=video_monitor, daemon=True)
        self.monitoring_threads[session_id] = thread
        thread.start()
    
    def _start_audio_monitoring(self, session_id: str):
        """Start audio monitoring thread"""
        def audio_monitor():
            session = self.active_sessions[session_id]
            stop_event = self.stop_events[session_id]
            
            logger.info(f"Started audio monitoring for session {session_id}")
            
            try:
                # Set up audio stream
                def audio_callback(indata, frames, time, status):
                    if status:
                        logger.warning(f"Audio callback status: {status}")
                    
                    # Process audio data
                    audio_data = indata[:, 0]  # Mono channel
                    audio_analysis = self.proctoring_service.analyze_audio_frame(
                        audio_data, self.audio_sample_rate
                    )
                    
                    # Check for violations
                    violations = self._check_audio_violations(session_id, audio_analysis)
                    
                    # Update session
                    if violations:
                        self._update_session_violations(session_id, violations)
                
                # Start audio stream
                with sd.InputStream(
                    callback=audio_callback,
                    channels=self.audio_channels,
                    samplerate=self.audio_sample_rate,
                    blocksize=self.audio_chunk_size
                ):
                    while not stop_event.is_set():
                        time.sleep(0.1)
                        
            except Exception as e:
                logger.error(f"Audio monitoring error for session {session_id}: {e}")
            
            logger.info(f"Stopped audio monitoring for session {session_id}")
        
        thread = threading.Thread(target=audio_monitor, daemon=True)
        thread.start()
    
    def _check_audio_violations(self, session_id: str, audio_analysis: Dict[str, Any]) -> list[Violation]:
        """Check for audio-related violations"""
        violations = []
        session = self.active_sessions.get(session_id)
        
        if not session:
            return violations
        
        timestamp = datetime.now()
        
        # Check for noise violations
        if audio_analysis.get('is_noisy', False):
            violation = Violation(
                type="noise_detected",
                timestamp=timestamp,
                severity=3,
                description=f"High noise level: {audio_analysis.get('db_level', 0):.1f}dB",
                metadata={'db_level': audio_analysis.get('db_level', 0.0)}
            )
            violations.append(violation)
        
        # Check for speech violations
        if session.config.speech_detection_enabled and audio_analysis.get('speech_detected', False):
            violation = Violation(
                type="speech_detected",
                timestamp=timestamp,
                severity=5,
                description="Speech detected during test",
                metadata={'db_level': audio_analysis.get('db_level', 0.0)}
            )
            violations.append(violation)
        
        return violations
    
    def _update_session_violations(self, session_id: str, violations: list[Violation]):
        """Update session with new violations"""
        session = self.active_sessions.get(session_id)
        if not session:
            return
        
        # Add violations to session
        session.violations_count += len(violations)
        
        # Calculate new behavior score
        all_violations = session.violations + violations
        session.current_behavior_score = self.proctoring_service.calculate_behavior_score(all_violations)
        
        # Call violation callback if registered
        if session_id in self.violation_callbacks:
            try:
                self.violation_callbacks[session_id](violations)
            except Exception as e:
                logger.error(f"Violation callback error for session {session_id}: {e}")
    
    def process_video_frame(self, session_id: str, frame_data: str) -> Dict[str, Any]:
        """Process a video frame from the frontend"""
        try:
            if session_id not in self.active_sessions:
                return {'error': 'Session not found'}
            
            # Decode base64 frame
            frame_bytes = base64.b64decode(frame_data.split(',')[1])
            frame_array = np.frombuffer(frame_bytes, dtype=np.uint8)
            frame = cv2.imdecode(frame_array, cv2.IMREAD_COLOR)
            
            if frame is None:
                return {'error': 'Invalid frame data'}
            
            session = self.active_sessions[session_id]
            
            # Detect faces and movements
            video_analysis = self.proctoring_service.detect_faces_and_movements(frame)
            
            # Check for violations
            violations = self.proctoring_service.check_violations(
                video_analysis, 
                {'db_level': 0.0, 'speech_detected': False, 'is_noisy': False},  # Placeholder audio data
                session.user_id,
                datetime.now()
            )
            
            # Update session
            if violations:
                self._update_session_violations(session_id, violations)
            
            return {
                'face_count': video_analysis.get('face_count', 0),
                'face_confidence': video_analysis.get('face_confidence', 0.0),
                'violations': [v.dict() for v in violations],
                'behavior_score': session.current_behavior_score
            }
            
        except Exception as e:
            logger.error(f"Frame processing error for session {session_id}: {e}")
            return {'error': str(e)}
    
    def get_session_status(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get current status of a monitoring session"""
        session = self.active_sessions.get(session_id)
        if not session:
            return None
        
        return {
            'session_id': session.session_id,
            'user_id': session.user_id,
            'test_session_id': session.test_session_id,
            'is_active': session.is_active,
            'violations_count': session.violations_count,
            'behavior_score': session.current_behavior_score,
            'started_at': session.started_at.isoformat(),
            'duration_minutes': int((datetime.now() - session.started_at).total_seconds() / 60)
        }
    
    def get_all_active_sessions(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all active sessions"""
        return {
            session_id: self.get_session_status(session_id)
            for session_id in self.active_sessions.keys()
        }
