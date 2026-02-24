import React, { useState, useRef } from 'react';
import { Award, Download, Trophy, TrendingUp, CheckCircle2, Share2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

export const TestResults = ({ topic, difficulty, userName, testData, onReturnHome }) => {
  const certificateRef = useRef(null);
  const [reviewRequested, setReviewRequested] = useState(false);
  const [requestingReview, setRequestingReview] = useState(false);
  
  const testScore = testData.test_score || 0;
  const behaviorScore = testData.behavior_score || 100;
  const finalScore = testData.final_score || 0;
  const passPercentage = testData.pass_percentage || testData.settings?.pass_percentage || 70;
  const isPassed = finalScore >= passPercentage;
  
  // Check if eligible for review (within 10% of pass threshold)
  const reviewThreshold = passPercentage * 0.9; // 90% of pass threshold
  const isEligibleForReview = !isPassed && finalScore >= reviewThreshold && finalScore < passPercentage;
  const pointsNeeded = passPercentage - finalScore;

  const downloadCertificate = async () => {
    if (certificateRef.current) {
      try {
        const canvas = await html2canvas(certificateRef.current, {
          scale: 2,
          backgroundColor: '#ffffff',
        });
        
        const link = document.createElement('a');
        link.download = `${userName.replace(/\s+/g, '_')}_${topic.title}_Certificate.png`;
        link.href = canvas.toDataURL();
        link.click();
        toast.success('Certificate downloaded successfully!');
      } catch (error) {
        toast.error('Failed to download certificate');
      }
    }
  };

  const requestReview = async () => {
    setRequestingReview(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/cert-tests/attempts/${testData.attempt_id}/request-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reason: `Score ${finalScore}% is within review threshold (pass: ${passPercentage}%)`,
          student_comment: 'Requesting manual review for score adjustment consideration'
        })
      });
      
      if (response.ok) {
        setReviewRequested(true);
        toast.success('Review request submitted successfully! An admin will review your test.');
      } else {
        toast.error('Failed to request review. Please try again.');
      }
    } catch (error) {
      console.error('Error requesting review:', error);
      toast.error('Failed to request review. Please try again.');
    } finally {
      setRequestingReview(false);
    }
  };

  const scoreBreakdown = [
    {
      label: 'Test Performance',
      score: testScore,
      weight: '70%',
      color: 'from-primary to-primary-light',
    },
    {
      label: 'Behavior Score',
      score: behaviorScore,
      weight: '30%',
      color: 'from-secondary to-secondary-light',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl"
        >
          {/* Results Header */}
          <div className="mb-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent"
            >
              {isPassed ? (
                <Trophy className="h-10 w-10 text-white" />
              ) : (
                <TrendingUp className="h-10 w-10 text-white" />
              )}
            </motion.div>
            <h1 className="mb-2 font-display text-3xl font-bold text-foreground sm:text-4xl">
              {isPassed ? 'Congratulations!' : 'Test Completed'}
            </h1>
            <p className="text-lg text-muted-foreground">
              {isPassed
                ? 'You have successfully passed the certification'
                : 'You can retake the test to improve your score'}
            </p>
          </div>

          {/* Final Score Card */}
          <Card className="mb-8 border-2 border-primary/20 shadow-lg">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="mb-2 text-sm font-semibold text-muted-foreground">
                  Final Score
                </div>
                <div className="mb-2">
                  <span className="font-display text-6xl font-bold text-primary">
                    {finalScore}
                  </span>
                  <span className="text-3xl text-muted-foreground">%</span>
                </div>
                <div className="mb-4 text-sm text-muted-foreground">
                  Required to pass: <span className="font-semibold">{passPercentage}%</span>
                </div>
                <Badge
                  variant={isPassed ? 'success' : 'warning'}
                  className="px-6 py-2 text-base"
                >
                  {isPassed ? 'PASSED' : 'NOT PASSED'}
                </Badge>
                
                {/* Review Eligibility Notice */}
                {isEligibleForReview && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                          Eligible for Manual Review
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                          You scored {finalScore}%, just {pointsNeeded.toFixed(1)}% below the pass threshold. 
                          Your test can be reviewed by an administrator for potential score adjustment.
                        </p>
                        {!reviewRequested && !testData.review_requested && (
                          <Button
                            onClick={requestReview}
                            disabled={requestingReview}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {requestingReview ? 'Requesting...' : 'Request Manual Review'}
                          </Button>
                        )}
                        {(reviewRequested || testData.review_requested) && (
                          <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-300">
                            ✓ Review Requested - Admin will review your test
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Score Breakdown */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Score Breakdown</CardTitle>
              <CardDescription>How your final score was calculated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {scoreBreakdown.map((item, index) => (
                  <div key={index}>
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-foreground">{item.label}</span>
                        <Badge variant="outline" className="ml-2">
                          {item.weight}
                        </Badge>
                      </div>
                      <span className="text-xl font-bold text-primary">{item.score}%</span>
                    </div>
                    <Progress value={item.score} max={100} />
                  </div>
                ))}
              </div>

              {testData.violations?.tabSwitch > 0 && (
                <div className="mt-6 rounded-lg bg-warning/10 p-4 text-sm">
                  <strong className="text-warning">Note:</strong> {testData.violations.tabSwitch} tab switch(es) detected, resulting in behavior score deductions.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Certificate */}
          {isPassed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="mb-8 overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Your Certificate
                  </CardTitle>
                  <CardDescription>
                    Download and share your achievement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Certificate Design */}
                  <div
                    ref={certificateRef}
                    className="relative overflow-hidden rounded-xl border-4 border-primary/20 bg-gradient-to-br from-white via-primary/5 to-accent/5 p-12 shadow-lg"
                  >
                    {/* Decorative Elements */}
                    <div className="absolute left-0 top-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
                    <div className="absolute bottom-0 right-0 h-32 w-32 rounded-full bg-accent/10 blur-3xl" />

                    <div className="relative text-center">
                      {/* Header */}
                      <div className="mb-6 flex items-center justify-center gap-3">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                          <Award className="h-8 w-8 text-white" />
                        </div>
                      </div>

                      <h2 className="mb-2 font-display text-3xl font-bold text-foreground">
                        Certificate of Achievement
                      </h2>
                      <p className="mb-8 text-muted-foreground">LearnQuest Certification Program</p>

                      {/* Content */}
                      <div className="mb-8">
                        <p className="mb-4 text-lg text-muted-foreground">This certifies that</p>
                        <h3 className="mb-4 font-display text-4xl font-bold text-primary">
                          {userName}
                        </h3>
                        <p className="mb-2 text-lg text-muted-foreground">
                          has successfully completed the
                        </p>
                        <h4 className="mb-2 text-2xl font-semibold text-foreground">
                          {topic.title} Certification
                        </h4>
                        <Badge variant="default" className="mt-2 text-base">
                          {difficulty.name} Level
                        </Badge>
                      </div>

                      {/* Score */}
                      <div className="mb-6 flex items-center justify-center gap-8">
                        <div>
                          <div className="text-sm text-muted-foreground">Score Achieved</div>
                          <div className="text-2xl font-bold text-primary">{finalScore}%</div>
                        </div>
                        <div className="h-12 w-px bg-border" />
                        <div>
                          <div className="text-sm text-muted-foreground">Date</div>
                          <div className="text-2xl font-bold text-foreground">
                            {new Date().toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span>Verified & Authenticated</span>
                      </div>
                    </div>
                  </div>

                  {/* Download Button */}
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Button
                      variant="premium"
                      size="lg"
                      onClick={downloadCertificate}
                      className="flex-1"
                    >
                      <Download className="h-5 w-5" />
                      Download Certificate
                    </Button>
                    <Button variant="outline" size="lg" className="flex-1">
                      <Share2 className="h-5 w-5" />
                      Share Achievement
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Test Statistics */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Test Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg bg-muted/50 p-4 text-center">
                  <div className="mb-1 text-sm text-muted-foreground">Questions</div>
                  <div className="text-2xl font-bold text-foreground">{testData.answers?.length || 0}</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-4 text-center">
                  <div className="mb-1 text-sm text-muted-foreground">Correct</div>
                  <div className="text-2xl font-bold text-success">
                    {testData.answers?.filter(a => a.isCorrect).length || 0}
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 p-4 text-center">
                  <div className="mb-1 text-sm text-muted-foreground">Topic</div>
                  <div className="text-sm font-bold text-foreground">{topic.title}</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-4 text-center">
                  <div className="mb-1 text-sm text-muted-foreground">Level</div>
                  <div className="text-sm font-bold text-foreground">{difficulty.name}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" variant="outline" onClick={onReturnHome} className="w-full sm:w-auto">
              Return to Home
            </Button>
            {!isPassed && (
              <Button size="lg" variant="premium" onClick={onReturnHome} className="w-full sm:w-auto">
                Retake Test
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
