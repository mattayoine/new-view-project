
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SessionAnalysisResult {
  sessionId: string;
  keyTopics: string[];
  actionItems: string[];
  sentimentScore: number;
  engagementLevel: 'low' | 'medium' | 'high';
  knowledgeGaps: string[];
  successPrediction: number;
  recommendations: {
    nextTopics: string[];
    resourceSuggestions: string[];
    frequencyRecommendation: string;
    goalAlignmentOpportunities: string[];
  };
}

export interface SessionIntelligence {
  contentAnalysis: {
    keyTopics: string[];
    actionItems: string[];
    sentimentScore: number;
    engagementLevel: 'low' | 'medium' | 'high';
    knowledgeGaps: string[];
  };
  smartRecommendations: {
    nextTopics: string[];
    optimalFrequency: string;
    resourceRecommendations: string[];
    goalAlignmentOpportunities: string[];
  };
  predictiveInsights: {
    successPrediction: number;
    riskFactors: string[];
    improvementSuggestions: string[];
  };
}

export const useAISessionAnalysis = (sessionId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ai-session-analysis', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;

      // Get session data first
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          *,
          assignment:advisor_founder_assignments(
            id,
            advisor:users!advisor_id(id, email),
            founder:users!founder_id(id, email)
          )
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Get existing analysis if available
      const { data: existingAnalysis } = await supabase
        .from('session_analysis')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (existingAnalysis && existingAnalysis.processing_status === 'completed') {
        return transformAnalysisToResult(existingAnalysis, session);
      }

      // If no analysis exists or it's still processing, return basic data
      return generateBasicAnalysis(session);
    },
    enabled: !!user && !!sessionId
  });
};

export const useGenerateSessionAnalysis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      // Call AI analysis edge function
      const { data, error } = await supabase.functions.invoke('analyze-session', {
        body: { sessionId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['ai-session-analysis', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['session-intelligence'] });
    }
  });
};

export const useSessionIntelligence = (assignmentId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['session-intelligence', assignmentId],
    queryFn: async () => {
      if (!assignmentId) return null;

      // Get all sessions for this assignment
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          *,
          session_analysis(*)
        `)
        .eq('assignment_id', assignmentId)
        .eq('status', 'completed')
        .order('scheduled_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Aggregate intelligence across all sessions
      return aggregateSessionIntelligence(sessions || []);
    },
    enabled: !!user && !!assignmentId
  });
};

// Helper functions
function transformAnalysisToResult(analysis: any, session: any): SessionAnalysisResult {
  return {
    sessionId: session.id,
    keyTopics: analysis.topics || [],
    actionItems: analysis.action_items || [],
    sentimentScore: analysis.sentiment_score || 0,
    engagementLevel: determineEngagementLevel(analysis.sentiment_score, session.duration_minutes),
    knowledgeGaps: extractKnowledgeGaps(analysis),
    successPrediction: analysis.confidence_score || 0,
    recommendations: {
      nextTopics: analysis.next_session_suggestions ? [analysis.next_session_suggestions] : [],
      resourceSuggestions: analysis.recommendations || [],
      frequencyRecommendation: generateFrequencyRecommendation(analysis),
      goalAlignmentOpportunities: extractGoalOpportunities(analysis)
    }
  };
}

function generateBasicAnalysis(session: any): SessionAnalysisResult {
  // Generate basic analysis from existing session data
  const actionItems = extractActionItemsFromNotes(session.notes, session.ai_summary);
  const topics = extractTopicsFromContent(session.title, session.description, session.notes);
  
  return {
    sessionId: session.id,
    keyTopics: topics,
    actionItems: actionItems,
    sentimentScore: estimateSentimentFromRatings(session.founder_rating, session.advisor_rating),
    engagementLevel: determineEngagementLevel(session.founder_rating, session.duration_minutes),
    knowledgeGaps: [],
    successPrediction: calculateBasicSuccessPrediction(session),
    recommendations: {
      nextTopics: generateBasicTopicRecommendations(topics),
      resourceSuggestions: [],
      frequencyRecommendation: 'weekly',
      goalAlignmentOpportunities: []
    }
  };
}

function aggregateSessionIntelligence(sessions: any[]): SessionIntelligence {
  const analysisResults = sessions.map(session => {
    if (session.session_analysis?.length > 0) {
      return transformAnalysisToResult(session.session_analysis[0], session);
    }
    return generateBasicAnalysis(session);
  });

  // Aggregate data across all sessions
  const allTopics = analysisResults.flatMap(r => r.keyTopics);
  const allActionItems = analysisResults.flatMap(r => r.actionItems);
  const avgSentiment = analysisResults.reduce((sum, r) => sum + r.sentimentScore, 0) / analysisResults.length;
  const avgSuccess = analysisResults.reduce((sum, r) => sum + r.successPrediction, 0) / analysisResults.length;

  return {
    contentAnalysis: {
      keyTopics: [...new Set(allTopics)].slice(0, 10),
      actionItems: allActionItems.slice(0, 15),
      sentimentScore: avgSentiment,
      engagementLevel: avgSentiment > 0.7 ? 'high' : avgSentiment > 0.4 ? 'medium' : 'low',
      knowledgeGaps: identifyKnowledgeGaps(analysisResults)
    },
    smartRecommendations: {
      nextTopics: generateSmartTopicRecommendations(allTopics),
      optimalFrequency: calculateOptimalFrequency(sessions),
      resourceRecommendations: generateResourceRecommendations(allTopics),
      goalAlignmentOpportunities: identifyGoalAlignmentOpportunities(analysisResults)
    },
    predictiveInsights: {
      successPrediction: avgSuccess,
      riskFactors: identifyRiskFactors(analysisResults),
      improvementSuggestions: generateImprovementSuggestions(analysisResults)
    }
  };
}

// Utility functions
function determineEngagementLevel(sentiment: number, duration?: number): 'low' | 'medium' | 'high' {
  const sentimentScore = sentiment || 0;
  const durationScore = duration ? Math.min(duration / 60, 1) : 0.5;
  const combined = (sentimentScore + durationScore) / 2;
  
  if (combined > 0.7) return 'high';
  if (combined > 0.4) return 'medium';
  return 'low';
}

function extractActionItemsFromNotes(notes?: string, aiSummary?: string): string[] {
  const content = `${notes || ''} ${aiSummary || ''}`;
  const actionKeywords = ['action', 'todo', 'follow up', 'next steps', 'will do', 'commit'];
  
  return content.split('\n')
    .filter(line => actionKeywords.some(keyword => 
      line.toLowerCase().includes(keyword)
    ))
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .slice(0, 10);
}

function extractTopicsFromContent(title?: string, description?: string, notes?: string): string[] {
  const content = `${title || ''} ${description || ''} ${notes || ''}`;
  const topics = new Set<string>();
  
  // Simple topic extraction based on common business terms
  const businessTopics = [
    'strategy', 'marketing', 'product', 'fundraising', 'operations', 'hiring',
    'sales', 'growth', 'metrics', 'competition', 'partnerships', 'technology'
  ];
  
  businessTopics.forEach(topic => {
    if (content.toLowerCase().includes(topic)) {
      topics.add(topic);
    }
  });
  
  return Array.from(topics).slice(0, 8);
}

function estimateSentimentFromRatings(founderRating?: number, advisorRating?: number): number {
  const avgRating = ((founderRating || 3) + (advisorRating || 3)) / 2;
  return avgRating / 5; // Normalize to 0-1 scale
}

function calculateBasicSuccessPrediction(session: any): number {
  let score = 0.5; // Base score
  
  if (session.founder_rating >= 4) score += 0.2;
  if (session.advisor_rating >= 4) score += 0.2;
  if (session.duration_minutes >= 45) score += 0.1;
  if (session.notes && session.notes.length > 100) score += 0.1;
  
  return Math.min(score, 1);
}

function generateBasicTopicRecommendations(currentTopics: string[]): string[] {
  const recommendations = [
    'Goal setting and tracking',
    'Market analysis',
    'Competitive positioning',
    'Customer development',
    'Team building'
  ];
  
  return recommendations.filter(rec => 
    !currentTopics.some(topic => rec.toLowerCase().includes(topic.toLowerCase()))
  ).slice(0, 3);
}

function identifyKnowledgeGaps(results: SessionAnalysisResult[]): string[] {
  // Identify areas that haven't been covered much
  const allTopics = results.flatMap(r => r.keyTopics);
  const topicCounts = new Map<string, number>();
  
  allTopics.forEach(topic => {
    topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
  });
  
  const commonAreas = ['strategy', 'marketing', 'product', 'fundraising', 'operations'];
  return commonAreas.filter(area => (topicCounts.get(area) || 0) < 2);
}

function generateSmartTopicRecommendations(allTopics: string[]): string[] {
  const topicFrequency = new Map<string, number>();
  allTopics.forEach(topic => {
    topicFrequency.set(topic, (topicFrequency.get(topic) || 0) + 1);
  });
  
  // Recommend less frequent but important topics
  const recommendations = [
    'Strategic planning',
    'Customer acquisition',
    'Product-market fit',
    'Scaling operations',
    'Leadership development'
  ];
  
  return recommendations.slice(0, 3);
}

function calculateOptimalFrequency(sessions: any[]): string {
  if (sessions.length < 2) return 'weekly';
  
  // Calculate average time between sessions
  const sortedSessions = sessions.sort((a, b) => 
    new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  );
  
  let totalDays = 0;
  for (let i = 1; i < sortedSessions.length; i++) {
    const diff = new Date(sortedSessions[i].scheduled_at).getTime() - 
                 new Date(sortedSessions[i-1].scheduled_at).getTime();
    totalDays += diff / (1000 * 60 * 60 * 24);
  }
  
  const avgDays = totalDays / (sortedSessions.length - 1);
  
  if (avgDays <= 10) return 'weekly';
  if (avgDays <= 20) return 'bi-weekly';
  return 'monthly';
}

function generateResourceRecommendations(topics: string[]): string[] {
  const resourceMap: Record<string, string[]> = {
    'strategy': ['Business Model Canvas', 'Strategic Planning Framework'],
    'marketing': ['Growth Hacking Guide', 'Content Marketing Playbook'],
    'product': ['Product Development Lifecycle', 'User Research Methods'],
    'fundraising': ['Investor Pitch Deck Template', 'Due Diligence Checklist']
  };
  
  const recommendations = new Set<string>();
  topics.forEach(topic => {
    resourceMap[topic]?.forEach(resource => recommendations.add(resource));
  });
  
  return Array.from(recommendations).slice(0, 5);
}

function identifyGoalAlignmentOpportunities(results: SessionAnalysisResult[]): string[] {
  return [
    'Align quarterly goals with session outcomes',
    'Create milestone tracking system',
    'Establish success metrics for each session'
  ];
}

function identifyRiskFactors(results: SessionAnalysisResult[]): string[] {
  const risks: string[] = [];
  
  const avgSentiment = results.reduce((sum, r) => sum + r.sentimentScore, 0) / results.length;
  if (avgSentiment < 0.5) risks.push('Low session satisfaction');
  
  const recentResults = results.slice(0, 3);
  if (recentResults.every(r => r.actionItems.length === 0)) {
    risks.push('Lack of actionable outcomes');
  }
  
  if (results.length > 0 && results[0].engagementLevel === 'low') {
    risks.push('Declining engagement');
  }
  
  return risks;
}

function generateImprovementSuggestions(results: SessionAnalysisResult[]): string[] {
  const suggestions: string[] = [];
  
  const avgSuccess = results.reduce((sum, r) => sum + r.successPrediction, 0) / results.length;
  if (avgSuccess < 0.6) {
    suggestions.push('Focus on more structured session agendas');
  }
  
  const actionItemsCount = results.reduce((sum, r) => sum + r.actionItems.length, 0);
  if (actionItemsCount / results.length < 2) {
    suggestions.push('Ensure each session ends with clear action items');
  }
  
  suggestions.push('Implement regular progress check-ins');
  
  return suggestions.slice(0, 3);
}

function extractKnowledgeGaps(analysis: any): string[] {
  // Extract knowledge gaps from AI analysis
  if (analysis.discussion_themes) {
    const themes = typeof analysis.discussion_themes === 'string' ? 
      JSON.parse(analysis.discussion_themes) : analysis.discussion_themes;
    return themes.gaps || [];
  }
  return [];
}

function generateFrequencyRecommendation(analysis: any): string {
  if (analysis.confidence_score > 0.8) return 'bi-weekly';
  if (analysis.confidence_score > 0.6) return 'weekly';
  return 'twice-weekly';
}

function extractGoalOpportunities(analysis: any): string[] {
  if (analysis.recommendations) {
    return analysis.recommendations.filter((rec: string) => 
      rec.toLowerCase().includes('goal')
    );
  }
  return [];
}
