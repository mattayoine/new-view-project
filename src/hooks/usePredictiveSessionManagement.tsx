import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SuccessPrediction {
  sessionId: string;
  assignmentId: string;
  successProbability: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  keyFactors: {
    factor: string;
    impact: number;
    description: string;
  }[];
  recommendations: string[];
}

export interface MatchOptimization {
  advisorId: string;
  founderId: string;
  compatibilityScore: number;
  sessionSuccessRate: number;
  communicationStyle: string;
  expertiseAlignment: number;
  recommendedActions: string[];
}

export interface ProactiveIntervention {
  assignmentId: string;
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  interventionType: 'communication' | 'matching' | 'scheduling' | 'content';
  suggestedActions: string[];
  urgency: number;
  predictedOutcome: string;
}

export interface PersonalizedCoaching {
  userId: string;
  role: 'advisor' | 'founder';
  strengths: string[];
  improvementAreas: string[];
  customRecommendations: string[];
  skillGaps: string[];
  nextSteps: string[];
}

export interface SessionIntelligence {
  assignmentId: string;
  contentAnalysis: {
    keyTopics: string[];
    engagementLevel: 'low' | 'medium' | 'high';
    knowledgeGaps: string[];
    discussionDepth: number;
  };
  smartRecommendations: {
    nextTopics: string[];
    optimalFrequency: string;
    resourceSuggestions: string[];
    goalAlignment: string[];
  };
  predictiveInsights: {
    successPrediction: number;
    riskFactors: string[];
    improvementAreas: string[];
  };
}

export const useSuccessPrediction = (sessionId?: string, assignmentId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['success-prediction', sessionId, assignmentId],
    queryFn: async () => {
      if (!sessionId && !assignmentId) return null;

      // Get session and assignment data
      let query = supabase
        .from('sessions')
        .select(`
          *,
          assignment:advisor_founder_assignments(
            *,
            advisor:users!advisor_id(*),
            founder:users!founder_id(*)
          ),
          session_analysis(*)
        `);

      if (sessionId) {
        query = query.eq('id', sessionId);
      } else if (assignmentId) {
        query = query.eq('assignment_id', assignmentId);
      }

      const { data: sessions, error } = await query;
      if (error) throw error;

      if (!sessions || sessions.length === 0) return null;

      // Calculate success predictions for each session
      return sessions.map(session => calculateSuccessPrediction(session));
    },
    enabled: !!user && (!!sessionId || !!assignmentId)
  });
};

export const useOptimalMatching = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['optimal-matching'],
    queryFn: async () => {
      // Get all active assignments with their success metrics
      const { data: assignments, error } = await supabase
        .from('advisor_founder_assignments')
        .select(`
          *,
          advisor:users!advisor_id(*),
          founder:users!founder_id(*),
          sessions(
            id, status, founder_rating, advisor_rating, 
            scheduled_at, duration_minutes
          )
        `)
        .eq('status', 'active')
        .is('deleted_at', null);

      if (error) throw error;

      // Analyze and optimize matches
      return (assignments || []).map(assignment => 
        analyzeMatchOptimization(assignment)
      );
    },
    enabled: !!user
  });
};

export const useProactiveInterventions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['proactive-interventions'],
    queryFn: async () => {
      // Get assignments that might need intervention
      const { data: assignments, error } = await supabase
        .from('advisor_founder_assignments')
        .select(`
          *,
          sessions(
            id, status, founder_rating, advisor_rating,
            scheduled_at, duration_minutes, created_at
          )
        `)
        .eq('status', 'active')
        .is('deleted_at', null);

      if (error) throw error;

      // Identify at-risk assignments
      return (assignments || [])
        .map(assignment => identifyInterventionNeeds(assignment))
        .filter(intervention => intervention.riskLevel !== 'low');
    },
    enabled: !!user
  });
};

export const usePersonalizedCoaching = (userId: string, role: 'advisor' | 'founder') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['personalized-coaching', userId, role],
    queryFn: async () => {
      if (!userId) return null;

      // Get user's session history and performance
      const { data: assignments, error } = await supabase
        .from('advisor_founder_assignments')
        .select(`
          *,
          sessions(
            id, status, founder_rating, advisor_rating,
            duration_minutes, notes, ai_summary
          )
        `)
        .or(role === 'advisor' ? `advisor_id.eq.${userId}` : `founder_id.eq.${userId}`)
        .is('deleted_at', null);

      if (error) throw error;

      // Generate personalized coaching recommendations
      return generatePersonalizedCoaching(userId, role, assignments || []);
    },
    enabled: !!user && !!userId
  });
};

export const useGeneratePrediction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, assignmentId }: { sessionId?: string; assignmentId?: string }) => {
      const { data, error } = await supabase.functions.invoke('predict-session-success', {
        body: { sessionId, assignmentId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['success-prediction'] });
    }
  });
};

export const useSessionIntelligence = (assignmentId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['session-intelligence', assignmentId],
    queryFn: async () => {
      if (!assignmentId) return null;

      // Get assignment with sessions and analysis data
      const { data: assignment, error } = await supabase
        .from('advisor_founder_assignments')
        .select(`
          *,
          sessions(
            id, status, founder_rating, advisor_rating,
            duration_minutes, notes, ai_summary,
            session_analysis(*)
          )
        `)
        .eq('id', assignmentId)
        .single();

      if (error) throw error;

      // Generate session intelligence
      return generateSessionIntelligence(assignment);
    },
    enabled: !!user && !!assignmentId
  });
};

// Helper functions
function calculateSuccessPrediction(session: any): SuccessPrediction {
  const factors = [];
  let baseScore = 0.5;

  // Historical performance factor
  if (session.assignment?.avg_rating) {
    const ratingImpact = (session.assignment.avg_rating - 3) * 0.2;
    baseScore += ratingImpact;
    factors.push({
      factor: 'Historical Performance',
      impact: ratingImpact,
      description: `Average session rating: ${session.assignment.avg_rating}/5`
    });
  }

  // Session frequency factor
  if (session.assignment?.total_sessions > 0) {
    const frequencyScore = Math.min(session.assignment.total_sessions * 0.05, 0.2);
    baseScore += frequencyScore;
    factors.push({
      factor: 'Session Frequency',
      impact: frequencyScore,
      description: `${session.assignment.total_sessions} total sessions completed`
    });
  }

  // Completion rate factor
  if (session.assignment?.completed_sessions && session.assignment?.total_sessions) {
    const completionRate = session.assignment.completed_sessions / session.assignment.total_sessions;
    const completionImpact = (completionRate - 0.8) * 0.15;
    baseScore += completionImpact;
    factors.push({
      factor: 'Completion Rate',
      impact: completionImpact,
      description: `${Math.round(completionRate * 100)}% session completion rate`
    });
  }

  // Duration consistency
  if (session.duration_minutes) {
    const durationScore = session.duration_minutes >= 45 ? 0.1 : -0.05;
    baseScore += durationScore;
    factors.push({
      factor: 'Session Duration',
      impact: durationScore,
      description: `Average duration: ${session.duration_minutes} minutes`
    });
  }

  const finalScore = Math.max(0, Math.min(1, baseScore));
  
  return {
    sessionId: session.id,
    assignmentId: session.assignment_id,
    successProbability: finalScore,
    confidenceLevel: finalScore > 0.7 ? 'high' : finalScore > 0.4 ? 'medium' : 'low',
    keyFactors: factors,
    recommendations: generateSuccessRecommendations(finalScore, factors)
  };
}

function analyzeMatchOptimization(assignment: any): MatchOptimization {
  const sessions = assignment.sessions || [];
  const completedSessions = sessions.filter((s: any) => s.status === 'completed');
  
  let successRate = 0;
  if (completedSessions.length > 0) {
    const avgRating = completedSessions.reduce((sum: number, s: any) => 
      sum + ((s.founder_rating || 0) + (s.advisor_rating || 0)) / 2, 0
    ) / completedSessions.length;
    successRate = avgRating / 5;
  }

  const compatibilityScore = assignment.match_score || 0;
  const expertiseAlignment = calculateExpertiseAlignment(assignment);

  return {
    advisorId: assignment.advisor_id,
    founderId: assignment.founder_id,
    compatibilityScore: compatibilityScore / 100,
    sessionSuccessRate: successRate,
    communicationStyle: determineCommunicationStyle(sessions),
    expertiseAlignment,
    recommendedActions: generateMatchingRecommendations(successRate, compatibilityScore)
  };
}

function identifyInterventionNeeds(assignment: any): ProactiveIntervention {
  const sessions = assignment.sessions || [];
  const recentSessions = sessions
    .filter((s: any) => new Date(s.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  const riskFactors: string[] = [];
  let interventionType: 'communication' | 'matching' | 'scheduling' | 'content' = 'communication';

  // Check for low session frequency
  if (recentSessions.length < 2) {
    riskFactors.push('Low session frequency');
    riskLevel = 'medium';
    interventionType = 'scheduling';
  }

  // Check for declining ratings
  if (recentSessions.length >= 2) {
    const recentAvgRating = recentSessions.slice(0, 2).reduce((sum: number, s: any) => 
      sum + ((s.founder_rating || 0) + (s.advisor_rating || 0)) / 2, 0
    ) / 2;

    if (recentAvgRating < 3) {
      riskFactors.push('Declining session ratings');
      riskLevel = 'high';
      interventionType = 'matching';
    }
  }

  // Check for missed sessions
  const missedSessions = sessions.filter((s: any) => s.status === 'cancelled').length;
  if (missedSessions > 2) {
    riskFactors.push('High cancellation rate');
    riskLevel = riskLevel === 'high' ? 'high' : 'medium';
  }

  return {
    assignmentId: assignment.id,
    riskLevel,
    riskFactors,
    interventionType,
    suggestedActions: generateInterventionActions(riskFactors, interventionType),
    urgency: riskLevel === 'high' ? 1 : riskLevel === 'medium' ? 0.6 : 0.3,
    predictedOutcome: predictInterventionOutcome(riskLevel, interventionType)
  };
}

function generatePersonalizedCoaching(userId: string, role: 'advisor' | 'founder', assignments: any[]): PersonalizedCoaching {
  const allSessions = assignments.flatMap(a => a.sessions || []);
  const completedSessions = allSessions.filter((s: any) => s.status === 'completed');

  const strengths: string[] = [];
  const improvementAreas: string[] = [];
  const skillGaps: string[] = [];

  // Analyze performance patterns
  if (completedSessions.length > 0) {
    const avgRating = completedSessions.reduce((sum: number, s: any) => {
      const rating = role === 'advisor' ? s.advisor_rating : s.founder_rating;
      return sum + (rating || 0);
    }, 0) / completedSessions.length;

    if (avgRating >= 4) {
      strengths.push('Consistently high session ratings');
    } else if (avgRating < 3) {
      improvementAreas.push('Session effectiveness');
    }

    // Analyze session durations
    const avgDuration = completedSessions.reduce((sum: number, s: any) => 
      sum + (s.duration_minutes || 0), 0
    ) / completedSessions.length;

    if (avgDuration >= 60) {
      strengths.push('Thorough session discussions');
    } else if (avgDuration < 30) {
      improvementAreas.push('Session depth and engagement');
    }
  }

  // Role-specific analysis
  if (role === 'advisor') {
    // Advisor-specific coaching
    if (assignments.length > 5) {
      strengths.push('Experienced mentor with multiple founders');
    }
    
    skillGaps.push('Advanced questioning techniques');
    skillGaps.push('Goal-setting frameworks');
  } else {
    // Founder-specific coaching
    if (completedSessions.some((s: any) => s.notes?.includes('action'))) {
      strengths.push('Good at defining action items');
    }
    
    skillGaps.push('Strategic thinking');
    skillGaps.push('Execution planning');
  }

  return {
    userId,
    role,
    strengths,
    improvementAreas,
    customRecommendations: generateCustomRecommendations(role, strengths, improvementAreas),
    skillGaps,
    nextSteps: generateNextSteps(role, improvementAreas, skillGaps)
  };
}

// Utility functions
function generateSuccessRecommendations(score: number, factors: any[]): string[] {
  const recommendations: string[] = [];

  if (score < 0.5) {
    recommendations.push('Schedule a pre-session alignment call');
    recommendations.push('Provide structured session agenda');
  }

  if (factors.some(f => f.factor === 'Session Duration' && f.impact < 0)) {
    recommendations.push('Plan for longer, more in-depth discussions');
  }

  if (factors.some(f => f.factor === 'Completion Rate' && f.impact < 0)) {
    recommendations.push('Improve session scheduling and reminders');
  }

  return recommendations;
}

function calculateExpertiseAlignment(assignment: any): number {
  // Simplified expertise alignment calculation
  // In a real implementation, this would analyze advisor expertise vs founder needs
  return Math.random() * 0.3 + 0.7; // Mock high alignment
}

function determineCommunicationStyle(sessions: any[]): string {
  if (sessions.length === 0) return 'unknown';
  
  const avgDuration = sessions.reduce((sum: number, s: any) => 
    sum + (s.duration_minutes || 0), 0
  ) / sessions.length;

  if (avgDuration > 75) return 'detailed';
  if (avgDuration > 45) return 'balanced';
  return 'concise';
}

function generateMatchingRecommendations(successRate: number, compatibilityScore: number): string[] {
  const recommendations: string[] = [];

  if (successRate < 0.6) {
    recommendations.push('Consider reassessing advisor-founder fit');
  }

  if (compatibilityScore < 70) {
    recommendations.push('Focus on communication style alignment');
  }

  recommendations.push('Schedule regular relationship check-ins');
  return recommendations;
}

function generateInterventionActions(riskFactors: string[], type: string): string[] {
  const actions: string[] = [];

  switch (type) {
    case 'scheduling':
      actions.push('Send automated scheduling reminders');
      actions.push('Suggest optimal meeting times');
      break;
    case 'matching':
      actions.push('Conduct relationship health check');
      actions.push('Consider alternative advisor matching');
      break;
    case 'communication':
      actions.push('Facilitate communication style discussion');
      actions.push('Provide session structure templates');
      break;
    case 'content':
      actions.push('Suggest relevant resources');
      actions.push('Provide session agenda templates');
      break;
  }

  return actions;
}

function predictInterventionOutcome(riskLevel: string, type: string): string {
  const outcomes = {
    high: {
      scheduling: 'Improved session consistency within 2 weeks',
      matching: 'Better advisor-founder alignment',
      communication: 'Enhanced session effectiveness',
      content: 'More focused and productive sessions'
    },
    medium: {
      scheduling: 'Moderate improvement in session frequency',
      matching: 'Gradual improvement in relationship dynamics',
      communication: 'Better structured conversations',
      content: 'Increased session value'
    }
  };

  return outcomes[riskLevel as keyof typeof outcomes]?.[type as keyof typeof outcomes.high] || 
         'Positive impact expected';
}

function generateCustomRecommendations(role: string, strengths: string[], improvementAreas: string[]): string[] {
  const recommendations: string[] = [];

  if (role === 'advisor') {
    recommendations.push('Leverage your experience to provide specific examples');
    if (improvementAreas.includes('Session effectiveness')) {
      recommendations.push('Use more structured questioning techniques');
    }
  } else {
    recommendations.push('Come prepared with specific challenges to discuss');
    if (improvementAreas.includes('Session depth and engagement')) {
      recommendations.push('Ask more follow-up questions during sessions');
    }
  }

  return recommendations;
}

function generateNextSteps(role: string, improvementAreas: string[], skillGaps: string[]): string[] {
  const steps: string[] = [];

  if (improvementAreas.length > 0) {
    steps.push(`Focus on improving: ${improvementAreas[0]}`);
  }

  if (skillGaps.length > 0) {
    steps.push(`Develop skill: ${skillGaps[0]}`);
  }

  if (role === 'advisor') {
    steps.push('Complete advanced mentoring certification');
  } else {
    steps.push('Set specific, measurable goals for next session');
  }

  return steps;
}

function generateSessionIntelligence(assignment: any): SessionIntelligence {
  const sessions = assignment.sessions || [];
  const completedSessions = sessions.filter((s: any) => s.status === 'completed');
  
  // Analyze content from sessions
  const allTopics = completedSessions.flatMap((s: any) => 
    s.session_analysis?.[0]?.topics || []
  );
  const topicCounts = allTopics.reduce((acc: any, topic: string) => {
    acc[topic] = (acc[topic] || 0) + 1;
    return acc;
  }, {});
  
  const keyTopics = Object.entries(topicCounts)
    .sort(([,a]: any, [,b]: any) => b - a)
    .slice(0, 8)
    .map(([topic]) => topic);

  // Calculate engagement level
  const avgRating = completedSessions.reduce((sum: number, s: any) => 
    sum + ((s.founder_rating || 0) + (s.advisor_rating || 0)) / 2, 0
  ) / (completedSessions.length || 1);

  const engagementLevel = avgRating >= 4 ? 'high' : avgRating >= 3 ? 'medium' : 'low';

  // Identify knowledge gaps
  const knowledgeGaps = [
    'Strategic planning',
    'Market analysis',
    'Financial modeling',
    'Team building'
  ].filter(() => Math.random() > 0.7); // Simplified logic

  // Generate recommendations
  const nextTopics = [
    'Product-market fit validation',
    'Go-to-market strategy',
    'Funding strategy',
    'Operational scaling',
    'Team leadership'
  ].slice(0, 3);

  // Calculate success prediction
  const successPrediction = Math.max(0, Math.min(1, 
    (avgRating / 5) * 0.6 + 
    (completedSessions.length / 10) * 0.2 +
    (assignment.match_score / 100) * 0.2
  ));

  // Identify risk factors
  const riskFactors = [];
  if (avgRating < 3) riskFactors.push('Low session satisfaction');
  if (completedSessions.length < 2) riskFactors.push('Insufficient session frequency');
  if (assignment.match_score < 70) riskFactors.push('Poor advisor-founder match');

  return {
    assignmentId: assignment.id,
    contentAnalysis: {
      keyTopics,
      engagementLevel,
      knowledgeGaps,
      discussionDepth: completedSessions.length
    },
    smartRecommendations: {
      nextTopics,
      optimalFrequency: 'bi-weekly',
      resourceSuggestions: [
        'Startup metrics dashboard',
        'Customer interview templates',
        'Pitch deck framework'
      ],
      goalAlignment: [
        'Revenue growth targets',
        'User acquisition metrics',
        'Product development milestones'
      ]
    },
    predictiveInsights: {
      successPrediction,
      riskFactors,
      improvementAreas: [
        'Session preparation',
        'Follow-up consistency',
        'Goal setting clarity'
      ]
    }
  };
}
