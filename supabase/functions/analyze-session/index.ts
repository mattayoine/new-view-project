
import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Session ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get session data
    const { data: session, error: sessionError } = await supabaseClient
      .from('sessions')
      .select(`
        *,
        assignment:advisor_founder_assignments(
          *,
          advisor:users!advisor_id(*),
          founder:users!founder_id(*)
        )
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      throw sessionError;
    }

    // Perform AI analysis
    const analysisResult = await performAIAnalysis(session);

    // Store analysis result
    const { error: insertError } = await supabaseClient
      .from('session_analysis')
      .upsert({
        session_id: sessionId,
        processing_status: 'completed',
        ai_model: 'gpt-4o-mini',
        key_insights: analysisResult.keyInsights,
        topics: analysisResult.topics,
        action_items: analysisResult.actionItems,
        sentiment_score: analysisResult.sentimentScore,
        confidence_score: analysisResult.confidenceScore,
        recommendations: analysisResult.recommendations,
        next_session_suggestions: analysisResult.nextSessionSuggestions,
        discussion_themes: analysisResult.discussionThemes,
        processing_duration_ms: Date.now() - Date.now() // Mock processing time
      });

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis: analysisResult 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-session function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function performAIAnalysis(session: any) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIApiKey) {
    // Return mock analysis if no OpenAI key
    return generateMockAnalysis(session);
  }

  const sessionContent = [
    session.title,
    session.description,
    session.notes,
    session.ai_summary,
    session.outcome_summary
  ].filter(Boolean).join('\n');

  const prompt = `
    Analyze this mentoring session content and provide insights:
    
    Session Content:
    ${sessionContent}
    
    Session Details:
    - Duration: ${session.duration_minutes} minutes
    - Founder Rating: ${session.founder_rating}/5
    - Advisor Rating: ${session.advisor_rating}/5
    - Session Type: ${session.session_type}
    
    Please provide:
    1. Key topics discussed (max 8)
    2. Action items identified (max 10)
    3. Sentiment score (0-1)
    4. Key insights (2-3 sentences)
    5. Recommendations for improvement (max 5)
    6. Suggested topics for next session (max 3)
    7. Discussion themes and any knowledge gaps
    
    Return as JSON with keys: topics, actionItems, sentimentScore, keyInsights, recommendations, nextSessionSuggestions, discussionThemes
  `;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an AI assistant specialized in analyzing mentoring sessions.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    
    // Parse JSON response
    const analysis = JSON.parse(analysisText);
    
    return {
      ...analysis,
      confidenceScore: calculateConfidenceScore(session, analysis)
    };
  } catch (error) {
    console.error('OpenAI analysis failed, using mock:', error);
    return generateMockAnalysis(session);
  }
}

function generateMockAnalysis(session: any) {
  const topics = extractTopicsFromSession(session);
  const actionItems = extractActionItemsFromSession(session);
  const sentimentScore = calculateSentimentFromRatings(session);

  return {
    topics,
    actionItems,
    sentimentScore,
    keyInsights: generateMockInsights(session),
    recommendations: generateMockRecommendations(session),
    nextSessionSuggestions: generateMockNextTopics(topics),
    discussionThemes: {
      primary: topics.slice(0, 3),
      secondary: topics.slice(3, 6),
      gaps: identifyKnowledgeGaps(topics)
    },
    confidenceScore: calculateConfidenceScore(session, { topics, actionItems })
  };
}

function extractTopicsFromSession(session: any): string[] {
  const content = [session.title, session.description, session.notes].join(' ').toLowerCase();
  const businessTopics = [
    'strategy', 'marketing', 'product', 'fundraising', 'operations', 
    'hiring', 'sales', 'growth', 'metrics', 'competition'
  ];
  
  return businessTopics.filter(topic => content.includes(topic));
}

function extractActionItemsFromSession(session: any): string[] {
  const content = [session.notes, session.ai_summary, session.outcome_summary].join(' ');
  const actionKeywords = ['action', 'todo', 'follow up', 'next steps', 'will do'];
  
  return content.split('\n')
    .filter(line => actionKeywords.some(keyword => line.toLowerCase().includes(keyword)))
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .slice(0, 8);
}

function calculateSentimentFromRatings(session: any): number {
  const avgRating = ((session.founder_rating || 3) + (session.advisor_rating || 3)) / 2;
  return Math.max(0, Math.min(1, (avgRating - 1) / 4));
}

function generateMockInsights(session: any): string {
  const rating = ((session.founder_rating || 3) + (session.advisor_rating || 3)) / 2;
  if (rating >= 4) {
    return "Session showed strong engagement and productive discussion. Clear action items were established.";
  } else if (rating >= 3) {
    return "Session had moderate success with some valuable insights shared. Could benefit from more structure.";
  } else {
    return "Session faced some challenges. Consider reviewing communication style and session preparation.";
  }
}

function generateMockRecommendations(session: any): string[] {
  const recommendations = [];
  
  if (!session.notes || session.notes.length < 50) {
    recommendations.push("Encourage more detailed note-taking during sessions");
  }
  
  if (session.duration_minutes < 45) {
    recommendations.push("Consider longer session duration for deeper discussions");
  }
  
  recommendations.push("Follow up on action items before next session");
  recommendations.push("Use structured agenda for better session flow");
  
  return recommendations.slice(0, 5);
}

function generateMockNextTopics(currentTopics: string[]): string {
  const suggestions = [
    "Goal setting and milestone tracking",
    "Market analysis and competitive positioning", 
    "Team building and hiring strategies",
    "Customer development and feedback",
    "Financial planning and metrics"
  ];
  
  const available = suggestions.filter(suggestion => 
    !currentTopics.some(topic => suggestion.toLowerCase().includes(topic))
  );
  
  return available.slice(0, 3).join(', ');
}

function identifyKnowledgeGaps(topics: string[]): string[] {
  const allAreas = ['strategy', 'marketing', 'product', 'fundraising', 'operations', 'leadership'];
  return allAreas.filter(area => !topics.includes(area));
}

function calculateConfidenceScore(session: any, analysis: any): number {
  let score = 0.5;
  
  if (session.notes && session.notes.length > 100) score += 0.2;
  if (session.duration_minutes > 45) score += 0.1;
  if (analysis.topics && analysis.topics.length > 3) score += 0.1;
  if (analysis.actionItems && analysis.actionItems.length > 2) score += 0.1;
  
  return Math.min(1, score);
}
