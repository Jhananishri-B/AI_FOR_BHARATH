const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class CertificationService {
  async getPublicSpecs() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/cert-tests/specs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch specs');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      // Fallback mock for dev environments
      return [
        {
          cert_id: "DEMO-PYTHON",
          difficulties: [
            { name: "Easy", question_count: 5, duration_minutes: 10, pass_percentage: 60 },
          ],
          prerequisite_course_id: "",
        },
      ];
    }
  }
  async getCertifications() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/certifications/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch certifications: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching certifications:', error);
      throw error;
    }
  }

  async getTestSpec(certId, difficulty) {
    try {
      const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/admin/cert-tests/specs/${certId}/${difficulty}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching test spec:', error);
      return null;
    }
  }

  async getCertificationById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/certifications/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch certification: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching certification:', error);
      throw error;
    }
  }

  async getCertificationTopics() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/certifications/topics/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch topics: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching topics:', error);
      throw error;
    }
  }

  async getCertificationDifficulties(topicId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/certifications/topics/${topicId}/difficulties/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch difficulties: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching difficulties:', error);
      throw error;
    }
  }

  async startCertificationAttempt(topicId, difficulty, userName) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/certifications/attempts/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topic_id: topicId,
          difficulty: difficulty,
          user_name: userName
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to start attempt: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error starting certification attempt:', error);
      throw error;
    }
  }

  async getCertificationQuestions(attemptId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/certifications/attempts/${attemptId}/questions/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  }

  async submitAnswer(attemptId, questionId, answer) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/certifications/attempts/${attemptId}/answers/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question_id: questionId,
          answer: answer
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to submit answer: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw error;
    }
  }

  async submitCertificationAttempt(attemptId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/certifications/attempts/${attemptId}/submit/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to submit attempt: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting attempt:', error);
      throw error;
    }
  }

  async getCertificationResults(attemptId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/certifications/attempts/${attemptId}/results/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch results: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching results:', error);
      throw error;
    }
  }

  async getUserCertifications() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/certifications/user/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user certifications: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user certifications:', error);
      throw error;
    }
  }

  async getCertificationLeaderboard(certificationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/certifications/${certificationId}/leaderboard/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  // Mock data fallback for development
  getMockCertifications() {
    return [
      {
        id: 1,
        title: 'JavaScript Fundamentals',
        description: 'Master the basics of JavaScript programming with hands-on exercises and real-world projects.',
        difficulty: 'Easy',
        duration_minutes: 120,
        pass_percentage: 70,
        question_count: 20,
        is_active: true,
        tags: ['JavaScript', 'Programming', 'Fundamentals'],
        skills_covered: ['Variables', 'Functions', 'Objects', 'Arrays', 'DOM Manipulation'],
        learning_objectives: [
          'Understand JavaScript syntax and basic concepts',
          'Work with variables, functions, and objects',
          'Manipulate the DOM effectively',
          'Handle events and user interactions'
        ]
      },
      {
        id: 2,
        title: 'React Development',
        description: 'Build modern web applications with React, hooks, and state management.',
        difficulty: 'Medium',
        duration_minutes: 180,
        pass_percentage: 75,
        question_count: 25,
        is_active: true,
        tags: ['React', 'Frontend', 'JavaScript', 'Components'],
        skills_covered: ['Components', 'Hooks', 'State Management', 'Props', 'Lifecycle'],
        learning_objectives: [
          'Build reusable React components',
          'Use hooks for state and side effects',
          'Implement state management patterns',
          'Create responsive user interfaces'
        ]
      },
      {
        id: 3,
        title: 'Full Stack Development',
        description: 'Complete full-stack development with modern frameworks and best practices.',
        difficulty: 'Hard',
        duration_minutes: 300,
        pass_percentage: 80,
        question_count: 40,
        is_active: true,
        tags: ['Full Stack', 'Backend', 'Frontend', 'Database'],
        skills_covered: ['API Design', 'Database Design', 'Authentication', 'Deployment'],
        learning_objectives: [
          'Design and implement RESTful APIs',
          'Work with databases and ORMs',
          'Implement authentication and authorization',
          'Deploy applications to production'
        ]
      }
    ];
  }

  getMockTopics() {
    return [
      {
        id: 1,
        title: 'Programming Languages',
        description: 'Master various programming languages and their paradigms',
        icon: '💻',
        color: 'blue',
        certifications: [1, 2]
      },
      {
        id: 2,
        title: 'Web Development',
        description: 'Build modern web applications with cutting-edge technologies',
        icon: '🌐',
        color: 'green',
        certifications: [2, 3]
      },
      {
        id: 3,
        title: 'Data Science',
        description: 'Analyze data and build machine learning models',
        icon: '📊',
        color: 'purple',
        certifications: []
      }
    ];
  }

  getMockDifficulties(topicId) {
    const difficulties = {
      1: [
        {
          id: 1,
          name: 'Beginner',
          description: 'Perfect for those new to programming',
          duration: '2 hours',
          questions: 20,
          pass_percentage: 70,
          color: 'green'
        },
        {
          id: 2,
          name: 'Intermediate',
          description: 'For those with some programming experience',
          duration: '3 hours',
          questions: 30,
          pass_percentage: 75,
          color: 'yellow'
        }
      ],
      2: [
        {
          id: 3,
          name: 'Intermediate',
          description: 'Build modern web applications',
          duration: '3 hours',
          questions: 25,
          pass_percentage: 75,
          color: 'blue'
        },
        {
          id: 4,
          name: 'Advanced',
          description: 'Master full-stack development',
          duration: '5 hours',
          questions: 40,
          pass_percentage: 80,
          color: 'red'
        }
      ]
    };

    return difficulties[topicId] || [];
  }
}

export default new CertificationService();
