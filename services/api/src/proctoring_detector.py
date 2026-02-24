"""
AI Proctoring Service for Real-time Exam Monitoring
Detects: Looking away, phone/book, multiple people
GPU-accelerated with YOLO and MediaPipe
"""

import cv2
import math
import numpy as np
import mediapipe as mp
from ultralytics import YOLO
import base64
import time
from datetime import datetime
from typing import Dict, List, Tuple
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Constants and Configuration ---
HEAD_YAW_THRESHOLD = 30   # Degrees - increased from 25 to be more lenient
HEAD_PITCH_THRESHOLD = 20  # Degrees - increased from 15 to be more lenient

YOLO_FRAME_SKIP = 2  # Process every 2nd frame for performance

# Violation thresholds (consecutive frames before alert)
# At 4 FPS (250ms per frame): 12 frames = 3 seconds
VIOLATION_THRESHOLD = 12  # Looking away threshold - 3 seconds
PHONE_VIOLATION_THRESHOLD = 8  # Phone detection - 2 seconds
NOISE_VIOLATION_THRESHOLD = 12  # Noise threshold - 3 seconds

class ProctoringDetector:
    """
    Real-time proctoring detector using MediaPipe and YOLOv8
    """
    
    def __init__(self):
        logger.info("Initializing proctoring models...")
        
        # Initialize MediaPipe Face Mesh
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Initialize YOLOv8 (nano for speed)
        # Patch torch.load to use weights_only=False for PyTorch 2.6+ compatibility
        # This is required because YOLOv8 weights include custom classes
        import torch
        original_load = torch.load
        def patched_load(*args, **kwargs):
            kwargs.setdefault('weights_only', False)
            return original_load(*args, **kwargs)
        torch.load = patched_load
        
        try:
            self.model = YOLO('yolov8n.pt')
        finally:
            # Restore original torch.load
            torch.load = original_load
        
        # Classes: person (0), cell phone (67), book (73)
        self.YOLO_CLASSES = [0, 67, 73]
        
        self.frame_count = 0
        self.consecutive_violations = {
            "looking_away": 0,
            "phone_detected": 0,
            "multiple_people": 0
        }
        
        # Cooldown mechanism: track last violation time
        # After a violation is triggered, wait 2 seconds before detecting next
        self.last_violation_time = {
            "looking_away": 0,
            "phone_detected": 0,
            "multiple_people": 0,
            "no_face": 0
        }
        self.COOLDOWN_SECONDS = 2  # 2 second cooldown between violations
        
        logger.info("Proctoring models loaded successfully")
    
    def get_head_pose(self, frame: np.ndarray, face_landmarks) -> Tuple[float, float, float]:
        """Calculate head pose (Yaw, Pitch, Roll) from MediaPipe landmarks"""
        img_h, img_w, _ = frame.shape
        
        # 3D model points
        face_3d = np.array([
            [0.0, 0.0, 0.0],
            [0.0, -330.0, -65.0],
            [-225.0, 170.0, -135.0],
            [225.0, 170.0, -135.0],
            [-150.0, -150.0, -125.0],
            [150.0, -150.0, -125.0]
        ], dtype=np.float64)
        
        # 2D image points
        face_2d = np.array([
            (face_landmarks.landmark[1].x * img_w, face_landmarks.landmark[1].y * img_h),
            (face_landmarks.landmark[152].x * img_w, face_landmarks.landmark[152].y * img_h),
            (face_landmarks.landmark[263].x * img_w, face_landmarks.landmark[263].y * img_h),
            (face_landmarks.landmark[33].x * img_w, face_landmarks.landmark[33].y * img_h),
            (face_landmarks.landmark[291].x * img_w, face_landmarks.landmark[291].y * img_h),
            (face_landmarks.landmark[61].x * img_w, face_landmarks.landmark[61].y * img_h)
        ], dtype=np.float64)
        
        # Camera matrix
        focal_length = 1 * img_w
        cam_matrix = np.array([
            [focal_length, 0, img_w / 2],
            [0, focal_length, img_h / 2],
            [0, 0, 1]
        ])
        
        dist_coeffs = np.zeros((4, 1), dtype=np.float64)
        
        # Solve PnP
        success, rot_vec, trans_vec = cv2.solvePnP(face_3d, face_2d, cam_matrix, dist_coeffs)
        rot_mat, _ = cv2.Rodrigues(rot_vec)
        
        # Get Euler angles
        sy = math.sqrt(rot_mat[0, 0] * rot_mat[0, 0] + rot_mat[1, 0] * rot_mat[1, 0])
        
        if sy >= 1e-6:
            x = math.atan2(rot_mat[2, 1], rot_mat[2, 2])
            y = math.atan2(-rot_mat[2, 0], sy)
            z = math.atan2(rot_mat[1, 0], rot_mat[0, 0])
        else:
            x = math.atan2(-rot_mat[1, 2], rot_mat[1, 1])
            y = math.atan2(-rot_mat[2, 0], sy)
            z = 0
        
        # Convert to degrees
        return math.degrees(y), math.degrees(x), math.degrees(z)
    
    def process_frame(self, frame: np.ndarray) -> Dict:
        """
        Process a single frame and return violation status
        Returns: {
            'looking_away': bool,
            'phone_detected': bool,
            'multiple_people': bool,
            'yaw': float,
            'pitch': float,
            'person_count': int,
            'violations': list,
            'frame_base64': str (annotated frame)
        }
        """
        self.frame_count += 1
        
        # Flip for selfie view
        frame = cv2.flip(frame, 1)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        violations = []
        is_looking_away = False
        is_phone_detected = False
        is_multiple_people = False
        yaw, pitch = 0, 0
        person_count = 0
        
        # 1. Head Pose Detection (every frame)
        results_pose = self.face_mesh.process(rgb_frame)
        
        if results_pose.multi_face_landmarks:
            face_landmarks = results_pose.multi_face_landmarks[0]
            yaw, pitch, roll = self.get_head_pose(frame, face_landmarks)
            
            if abs(yaw) > HEAD_YAW_THRESHOLD or pitch < -HEAD_PITCH_THRESHOLD or pitch > (HEAD_PITCH_THRESHOLD + 10):
                is_looking_away = True
                self.consecutive_violations["looking_away"] += 1
                if self.consecutive_violations["looking_away"] >= VIOLATION_THRESHOLD:
                    # Check cooldown: only trigger if 2 seconds have passed since last violation
                    current_time = time.time()
                    if current_time - self.last_violation_time["looking_away"] >= self.COOLDOWN_SECONDS:
                        violations.append({
                            'type': 'looking_away',
                            'severity': 'medium',
                            'message': 'Student looking away from screen',
                            'timestamp': datetime.utcnow().isoformat()
                        })
                        self.last_violation_time["looking_away"] = current_time
                        self.consecutive_violations["looking_away"] = 0  # Reset counter after violation
            else:
                self.consecutive_violations["looking_away"] = 0
        else:
            is_looking_away = True
            self.consecutive_violations["looking_away"] += 1
            if self.consecutive_violations["looking_away"] >= VIOLATION_THRESHOLD:
                # Check cooldown for no_face
                current_time = time.time()
                if current_time - self.last_violation_time["no_face"] >= self.COOLDOWN_SECONDS:
                    violations.append({
                        'type': 'no_face',
                        'severity': 'high',
                        'message': 'No face detected',
                        'timestamp': datetime.utcnow().isoformat()
                    })
                    self.last_violation_time["no_face"] = current_time
                    self.consecutive_violations["looking_away"] = 0  # Reset counter
        
        # 2. Object & Person Detection (every N frames)
        if self.frame_count % YOLO_FRAME_SKIP == 0:
            results_yolo = self.model.predict(
                rgb_frame,
                classes=self.YOLO_CLASSES,
                verbose=False,
                device=0  # Use GPU (CUDA device 0)
            )
            
            for r in results_yolo:
                boxes = r.boxes
                for box in boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    class_name = self.model.names[cls_id]
                    
                    # Draw bounding box
                    if class_name in ['cell phone', 'book']:
                        color = (0, 0, 255)  # Red
                        is_phone_detected = True
                        self.consecutive_violations["phone_detected"] += 1
                        if self.consecutive_violations["phone_detected"] >= PHONE_VIOLATION_THRESHOLD:
                            # Check cooldown
                            current_time = time.time()
                            if current_time - self.last_violation_time["phone_detected"] >= self.COOLDOWN_SECONDS:
                                violations.append({
                                    'type': 'prohibited_object',
                                    'severity': 'high',
                                    'message': f'{class_name} detected',
                                    'timestamp': datetime.utcnow().isoformat()
                                })
                                self.last_violation_time["phone_detected"] = current_time
                                self.consecutive_violations["phone_detected"] = 0
                    elif class_name == 'person':
                        color = (255, 0, 0)  # Blue
                        person_count += 1
                    else:
                        color = (0, 255, 0)  # Green
                    
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                    cv2.putText(frame, f"{class_name} {conf:.2f}", (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            
            if not is_phone_detected:
                self.consecutive_violations["phone_detected"] = 0
            
            if person_count > 1:
                is_multiple_people = True
                self.consecutive_violations["multiple_people"] += 1
                if self.consecutive_violations["multiple_people"] >= VIOLATION_THRESHOLD:
                    # Check cooldown
                    current_time = time.time()
                    if current_time - self.last_violation_time["multiple_people"] >= self.COOLDOWN_SECONDS:
                        violations.append({
                            'type': 'multiple_people',
                            'severity': 'high',
                            'message': f'{person_count} people detected',
                            'timestamp': datetime.utcnow().isoformat()
                        })
                        self.last_violation_time["multiple_people"] = current_time
                        self.consecutive_violations["multiple_people"] = 0
            else:
                self.consecutive_violations["multiple_people"] = 0
        
        # Annotate frame with status
        border_color = (0, 0, 255) if (is_looking_away or is_phone_detected or is_multiple_people) else (0, 255, 0)
        cv2.rectangle(frame, (0, 0), (frame.shape[1], frame.shape[0]), border_color, 10)
        
        # Encode frame to base64
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
        frame_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return {
            'looking_away': is_looking_away,
            'phone_detected': is_phone_detected,
            'multiple_people': is_multiple_people,
            'yaw': round(yaw, 2),
            'pitch': round(pitch, 2),
            'person_count': person_count,
            'violations': violations,
            'frame_base64': frame_base64,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def cleanup(self):
        """Release resources"""
        self.face_mesh.close()
        logger.info("Proctoring detector cleaned up")
