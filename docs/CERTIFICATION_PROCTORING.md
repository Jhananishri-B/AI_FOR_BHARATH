# Certification Proctoring System

This document describes the comprehensive certification proctoring system implemented in LearnQuest.

## Overview

The certification system provides AI-powered proctoring for online tests, ensuring test integrity through real-time monitoring of user behavior, camera/microphone access, and anomaly detection.

## Architecture

### Backend Components

#### 1. Proctoring Service (`services/api/src/services/proctoring.py`)
- **YOLOv8**: Object detection for phones, multiple people, etc.
- **MediaPipe**: Face detection and face mesh for face presence/quality checks
- **Behavior Scoring**: Penalty-based scoring system for violations
- **Event Logging**: All proctoring events are logged with timestamps

#### 2. API Routes
- `/api/ai/proctor` - Process images for violations
- `/api/ai/proctor/file` - Accept uploaded image files
- `/api/ai/proctor/audio` - Process audio events
- `/api/certifications/start` - Start a test attempt
- `/api/certifications/submit` - Submit test answers
- `/api/certifications/event` - Log custom events

#### 3. Admin Routes
- `/api/admin/proctoring/attempts` - Get all attempts
- `/api/admin/proctoring/attempts/{id}/proctoring-logs` - Get detailed logs
- `/api/admin/proctoring/attempts/{id}/violations` - Get violations summary
- `/api/admin/proctoring/attempts/{id}/review` - Override behavior scores

### Frontend Components

#### 1. ProctoringMonitor (`apps/web-frontend/src/components/certification/ProctoringMonitor.jsx`)
- Requests camera and microphone access via `getUserMedia`
- Captures frames every 10 seconds and sends to backend
- Analyzes audio for anomalies
- Detects tab switches and window focus changes
- Displays real-time status indicators

#### 2. CertificationTest (`apps/web-frontend/src/components/certification/CertificationTest.jsx`)
- Full-screen test interface
- Timer countdown
- Question navigation
- Submits answers on completion
- Integrated with ProctoringMonitor

#### 3. CertificationTestPage (`apps/web-frontend/src/pages/CertificationTestPage.jsx`)
- Consent modal before test starts
- Camera/mic permission request
- Test initialization

## Features

### Proctoring Detection

#### Video-based Detection
- **Face missing**: No face detected for extended period
- **Face off-screen**: Face not centered in frame
- **Face occluded**: Poor visibility of eyes/mouth
- **Multiple people**: More than one person detected
- **Phone detected**: Mobile device detected in frame
- **Looking away**: Repeated looking away from screen

#### Audio-based Detection
- **Silence**: Prolonged silence detected
- **Multiple voices**: Multiple voice sources detected
- **Loud noise**: Sudden loud background noise
- **Voice activity**: Automatic voice activity detection

#### Browser Events
- **Tab switch**: Tab switching detection via `visibilitychange`
- **Window blur**: Window focus loss
- **Context menu**: Right-click disabled
- **Copy/paste**: Clipboard events blocked
- **Print screen**: Screenshot attempts logged

### Behavior Scoring

Starting score: **100 points**

#### Penalty System
| Violation | Penalty |
|-----------|---------|
| Tab switch | -10 |
| Face not detected | -15 |
| Multiple people | -30 |
| Phone detected | -25 |
| Multiple voice sources | -20 |
| Face low confidence | -10 |
| Loud noise | -5 |
| Prolonged silence | -5 |

Score floor: **0** (cannot go negative)

### Final Score Calculation

```
Final Score = (Test Score × 0.7) + (Behavior Score × 0.3)
```

- Test Score: Percentage of correct answers (0-100)
- Behavior Score: Compliance score (0-100)
- Passing threshold: **85%** (configurable per certification)

## User Flow

1. **Browse Certifications**: User sees available certifications
2. **Start Test**: Click "Start Test" on desired certification
3. **Consent Modal**: Review proctoring requirements and accept
4. **Media Access**: Grant camera and microphone permissions
5. **Test Interface**: Full-screen test with timer
6. **Proctoring**: Continuous monitoring with AI detection
7. **Submit**: Submit answers or auto-submit on timeout
8. **Results**: View test score, behavior score, and final result
9. **Certificate**: Generate and download if passed

## Setup & Installation

### Backend Dependencies

Add to `services/api/requirements.txt`:

```txt
mediapipe==0.10.8
opencv-python-headless==4.8.1.78
ultralytics==8.0.196
```

### Installation

```bash
cd services/api
pip install -r requirements.txt
```

### Environment Variables

No additional environment variables required. Proctoring models are loaded on startup.

### Model Loading

Models are automatically loaded on FastAPI startup:
- YOLOv8 nano model for fast inference
- MediaPipe face detection and face mesh
- Models cached in memory for repeated use

## Configuration

### Proctoring Intervals

Edit `apps/web-frontend/src/components/certification/ProctoringMonitor.jsx`:

```javascript
// Change capture interval (default: 10 seconds)
intervalRef.current = setInterval(..., 10000);
```

### Behavior Score Penalties

Edit `services/api/src/services/proctoring.py`:

```python
penalties = {
    'phone_detected': 25,      # Change penalty values
    'face_not_detected': 15,
    'multiple_people': 30,
    # ... etc
}
```

### Final Score Weight

Edit `services/api/src/routes/certifications.py`:

```python
# Change weight ratio (default: 70% test, 30% behavior)
final_score = int((test_score * 0.7) + (behavior_score * 0.3))
```

## Admin Features

### Review Attempts

Admins can view all certification attempts with:
- User information
- Certification details
- Test score
- Behavior score
- Violation count
- Timestamps

### Review Logs

View detailed proctoring logs including:
- All violation events
- Timestamps
- Evidence metadata
- Admin review notes

### Override Scores

Admins can override behavior scores and add notes for manual review.

### Export for Audit

Proctoring logs can be exported for compliance auditing.

## Privacy & Security

### Data Retention
- Images are not stored permanently
- Evidence screenshots kept for 30 days
- Logs retained according to institutional policy

### Access Control
- Only test owner and admins can view logs
- All admin access is logged
- HTTPS required in production

### Consent
- Explicit consent required before media capture
- Privacy policy displayed in consent modal
- Users can decline (test not allowed)

## Limitations

### Browser-based Limitations
1. **Client-side controls**: Can be bypassed by knowledgeable users
2. **Privacy**: Some users may block camera/mic
3. **Network**: Requires stable internet connection
4. **Performance**: May impact lower-end devices

### Detection Limitations
1. **Face detection**: Poor lighting affects accuracy
2. **Object detection**: May have false positives
3. **Audio analysis**: Simple heuristics, not advanced AI
4. **Tab switching**: Limited detection in some browsers

## Best Practices

### For Test Takers
1. Ensure good lighting and camera positioning
2. Test in quiet environment
3. Close unnecessary applications
4. Stay visible to camera throughout test
5. Avoid phone or other devices nearby

### For Administrators
1. Review flagged attempts manually
2. Set appropriate passing thresholds
3. Monitor system performance
4. Regularly audit proctoring logs
5. Keep privacy policy updated

## Troubleshooting

### Camera/Mic Not Working
- Check browser permissions
- Verify device availability
- Test in different browser
- Clear browser cache

### Models Not Loading
- Check internet connection for initial download
- Verify disk space available
- Review backend logs for errors

### Slow Performance
- Reduce proctoring interval
- Use lighter YOLO model variant
- Optimize image capture quality
- Consider GPU acceleration

## Future Enhancements

Potential improvements:
1. Real-time video streaming instead of snapshots
2. Advanced AI for voice diarization
3. Browser extension for additional control
4. Mobile app support
5. Offline capability
6. Machine learning on violation patterns

## Support

For issues or questions:
- Check GitHub issues
- Review this documentation
- Contact system administrators
- Consult API documentation at `/docs`

