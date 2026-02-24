import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const adminAPI = {
  // Users
  listUsers: () => api.get('/api/admin/users/'),
  getUser: (id) => api.get(`/api/admin/users/${id}`),
  createUser: (data) => api.post('/api/admin/users/', data),
  updateUser: (id, data) => api.put(`/api/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/api/admin/users/${id}`),

  // Courses
  getCourses: () => api.get('/api/admin/courses/'),
  createCourse: (data) => api.post('/api/admin/courses', data),
  getCourse: (id) => api.get(`/api/admin/courses/${id}`),
  updateCourse: (id, data) => api.put(`/api/admin/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/api/admin/courses/${id}`),
  getTopicsForCourse: (courseId) => api.get(`/api/admin/courses/${courseId}/topics`),
  uploadCourseJson: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/api/admin/courses/import-json', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // Practice Zone
  getProblems: () => api.get('/api/admin/problems/'),
  getProblem: (id) => api.get(`/api/admin/problems/${id}`),
  createProblem: (data) => api.post('/api/admin/problems/', data),
  updateProblem: (id, data) => api.put(`/api/admin/problems/${id}`, data),
  deleteProblem: (id) => api.delete(`/api/admin/problems/${id}`),
  toggleProblemStatus: (id, isActive) => api.patch(`/api/admin/problems/${id}/toggle`, { is_practice_problem: isActive }),
  uploadProblemsJson: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/api/admin/problems/import-json', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

}

export const adminCertTestsAPI = {
  // Question Banks
  listBanks: () => api.get('/api/admin/cert-tests/banks'),
  getBank: (bankId) => api.get(`/api/admin/cert-tests/banks/${bankId}`),
  deleteBank: (bankId) => api.delete(`/api/admin/cert-tests/banks/${bankId}`),
  updateBank: (bankId, payload) => api.put(`/api/admin/cert-tests/banks/${bankId}`, payload),
  uploadBanks: (files) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return api.post('/api/admin/cert-tests/banks', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Test Specs
  createSpec: (payload) => api.post('/api/admin/cert-tests/specs', payload),
  listSpecs: (params) => api.get('/api/admin/cert-tests/specs', { params }),
  getSpecForCertDifficulty: (certId, difficulty) =>
    api.get(`/api/admin/cert-tests/specs/${certId}/${difficulty}`),
  deleteSpec: (certId, difficulty) =>
    api.delete(`/api/admin/cert-tests/specs/${certId}/${difficulty}`).catch((e) => {
      if (e.response && e.response.status === 405) {
        return api.post(`/api/admin/cert-tests/specs/${certId}/${difficulty}/delete`)
      }
      throw e
    }),
  setSpecActive: (certId, difficulty, active) =>
    api.patch(`/api/admin/cert-tests/specs/${certId}/${difficulty}/status`, { active }),
  
  // Test Attempts (Results)
  getAllAttempts: () => api.get('/api/cert-tests/attempts'),
  getAttempt: (attemptId) => api.get(`/api/cert-tests/attempts/${attemptId}`),
  
  // Certificate Management
  sendBulkCertificates: (attemptIds) => 
    api.post('/api/admin/cert-tests/certificates/send-bulk', { attempt_ids: attemptIds }),
  getCertificateStats: () => 
    api.get('/api/admin/cert-tests/certificates/stats'),
  updateCertificateStatus: (attemptId, payload) =>
    api.patch(`/api/admin/cert-tests/certificates/${attemptId}/status`, payload),
};

export default api


