
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Target,
  BarChart3,
  Zap
} from 'lucide-react';
import { useSessionIntelligence, useProactiveInterventions, usePersonalizedCoaching } from '@/hooks/usePredictiveSessionManagement';
import { useAISessionAnalysis } from '@/hooks/useAISessionAnalysis';
import { useFounderData } from '@/hooks/useFounderData';

const AISessionInsights = () => {
  const { data: founderData } = useFounderData();
  const activeAssignment = founderData?.assignments?.[0];
  
  const { data: intelligence } = useSessionIntelligence(activeAssignment?.id);
  const { data: interventions } = useProactiveInterventions();
  const { data: coaching } = usePersonalizedCoaching(
    founderData?.founder?.id || '', 
    'founder'
  );

  if (!intelligence && !interventions && !coaching) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Brain className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">AI Insights Loading</h3>
          <p className="text-gray-600">
            Analyzing your session data to provide personalized insights...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Intelligence Overview */}
      {intelligence && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Session Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Content Analysis */}
            <div>
              <h4 className="font-medium mb-2">Content Analysis</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Key Topics Discussed</div>
                  <div className="flex flex-wrap gap-1">
                    {intelligence.contentAnalysis.keyTopics.slice(0, 6).map((topic, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Engagement Level</div>
                  <Badge 
                    className={
                      intelligence.contentAnalysis.engagementLevel === 'high' 
                        ? 'bg-green-100 text-green-800'
                        : intelligence.contentAnalysis.engagementLevel === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }
                  >
                    {intelligence.contentAnalysis.engagementLevel.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Smart Recommendations */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Smart Recommendations
              </h4>
              <div className="space-y-2">
                {intelligence.smartRecommendations.nextTopics.slice(0, 3).map((topic, index) => (
                  <div key={index} className="text-sm bg-blue-50 p-2 rounded">
                    <strong>Next Topic:</strong> {topic}
                  </div>
                ))}
                <div className="text-sm text-gray-600">
                  <strong>Optimal Frequency:</strong> {intelligence.smartRecommendations.optimalFrequency}
                </div>
              </div>
            </div>

            {/* Predictive Insights */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Success Prediction
              </h4>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.round(intelligence.predictiveInsights.successPrediction * 100)}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium">
                  {Math.round(intelligence.predictiveInsights.successPrediction * 100)}%
                </span>
              </div>
              {intelligence.predictiveInsights.riskFactors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {intelligence.predictiveInsights.riskFactors.map((risk, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 p-2 rounded">
                      <AlertTriangle className="w-4 h-4" />
                      {risk}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Proactive Interventions */}
      {interventions && interventions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Proactive Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {interventions.slice(0, 2).map((intervention, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge 
                      className={
                        intervention.riskLevel === 'high' 
                          ? 'bg-red-100 text-red-800'
                          : intervention.riskLevel === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }
                    >
                      {intervention.riskLevel.toUpperCase()} PRIORITY
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {intervention.interventionType}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <strong className="text-sm">Risk Factors:</strong>
                      <ul className="text-sm text-gray-600 mt-1">
                        {intervention.riskFactors.map((factor, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong className="text-sm">Suggested Actions:</strong>
                      <ul className="text-sm text-gray-600 mt-1">
                        {intervention.suggestedActions.slice(0, 2).map((action, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-sm text-green-700 bg-green-50 p-2 rounded mt-2">
                      <strong>Expected Outcome:</strong> {intervention.predictedOutcome}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personalized Coaching */}
      {coaching && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Personalized Coaching
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Strengths */}
            {coaching.strengths.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-green-700">Your Strengths</h4>
                <div className="space-y-1">
                  {coaching.strengths.map((strength, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm bg-green-50 p-2 rounded">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      {strength}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improvement Areas */}
            {coaching.improvementAreas.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-orange-700">Growth Opportunities</h4>
                <div className="space-y-1">
                  {coaching.improvementAreas.map((area, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm bg-orange-50 p-2 rounded">
                      <BarChart3 className="w-4 h-4 text-orange-600" />
                      {area}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Recommendations */}
            <div>
              <h4 className="font-medium mb-2">Personalized Recommendations</h4>
              <div className="space-y-2">
                {coaching.customRecommendations.map((rec, index) => (
                  <div key={index} className="text-sm bg-blue-50 p-2 rounded">
                    {rec}
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div>
              <h4 className="font-medium mb-2">Next Steps</h4>
              <div className="space-y-2">
                {coaching.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                      {index + 1}
                    </div>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AISessionInsights;
