import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { coursesAPI, usersAPI } from '../services/api';
import Layout from '../components/Layout';
import { BookOpen, Star, Zap, Clock, Loader2, AlertCircle } from 'lucide-react';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completedCourseIds, setCompletedCourseIds] = useState(new Set());

  const fetchCourses = async () => {
    try {
      const [coursesRes, dashRes] = await Promise.all([
        coursesAPI.getCourses(),
        usersAPI.getDashboard().then(r => r.data).catch(() => null)
      ]);
      const courseList = coursesRes.data || [];
      setCourses(courseList);

      // Use server-computed completion status if available, otherwise compute client-side
      const serverCompletion = dashRes?.courses_completion_status || {};
      const completedTopics = new Set(dashRes?.completed_topics || []);
      const completedModules = new Set(dashRes?.completed_modules || []);
      console.log('=== COURSE COMPLETION DEBUG ===');
      console.log('Dashboard data:', dashRes);
      console.log('Completed topics:', Array.from(completedTopics));
      console.log('Completed modules:', Array.from(completedModules));
      console.log('Enrolled courses:', dashRes?.enrolled_courses);
      
      const completedIds = new Set();
      const enrolled = Array.isArray(dashRes?.enrolled_courses) ? dashRes.enrolled_courses : [];
      const enrolledCompletedIds = new Set(
        enrolled
          .filter(ec => ec && (ec.completed || ec.status === 'completed'))
          .map(ec => ec.course_id || ec.id)
      );
      console.log('Enrolled completed IDs:', Array.from(enrolledCompletedIds));
      
      console.log('Server completion status:', serverCompletion);
      
      courseList.forEach(c => {
        // First check server-computed status
        const serverCompleted = serverCompletion[c.id] === true;
        if (serverCompleted) {
          completedIds.add(c.id);
          console.log(`✅ Course ${c.title} is completed (server-computed)!`);
          return;
        }
        
        // Fall back to client-side computation
        const modules = c.modules || [];
        const allTopicIds = modules.flatMap(m => (m.topics || []).map(t => t.topic_id)).filter(Boolean);
        const allModuleIds = modules.map(m => m.module_id).filter(Boolean);
        
        console.log(`\n--- Course: ${c.title} (ID: ${c.id}) ---`);
        console.log('All topic IDs:', allTopicIds);
        console.log('All module IDs:', allModuleIds);
        
        const topicsDone = allTopicIds.length > 0 && allTopicIds.every(tid => completedTopics.has(tid));
        const modulesDone = allModuleIds.length > 0 && allModuleIds.every(mid => completedModules.has(mid));
        const enrolledDone = enrolledCompletedIds.has(c.id);
        
        console.log('Topics done:', topicsDone);
        console.log('Modules done:', modulesDone);
        console.log('Enrolled done:', enrolledDone);
        
        if (topicsDone || modulesDone || enrolledDone) {
          completedIds.add(c.id);
          console.log(`✅ Course ${c.title} is completed!`);
        } else {
          console.log(`❌ Course ${c.title} is NOT completed`);
        }
      });
      
      console.log('\n=== FINAL COMPLETED COURSE IDs ===', Array.from(completedIds));
      console.log('=== END DEBUG ===\n');
      setCompletedCourseIds(completedIds);
    } catch (err) {
      setError('Failed to load courses');
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Refresh when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      fetchCourses();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading courses...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
            <p className="text-slate-400">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Master New Skills
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-3xl mx-auto">
            Discover interactive courses, take quizzes, and earn XP as you progress through your learning journey.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/login"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg"
            >
              Start Learning
            </Link>
            <Link
              to="/login"
              className="border border-slate-600 text-slate-300 px-8 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-all duration-200 font-medium"
            >
              Sign In
            </Link>
            <button
              onClick={fetchCourses}
              className="border border-green-600 text-green-300 px-8 py-3 rounded-lg hover:bg-green-800 hover:text-white transition-all duration-200 font-medium"
            >
              Refresh Progress
            </button>
          </div>
        </div>

        {/* Courses Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-4 text-center">Available Courses</h2>
          <p className="text-slate-400 text-center mb-8">Choose a course to start your learning journey</p>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => {
            const isCompleted = completedCourseIds.has(course.id);
            return (
            <div key={course.id} className={`group rounded-2xl border overflow-hidden transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl ${isCompleted ? 'bg-slate-900 border-green-700' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}>
              <div className="p-8">
                <div className="mb-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                      {course.title}
                      {isCompleted && (
                        <span className="px-2 py-1 text-xs rounded bg-green-900/40 text-green-300 border border-green-700">Completed</span>
                      )}
                    </h3>
                  </div>
                  <p className="text-slate-400 leading-relaxed">{course.description}</p>
                </div>
                
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-slate-400">
                        {course.modules?.length || 0} modules
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-semibold text-yellow-400">
                        {course.xp_reward} XP
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  to={`/courses/${course.slug}`}
                  className={`block w-full text-center py-3 px-6 rounded-lg transition-all duration-200 font-medium shadow-lg group-hover:shadow-xl ${isCompleted ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'}`}
                >
                  {isCompleted ? 'Review Course' : 'Start Course'}
                </Link>
              </div>
            </div>
          )})}
        </div>

        {courses.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
              <BookOpen className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No courses available</h3>
            <p className="text-slate-400">Check back later for new courses!</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Courses;
