
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { sessionId, assignmentId } = await req.json();

    if (!sessionId && !assignmentId) {
      return new Response(
        JSON.stringify({ error: 'Session ID or Assignment ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get historical data for prediction
    let query = supabaseClient
      .from('sessions')
      .select(`
        *,
        assignment:advisor_founder_assignments(
          *,
          sessions!inner(*)
        )
      `);

    if (sessionId) {
      query = query.eq('id', sessionId);
    } else {
      query = query.eq('assignment_id', assignmentId);
    }

    const { data: sessions, error } = await query;
    if (error) throw error;

    if (!sessions || sessions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No sessions found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate predictions using machine learning model (simplified)
    const predictions = sessions.map(session => generateSuccessPrediction(session));

    return new Response(
      JSON.stringify({ 
        success: true, 
        predictions 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in predict-session-success function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateSuccessPrediction(session: any) {
  // Simplified ML model for session success prediction
  const features = extractFeatures(session);
  const prediction = calculatePrediction(features);
  
  return {
    sessionId: session.id,
    assignmentId: session.assignment_id,
    successProbability: prediction.probability,
    confidenceLevel: prediction.confidence,
    keyFactors: prediction.factors,
    recommendations: generateRecommendations(prediction, features)
  };
}

function extractFeatures(session: any) {
  const assignment = session.assignment;
  const allSessions = assignment?.sessions || [];
  
  return {
    // Historical performance
    avgRating: assignment?.avg_rating || 0,
    totalSessions: assignment?.total_sessions || 0,
    completedSessions: assignment?.completed_sessions || 0,
    
    // Session characteristics
    sessionType: session.session_type,
    scheduledDuration: session.duration_minutes || 60,
    hasPreparationNotes: !!session.preparation_notes,
    
    // Relationship metrics
    relationshipDuration: calculateRelationshipDuration(assignment),
    sessionFrequency: calculateSessionFrequency(allSessions),
    lastSessionRating: getLastSessionRating(allSessions),
    
    // Engagement indicators
    hasPreviousFeedback: allSessions.some((s: any) => s.founder_feedback_text || s.advisor_feedback_text),
    consistentAttendance: calculateAttendanceRate(allSessions),
    communicationQuality: assessCommunicationQuality(allSessions)
  };
}

function calculatePrediction(features: any) {
  let probability = 0.5; // Base probability
  const factors = [];
  
  // Historical performance weight (40%)
  if (features.avgRating > 0) {
    const ratingImpact = ((features.avgRating - 3) / 2) * 0.4;
    probability += ratingImpact;
    factors.push({
      factor: 'Historical Performance',
      impact: ratingImpact,
      weight: 0.4,
      value: features.avgRating
    });
  }
  
  // Session experience weight (20%)
  const experienceImpact = Math.min(features.totalSessions * 0.02, 0.2);
  probability += experienceImpact;
  factors.push({
    factor: 'Session Experience',
    impact: experienceImpact,
    weight: 0.2,
    value: features.totalSessions
  });
  
  // Consistency weight (20%)
  const consistencyImpact = (features.consistentAttendance - 0.8) * 0.2;
  probability += consistencyImpact;
  factors.push({
    factor: 'Attendance Consistency',
    impact: consistencyImpact,
    weight: 0.2,
    value: features.consistentAttendance
  });
  
  // Engagement weight (20%)
  let engagementScore = 0;
  if (features.hasPreviousFeedback) engagementScore += 0.5;
  if (features.hasPreparationNotes) engagementScore += 0.3;
  if (features.communicationQuality > 0.7) engagementScore += 0.2;
  
  const engagementImpact = engagementScore * 0.2;
  probability += engagementImpact;
  factors.push({
    factor: 'Engagement Level',
    impact: engagementImpact,
    weight: 0.2,
    value: engagementScore
  });
  
  // Normalize probability
  probability = Math.max(0.1, Math.min(0.95, probability));
  
  // Determine confidence level
  const variance = factors.reduce((sum, f) => sum + Math.abs(f.impact), 0) / factors.length;
  let confidence: 'low' | 'medium' | 'high' = 'medium';
  
  if (variance > 0.15) confidence = 'high';
  else if (variance < 0.05) confidence = 'low';
  
  return {
    probability,
    confidence,
    factors: factors.map(f => ({
      factor: f.factor,
      impact: Math.round(f.impact * 100) / 100,
      description: generateFactorDescription(f)
    }))
  };
}

function generateRecommendations(prediction: any, features: any): string[] {
  const recommendations = [];
  
  if (prediction.probability < 0.6) {
    recommendations.push('Schedule pre-session alignment call');
    recommendations.push('Provide structured session agenda');
  }
  
  if (features.avgRating < 3.5) {
    recommendations.push('Review communication preferences');
    recommendations.push('Adjust session format or frequency');
  }
  
  if (!features.hasPreparationNotes) {
    recommendations.push('Send preparation materials before session');
  }
  
  if (features.consistentAttendance < 0.8) {
    recommendations.push('Implement session reminder system');
    recommendations.push('Discuss scheduling preferences');
  }
  
  if (features.communicationQuality < 0.7) {
    recommendations.push('Focus on active listening techniques');
    recommendations.push('Use more structured questioning');
  }
  
  return recommendations.slice(0, 5);
}

// Helper functions
function calculateRelationshipDuration(assignment: any): number {
  if (!assignment?.assigned_at) return 0;
  const assignedDate = new Date(assignment.assigned_at);
  const now = new Date();
  return Math.floor((now.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24));
}

function calculateSessionFrequency(sessions: any[]): number {
  if (sessions.length < 2) return 0;
  
  const sortedSessions = sessions
    .filter((s: any) => s.status === 'completed')
    .sort((a: any, b: any) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  
  if (sortedSessions.length < 2) return 0;
  
  let totalDays = 0;
  for (let i = 1; i < sortedSessions.length; i++) {
    const diff = new Date(sortedSessions[i].scheduled_at).getTime() - 
                 new Date(sortedSessions[i-1].scheduled_at).getTime();
    totalDays += diff / (1000 * 60 * 60 * 24);
  }
  
  return totalDays / (sortedSessions.length - 1);
}

function getLastSessionRating(sessions: any[]): number {
  const completedSessions = sessions
    .filter((s: any) => s.status === 'completed')
    .sort((a: any, b: any) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
  
  if (completedSessions.length === 0) return 0;
  
  const lastSession = completedSessions[0];
  return ((lastSession.founder_rating || 0) + (lastSession.advisor_rating || 0)) / 2;
}

function calculateAttendanceRate(sessions: any[]): number {
  if (sessions.length === 0) return 1;
  
  const totalScheduled = sessions.filter((s: any) => 
    s.status === 'completed' || s.status === 'cancelled'
  ).length;
  const completed = sessions.filter((s: any) => s.status === 'completed').length;
  
  return totalScheduled > 0 ? completed / totalScheduled : 1;
}

function assessCommunicationQuality(sessions: any[]): number {
  const completedSessions = sessions.filter((s: any) => s.status === 'completed');
  if (completedSessions.length === 0) return 0.5;
  
  let qualityScore = 0;
  let factors = 0;
  
  completedSessions.forEach((session: any) => {
    // Check for notes/feedback
    if (session.notes && session.notes.length > 50) {
      qualityScore += 0.3;
      factors++;
    }
    
    // Check session duration
    if (session.duration_minutes >= 45) {
      qualityScore += 0.2;
      factors++;
    }
    
    // Check ratings
    const avgRating = ((session.founder_rating || 0) + (session.advisor_rating || 0)) / 2;
    if (avgRating >= 4) {
      qualityScore += 0.5;
      factors++;
    }
  });
  
  return factors > 0 ? Math.min(1, qualityScore / factors) : 0.5;
}

function generateFactorDescription(factor: any): string {
  switch (factor.factor) {
    case 'Historical Performance':
      return `Average session rating: ${factor.value.toFixed(1)}/5`;
    case 'Session Experience':
      return `Total sessions completed: ${factor.value}`;
    case 'Attendance Consistency':
      return `${Math.round(factor.value * 100)}% attendance rate`;
    case 'Engagement Level':
      return `Engagement score: ${Math.round(factor.value * 100)}%`;
    default:
      return `Score: ${factor.value}`;
  }
}
