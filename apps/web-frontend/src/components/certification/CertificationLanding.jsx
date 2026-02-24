import React, { useState, useEffect } from 'react';
import { Award, Shield, TrendingUp, CheckCircle2, Camera, Mic, Monitor, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import certificationService from '../../services/certificationService';

const CertificationLanding = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCertificates: 0,
    passRate: 0,
    totalTopics: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const certifications = await certificationService.getCertifications();
      const topics = await certificationService.getCertificationTopics();
      
      const totalCertificates = certifications.length;
      const passRate = certifications.length > 0 
        ? Math.round(certifications.reduce((acc, cert) => acc + (cert.pass_percentage || 70), 0) / certifications.length)
        : 0;
      const totalTopics = topics.length;

      setStats({
        totalCertificates,
        passRate,
        totalTopics
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        totalCertificates: 10,
        passRate: 85,
        totalTopics: 3
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Shield,
      title: 'Proctored Testing',
      description: 'AI-powered monitoring ensures exam integrity with face detection and behavior tracking.',
    },
    {
      icon: Award,
      title: 'Industry Recognition',
      description: 'Earn certificates that validate your skills and boost your professional profile.',
    },
    {
      icon: TrendingUp,
      title: 'Multiple Difficulty Levels',
      description: 'Choose from Easy, Medium, or Hard levels to match your expertise.',
    },
  ];

  const requirements = [
    { icon: Camera, label: 'Webcam Required', desc: 'For identity verification' },
    { icon: Mic, label: 'Microphone Active', desc: 'To monitor test environment' },
    { icon: Monitor, label: 'Full Screen Mode', desc: 'No tab switching allowed' },
  ];

  const displayStats = [
    { value: `${stats.totalCertificates}+`, label: 'Certificates Available' },
    { value: `${stats.passRate}%`, label: 'Average Pass Rate' },
    { value: `${stats.totalTopics}+`, label: 'Skill Topics' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <Award className="h-6 w-6 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-white">LearnQuest Certifications</span>
            </div>
            <div className="hidden md:inline-flex px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium">
              Professional Certification Platform
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="mb-4 inline-block rounded-full bg-blue-500/20 px-4 py-2 text-blue-300 text-sm font-medium border border-blue-500/30">
            Trusted by Industry Leaders
          </div>
          <h1 className="mb-6 font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Validate Your Skills with
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Professional Certifications
            </span>
          </h1>
          <p className="mb-8 text-lg text-slate-400 sm:text-xl">
            Demonstrate your technical mastery through rigorous, proctored assessments. 
            Earn industry-recognized certificates that showcase your expertise.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={() => navigate('/certification/topics')}
              className="w-full sm:w-auto flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Start Certification
              <ArrowRight className="h-5 w-5" />
            </button>
            <button 
              onClick={() => navigate('/certification/topics')}
              className="w-full sm:w-auto border-2 border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all"
            >
              Browse Topics
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3"
        >
          {displayStats.map((stat, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-center shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <div className="mb-2 font-display text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                {loading ? '...' : stat.value}
              </div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="border-y border-slate-700 bg-slate-800/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-display text-3xl font-bold text-white sm:text-4xl">
              Why Choose Our Certification
            </h2>
            <p className="text-lg text-slate-400">
              Advanced proctoring technology ensures fair and credible assessments
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-blue-500"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                    <Icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-xl border-2 border-blue-500/30 bg-slate-800/50 p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-400" />
                System Requirements
              </h2>
              <p className="text-slate-400 mb-6">
                Ensure your setup meets these requirements for a smooth testing experience
              </p>
              <div className="space-y-4">
                {requirements.map((req, index) => {
                  const Icon = req.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-4 rounded-lg border border-slate-700 bg-slate-700/30 p-4 transition-all duration-300 hover:bg-slate-700/50"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500/20">
                        <Icon className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{req.label}</div>
                        <div className="text-sm text-slate-400">{req.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4 text-sm text-yellow-300">
                <strong className="text-yellow-400">Important:</strong> Tab switching and environmental noise will be monitored and may affect your final score.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-slate-700 bg-gradient-to-br from-blue-900/20 to-purple-900/20 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold text-white sm:text-4xl">
            Ready to Get Certified?
          </h2>
          <p className="mb-8 text-lg text-slate-400">
            Join thousands of professionals who have validated their skills
          </p>
          <button onClick={() => navigate('/certification/topics')} className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
            Begin Your Assessment
            <Award className="h-5 w-5" />
          </button>
        </div>
      </section>
    </div>
  );
};

export { CertificationLanding };
export default CertificationLanding;
