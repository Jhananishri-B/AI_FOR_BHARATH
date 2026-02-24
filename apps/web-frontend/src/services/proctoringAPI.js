import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ProctoringAPI {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/proctoring`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Register user's face for identity verification
  async registerFace(userId, faceImageFile) {
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('face_image', faceImageFile);

    const response = await this.api.post('/register-face', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Start a proctoring session
  async startSession(sessionId, userId, testSessionId, config) {
    const response = await this.api.post('/start-session', {
      session_id: sessionId,
      user_id: userId,
      test_session_id: testSessionId,
      config: config,
    });
    return response.data;
  }

  // Stop a proctoring session
  async stopSession(sessionId) {
    const response = await this.api.post(`/stop-session/${sessionId}`);
    return response.data;
  }

  // Process video frame for proctoring analysis
  async processFrame(sessionId, frameData) {
    const formData = new FormData();
    formData.append('frame_data', frameData);

    const response = await this.api.post(`/process-frame/${sessionId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Get session status
  async getSessionStatus(sessionId) {
    const response = await this.api.get(`/session-status/${sessionId}`);
    return response.data;
  }

  // Get all active sessions
  async getActiveSessions() {
    const response = await this.api.get('/active-sessions');
    return response.data;
  }

  // Save test session results
  async saveTestSession(testSession) {
    const response = await this.api.post('/save-test-session', testSession);
    return response.data;
  }

  // Issue certificate
  async issueCertificate(certificateRequest) {
    const response = await this.api.post('/issue-certificate', certificateRequest);
    return response.data;
  }

  // Get certificate by ID
  async getCertificate(certificateId) {
    const response = await this.api.get(`/certificate/${certificateId}`);
    return response.data;
  }

  // Get user certificates
  async getUserCertificates(userId) {
    const response = await this.api.get(`/user-certificates/${userId}`);
    return response.data;
  }

  // Verify certificate
  async verifyCertificate(verificationCode) {
    const response = await this.api.get(`/verify-certificate/${verificationCode}`);
    return response.data;
  }

  // Get user test sessions
  async getUserTestSessions(userId) {
    const response = await this.api.get(`/test-sessions/${userId}`);
    return response.data;
  }
}

// Create and export a singleton instance
const proctoringAPI = new ProctoringAPI();
export default proctoringAPI;
