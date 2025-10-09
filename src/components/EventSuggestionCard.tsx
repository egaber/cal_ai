import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EventSuggestion } from '@/types/task';
import { Check, X, Clock, Brain, TrendingUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventSuggestionCardProps {
  suggestion: EventSuggestion;
  onAccept: (suggestion: EventSuggestion) => void;
  onReject: (suggestionId: string) => void;
  onTimeAdjust?: (suggestionId: string, newStartTime: string, newEndTime: string) => void;
  style?: React.CSSProperties;
  className?: string;
}

export function EventSuggestionCard({
  suggestion,
  onAccept,
  onReject,
  onTimeAdjust,
  style,
  className,
}: EventSuggestionCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const getDuration = () => {
    const start = new Date(suggestion.suggestedStartTime);
    const end = new Date(suggestion.suggestedEndTime);
    const minutes = (end.getTime() - start.getTime()) / (1000 * 60);
    if (minutes < 60) return `${minutes}ד`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}:${mins.toString().padStart(2, '0')}ש` : `${hours}ש`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'גבוהה';
    if (confidence >= 0.6) return 'בינונית';
    return 'נמוכה';
  };

  return (
    <Card
      className={cn(
        'border-2 border-dashed border-blue-400 bg-blue-50/90 backdrop-blur transition-all',
        'hover:shadow-lg hover:border-blue-500 cursor-pointer',
        isHovered && 'scale-105',
        className
      )}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {suggestion.taskEmoji && (
                <span className="text-xl flex-shrink-0">{suggestion.taskEmoji}</span>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-gray-900 truncate" dir="rtl">
                  {suggestion.taskTitle}
                </h4>
                <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(suggestion.suggestedStartTime)}</span>
                  <span>•</span>
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatTime(suggestion.suggestedStartTime)} - {formatTime(suggestion.suggestedEndTime)}
                  </span>
                </div>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={cn('text-xs flex-shrink-0', getConfidenceColor(suggestion.confidence))}
            >
              <TrendingUp className="h-3 w-3 ml-1" />
              {getConfidenceLabel(suggestion.confidence)}
            </Badge>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Clock className="h-3 w-3" />
            <span>משך: {getDuration()}</span>
          </div>

          {/* AI Reasoning */}
          {suggestion.reasoning && (
            <div className="bg-white/80 rounded-lg p-2 border border-blue-200">
              <div className="flex items-start gap-2">
                <Brain className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-700" dir="rtl">
                  {suggestion.reasoning}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => onAccept(suggestion)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white h-8"
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              אשר
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(suggestion.id)}
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 h-8"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              דחה
            </Button>
          </div>

          {/* Suggestion Badge */}
          <div className="flex items-center justify-center">
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
              💡 הצעת AI
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
