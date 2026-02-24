"""
Proctoring API routes

Provides a WebSocket endpoint for live video frames and simple REST endpoints
to fetch proctoring sessions and violations.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from typing import Dict, Any, List, Optional
from datetime import datetime
from bson import ObjectId
import cv2
import numpy as np
import base64
import logging
import time

from ..database import get_collection
from ..auth import get_current_user
from ..proctoring_detector import ProctoringDetector

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/proctoring", tags=["proctoring"])

# Active proctoring sessions in memory (attempt_id -> detector)
active_sessions: Dict[str, ProctoringDetector] = {}


@router.websocket("/ws/{attempt_id}")
async def proctoring_websocket(websocket: WebSocket, attempt_id: str):
    """WebSocket endpoint for real-time proctoring.

    Clients send base64-encoded JPEG frames as JSON {"frame": "data:..."}.
    Server replies with detection summary and stores violations in MongoDB.
    """
    await websocket.accept()
    logger.info(f"Proctoring WebSocket connected for attempt: {attempt_id}")

    proctoring_sessions = get_collection("proctoring_sessions")
    proctoring_violations = get_collection("proctoring_violations")
    cert_attempts = get_collection("cert_attempts")  # Added to update main attempt document

    # Create detector instance
    detector = ProctoringDetector()
    active_sessions[attempt_id] = detector
    
    # Track noise violations (count consecutive frames above threshold)
    noise_consecutive_count = 0
    last_noise_violation_time = 0
    NOISE_COOLDOWN = 2  # seconds between noise violations

    # Create/update proctoring session
    session_data = {
        "attempt_id": attempt_id,
        "started_at": datetime.utcnow(),
        "status": "active",
        "total_violations": 0,
        "violation_counts": {
            "looking_away": 0,
            "phone_detected": 0,
            "multiple_people": 0,
            "no_face": 0,
            "prohibited_object": 0,
            "excessive_noise": 0,
        },
    }

    session_result = proctoring_sessions.update_one(
        {"attempt_id": attempt_id}, {"$set": session_data}, upsert=True
    )
    session_id = (
        session_result.upserted_id
        or proctoring_sessions.find_one({"attempt_id": attempt_id})["_id"]
    )

    try:
        while True:
            data = await websocket.receive_json()
            logger.info(f"📩 Received WebSocket message: action={data.get('action')}, type={data.get('type')}, has_frame={bool(data.get('frame'))}")

            if data.get("action") == "stop":
                logger.info(f"Stopping proctoring for attempt: {attempt_id}")
                break

            # Handle noise violation separately
            if data.get("type") == "noise_violation":
                try:
                    noise_level = data.get("noise_level", 0)
                    threshold = data.get("threshold", 15)
                    
                    # Track consecutive frames above threshold (need 12 frames = 3 seconds at 4 FPS)
                    if noise_level > threshold:
                        noise_consecutive_count += 1
                        
                        # Only trigger violation after 12 consecutive frames (3 seconds) AND cooldown passed
                        if noise_consecutive_count >= 12:
                            current_time = time.time()
                            if current_time - last_noise_violation_time >= NOISE_COOLDOWN:
                                violation_doc = {
                                    "attempt_id": attempt_id,
                                    "session_id": str(session_id),
                                    "type": "excessive_noise",
                                    "severity": "medium",
                                    "message": f"Excessive noise detected (level: {noise_level}, threshold: {threshold})",
                                    "timestamp": datetime.utcnow(),
                                    "metadata": {
                                        "noise_level": noise_level,
                                        "threshold": threshold,
                                    },
                                }
                                proctoring_violations.insert_one(violation_doc)
                                
                                # Update session violation counts
                                proctoring_sessions.update_one(
                                    {"_id": session_id},
                                    {
                                        "$inc": {
                                            "violation_counts.excessive_noise": 1,
                                            "total_violations": 1,
                                        }
                                    },
                                )
                                
                                # ALSO update cert_attempts document
                                try:
                                    from bson import ObjectId
                                    cert_attempts.update_one(
                                        {"_id": ObjectId(attempt_id)},
                                        {
                                            "$push": {
                                                "proctoring_events": {
                                                    "type": "violation",
                                                    "violation_type": "excessive_noise",
                                                    "severity": "medium",
                                                    "message": f"Excessive noise detected (level: {noise_level}, threshold: {threshold})",
                                                    "timestamp": datetime.utcnow(),
                                                    "metadata": {
                                                        "noise_level": noise_level,
                                                        "threshold": threshold,
                                                    }
                                                }
                                            },
                                            "$inc": {
                                                "violations.excessive_noise": 1
                                            }
                                        }
                                    )
                                except Exception as e:
                                    logger.error(f"Failed to update cert_attempts with noise violation: {e}")
                                
                                logger.info(f"Noise violation recorded: {noise_level}")
                                last_noise_violation_time = current_time
                                noise_consecutive_count = 0  # Reset after logging violation
                    else:
                        # Reset counter if noise drops below threshold
                        noise_consecutive_count = 0
                        
                except Exception as e:
                    logger.error(f"Error processing noise violation: {e}")
                continue

            frame_data = data.get("frame")
            if not frame_data:
                continue

            try:
                img_data = base64.b64decode(
                    frame_data.split(",")[1] if "," in frame_data else frame_data
                )
                nparr = np.frombuffer(img_data, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                if frame is None:
                    logger.warning("Failed to decode frame")
                    continue

                # Process frame
                result = detector.process_frame(frame)

                # Save violations to database
                if result.get("violations"):
                    logger.info(f"🚨 VIOLATIONS DETECTED for attempt {attempt_id}: {len(result.get('violations'))} violations")
                    for violation in result["violations"]:
                        logger.info(f"   - Type: {violation.get('type')}, Severity: {violation.get('severity')}, Message: {violation.get('message')}")
                        violation_doc = {
                            "attempt_id": attempt_id,
                            "session_id": str(session_id),
                            "type": violation.get("type"),
                            "severity": violation.get("severity"),
                            "message": violation.get("message"),
                            "timestamp": datetime.fromisoformat(violation.get("timestamp")),
                            "metadata": {
                                "yaw": result.get("yaw"),
                                "pitch": result.get("pitch"),
                                "person_count": result.get("person_count"),
                            },
                        }
                        proctoring_violations.insert_one(violation_doc)

                        # Update session violation counts
                        proctoring_sessions.update_one(
                            {"_id": session_id},
                            {
                                "$inc": {
                                    f"violation_counts.{violation.get('type')}": 1,
                                    "total_violations": 1,
                                }
                            },
                        )
                        
                        # ALSO update cert_attempts document for easy retrieval
                        try:
                            from bson import ObjectId
                            cert_attempts.update_one(
                                {"_id": ObjectId(attempt_id)},
                                {
                                    "$push": {
                                        "proctoring_events": {
                                            "type": "violation",
                                            "violation_type": violation.get("type"),
                                            "severity": violation.get("severity"),
                                            "message": violation.get("message"),
                                            "timestamp": datetime.fromisoformat(violation.get("timestamp")),
                                            "metadata": {
                                                "yaw": result.get("yaw"),
                                                "pitch": result.get("pitch"),
                                                "person_count": result.get("person_count"),
                                            }
                                        }
                                    },
                                    "$inc": {
                                        f"violations.{violation.get('type')}": 1
                                    }
                                }
                            )
                        except Exception as e:
                            logger.error(f"Failed to update cert_attempts with violation: {e}")

                # Send result back to client
                await websocket.send_json(
                    {
                        "status": "success",
                        "data": {
                            "looking_away": result.get("looking_away"),
                            "phone_detected": result.get("phone_detected"),
                            "multiple_people": result.get("multiple_people"),
                            "has_violations": len(result.get("violations", [])) > 0,
                            "violations": result.get("violations", []),
                            "yaw": result.get("yaw"),
                            "pitch": result.get("pitch"),
                        },
                    }
                )

            except Exception as e:
                logger.error(f"Error processing frame: {e}", exc_info=True)
                await websocket.send_json({"status": "error", "message": str(e)})

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for attempt: {attempt_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
    finally:
        # Cleanup
        if attempt_id in active_sessions:
            try:
                active_sessions[attempt_id].cleanup()
            except Exception:
                pass
            del active_sessions[attempt_id]

        # Mark session as completed
        proctoring_sessions.update_one(
            {"_id": session_id}, {"$set": {"ended_at": datetime.utcnow(), "status": "completed"}}
        )


@router.get("/session/{attempt_id}")
async def get_proctoring_session(attempt_id: str, current_user=Depends(get_current_user)):
    """Get proctoring session details"""
    proctoring_sessions = get_collection("proctoring_sessions")
    proctoring_violations = get_collection("proctoring_violations")

    session = proctoring_sessions.find_one({"attempt_id": attempt_id})

    if not session:
        raise HTTPException(status_code=404, detail="Proctoring session not found")

    # Get violations
    violations = list(
        proctoring_violations.find({"attempt_id": attempt_id}).sort("timestamp", -1)
    )

    # Convert ObjectIds to strings
    session["_id"] = str(session["_id"])
    for v in violations:
        v["_id"] = str(v["_id"])
        if "session_id" in v:
            v["session_id"] = str(v["session_id"])

    return {"session": session, "violations": violations}


@router.get("/violations/{attempt_id}")
async def get_proctoring_violations(attempt_id: str, current_user=Depends(get_current_user)):
    """Return a list of violations for an attempt"""
    proctoring_violations = get_collection("proctoring_violations")
    violations = list(proctoring_violations.find({"attempt_id": attempt_id}).sort("timestamp", -1))
    for v in violations:
        v["_id"] = str(v["_id"])
        if "session_id" in v:
            v["session_id"] = str(v["session_id"])
    return {"violations": violations}