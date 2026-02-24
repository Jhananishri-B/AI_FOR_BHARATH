import cv2
import numpy as np
import sounddevice as sd
import librosa
import webrtcvad
import threading
import time
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from ultralytics import YOLO
from deepface import DeepFace
import face_recognition
import os
import tempfile
from collections import deque
import logging

from ..models.proctoring import Violation, ViolationType, ProctoringConfig

logger = logging.getLogger(__name__)

class ProctoringService:
    def __init__(self, config: ProctoringConfig):
        self.config = config
        self.yolo_model = None
        self.vad = webrtcvad.Vad(2)  # Aggressiveness level 0-3
        self.face_encodings_cache = {}
        self.violation_history = deque(maxlen=100)
        self.is_monitoring = False
        self.monitoring_threads = []
        
        # Initialize models
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize AI models for proctoring"""
        try:
            # Load YOLOv8 Nano model for face detection
            self.yolo_model = YOLO('yolov8n.pt')
            logger.info("YOLOv8 model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load YOLOv8 model: {e}")
            raise
    
    def register_user_face(self, user_id: str, image_path: str) -> bool:
        """Register user's face for identity verification"""
        try:
            # Load and encode the face
            image = face_recognition.load_image_file(image_path)
            face_encodings = face_recognition.face_encodings(image)
            
            if not face_encodings:
                logger.warning(f"No face found in image for user {user_id}")
                return False
            
            self.face_encodings_cache[user_id] = face_encodings[0]
            logger.info(f"Face registered for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to register face for user {user_id}: {e}")
            return False
    
    def verify_identity(self, user_id: str, frame: np.ndarray) -> Tuple[bool, float]:
        """Verify user identity using face recognition"""
        try:
            if user_id not in self.face_encodings_cache:
                logger.warning(f"No registered face for user {user_id}")
                return False, 0.0
            
            # Convert frame to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Find face locations and encodings
            face_locations = face_recognition.face_locations(rgb_frame)
            face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
            
            if not face_encodings:
                return False, 0.0
            
            # Compare with registered face
            registered_encoding = self.face_encodings_cache[user_id]
            matches = face_recognition.compare_faces([registered_encoding], face_encodings[0])
            face_distance = face_recognition.face_distance([registered_encoding], face_encodings[0])[0]
            
            # Convert distance to confidence (lower distance = higher confidence)
            confidence = max(0, 1 - face_distance)
            
            return matches[0] and confidence > 0.6, confidence
        except Exception as e:
            logger.error(f"Identity verification failed: {e}")
            return False, 0.0
    
    def detect_faces_and_movements(self, frame: np.ndarray) -> Dict[str, Any]:
        """Detect faces and analyze movements using YOLOv8"""
        try:
            results = self.yolo_model(frame, verbose=False)
            
            face_count = 0
            face_boxes = []
            face_confidence = 0.0
            
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        # YOLOv8 class 0 is 'person'
                        if int(box.cls[0]) == 0:
                            # Extract face region (approximate)
                            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                            confidence = float(box.conf[0])
                            
                            if confidence > self.config.face_detection_threshold:
                                face_count += 1
                                face_boxes.append((x1, y1, x2, y2))
                                face_confidence = max(face_confidence, confidence)
            
            return {
                'face_count': face_count,
                'face_boxes': face_boxes,
                'face_confidence': face_confidence,
                'has_face': face_count > 0
            }
        except Exception as e:
            logger.error(f"Face detection failed: {e}")
            return {'face_count': 0, 'face_boxes': [], 'face_confidence': 0.0, 'has_face': False}
    
    def analyze_audio_frame(self, audio_data: np.ndarray, sample_rate: int) -> Dict[str, Any]:
        """Analyze audio frame for noise and speech detection"""
        try:
            # Convert to 16-bit PCM for VAD
            audio_int16 = (audio_data * 32767).astype(np.int16)
            
            # Calculate RMS and convert to dB
            rms = np.sqrt(np.mean(audio_data**2))
            db_level = 20 * np.log10(rms + 1e-10)
            
            # Speech detection using VAD
            speech_detected = False
            if len(audio_int16) >= 320:  # Minimum frame size for VAD
                # Resample to 16kHz if needed
                if sample_rate != 16000:
                    audio_resampled = librosa.resample(audio_data, orig_sr=sample_rate, target_sr=16000)
                    audio_int16 = (audio_resampled * 32767).astype(np.int16)
                
                # VAD requires specific frame sizes
                frame_size = 320  # 20ms at 16kHz
                if len(audio_int16) >= frame_size:
                    frame = audio_int16[:frame_size]
                    speech_detected = self.vad.is_speech(frame.tobytes(), 16000)
            
            return {
                'db_level': db_level,
                'rms': rms,
                'speech_detected': speech_detected,
                'is_noisy': db_level > self.config.noise_threshold_db
            }
        except Exception as e:
            logger.error(f"Audio analysis failed: {e}")
            return {
                'db_level': 0.0,
                'rms': 0.0,
                'speech_detected': False,
                'is_noisy': False
            }
    
    def check_violations(self, video_data: Dict[str, Any], audio_data: Dict[str, Any], 
                        user_id: str, timestamp: datetime) -> List[Violation]:
        """Check for proctoring violations based on video and audio analysis"""
        violations = []
        
        # Face absence violation
        if not video_data.get('has_face', False):
            violation = Violation(
                type=ViolationType.FACE_ABSENT,
                timestamp=timestamp,
                severity=5,
                description="Face not detected in frame",
                metadata={'confidence': video_data.get('face_confidence', 0.0)}
            )
            violations.append(violation)
        
        # Multiple faces violation
        face_count = video_data.get('face_count', 0)
        if face_count > 1:
            violation = Violation(
                type=ViolationType.MULTIPLE_FACES,
                timestamp=timestamp,
                severity=10,
                description=f"Multiple faces detected: {face_count}",
                metadata={'face_count': face_count}
            )
            violations.append(violation)
        
        # Noise violation
        if audio_data.get('is_noisy', False):
            violation = Violation(
                type=ViolationType.NOISE_DETECTED,
                timestamp=timestamp,
                severity=3,
                description=f"High noise level detected: {audio_data.get('db_level', 0):.1f}dB",
                metadata={'db_level': audio_data.get('db_level', 0.0)}
            )
            violations.append(violation)
        
        # Speech detection violation (if enabled)
        if self.config.speech_detection_enabled and audio_data.get('speech_detected', False):
            violation = Violation(
                type=ViolationType.SPEECH_DETECTED,
                timestamp=timestamp,
                severity=5,
                description="Speech detected during test",
                metadata={'db_level': audio_data.get('db_level', 0.0)}
            )
            violations.append(violation)
        
        return violations
    
    def calculate_behavior_score(self, violations: List[Violation]) -> float:
        """Calculate behavior score based on violations"""
        if not violations:
            return 100.0
        
        total_penalty = 0
        violation_counts = {}
        
        for violation in violations:
            violation_type = violation.type
            severity = violation.severity
            
            # Count violations by type
            violation_counts[violation_type] = violation_counts.get(violation_type, 0) + 1
            
            # Apply penalties based on violation type and severity
            if violation_type == ViolationType.FACE_ABSENT:
                total_penalty += min(5, severity)
            elif violation_type == ViolationType.HEAD_TURNED:
                total_penalty += min(3, severity)
            elif violation_type == ViolationType.MULTIPLE_FACES:
                total_penalty += min(10, severity)
            elif violation_type == ViolationType.SPEECH_DETECTED:
                total_penalty += min(5, severity)
            elif violation_type == ViolationType.NOISE_DETECTED:
                total_penalty += min(3, severity)
            elif violation_type == ViolationType.TAB_SWITCHING:
                total_penalty += min(5, severity)
        
        # Apply additional penalties for repeated violations
        for violation_type, count in violation_counts.items():
            if count > 3:  # More than 3 violations of same type
                total_penalty += (count - 3) * 2
        
        behavior_score = max(0, 100 - total_penalty)
        return behavior_score
    
    def calculate_final_score(self, test_score: float, behavior_score: float) -> float:
        """Calculate final score combining test and behavior scores"""
        final_score = (
            self.config.test_score_weight * test_score + 
            self.config.behavior_score_weight * behavior_score
        )
        return min(100.0, max(0.0, final_score))
    
    def should_issue_certificate(self, final_score: float, violations: List[Violation]) -> bool:
        """Determine if certificate should be issued based on score and violations"""
        # Check if final score meets threshold
        if final_score < 85.0:
            return False
        
        # Check for severe violations
        severe_violations = [v for v in violations if v.severity >= 8]
        if len(severe_violations) > 0:
            return False
        
        # Check total violation count
        if len(violations) > self.config.max_violations:
            return False
        
        return True
