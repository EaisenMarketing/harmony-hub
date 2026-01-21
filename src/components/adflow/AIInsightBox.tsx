import { Sparkles, ArrowRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIInsight {
  id: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  actionLabel?: string;
}

interface AIInsightBoxProps {
  insights: AIInsight[];
  onApply?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

export function AIInsightBox({ insights, onApply, onViewDetails }: AIInsightBoxProps) {
  if (insights.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 rounded-2xl p-6 border border-indigo-200/50 dark:border-indigo-800/50">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-semibold text-foreground">AI Recommendations</h3>
      </div>

      <div className="space-y-4">
        {insights.map((insight) => (
          <div 
            key={insight.id}
            className="bg-white/80 dark:bg-background/50 rounded-xl p-4 border border-border/30"
          >
            <p className="text-foreground mb-3 leading-relaxed">
              {insight.message}
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                onClick={() => onApply?.(insight.id)}
              >
                {insight.actionLabel || 'Apply Optimization'}
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onViewDetails?.(insight.id)}
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                View Details
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
