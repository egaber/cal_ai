import { useState } from 'react';
import { OpenQuestion } from '@/types/planningChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageCircle, ChevronRight } from 'lucide-react';

interface QuestionPromptProps {
  question: OpenQuestion;
  onAnswer: (questionId: string, answer: string) => void;
  onSkip?: (questionId: string) => void;
}

/**
 * QuestionPrompt - מציג שאלה עם אופציות תשובה
 */
export const QuestionPrompt = ({ question, onAnswer, onSkip }: QuestionPromptProps) => {
  const [customAnswer, setCustomAnswer] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleQuickAnswer = (answer: string) => {
    onAnswer(question.id, answer);
  };

  const handleCustomSubmit = () => {
    if (customAnswer.trim()) {
      onAnswer(question.id, customAnswer.trim());
      setCustomAnswer('');
    }
  };

  const getPriorityColor = () => {
    switch (question.priority) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  const getCategoryIcon = () => {
    switch (question.category) {
      case 'framework': return '🏫';
      case 'transportation': return '🚗';
      case 'coordination': return '👨‍👩‍👧‍👦';
      case 'preference': return '⭐';
      default: return '💬';
    }
  };

  return (
    <Card className={`p-4 border-2 ${getPriorityColor()} transition-all duration-200`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="text-2xl flex-shrink-0">
          {getCategoryIcon()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-gray-500 uppercase">
              {question.category === 'framework' && 'מסגרת'}
              {question.category === 'transportation' && 'תחבורה'}
              {question.category === 'coordination' && 'תיאום'}
              {question.category === 'preference' && 'העדפה'}
            </span>
          </div>
          <p className="text-lg font-medium text-gray-900 leading-tight">
            {question.question}
          </p>
        </div>
      </div>

      {/* Quick Answer Buttons */}
      {question.suggestedAnswers && question.suggestedAnswers.length > 0 && !showCustomInput && (
        <div className="space-y-2 mb-3">
          <p className="text-sm text-gray-600 mb-2">תשובות מהירות:</p>
          <div className="flex flex-wrap gap-2">
            {question.suggestedAnswers.map((answer, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAnswer(answer)}
                className="flex-1 min-w-[120px] text-right justify-between hover:bg-primary hover:text-white transition-colors"
              >
                <span>{answer}</span>
                <ChevronRight className="h-4 w-4 mr-1" />
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Custom Answer Input */}
      {showCustomInput ? (
        <div className="space-y-2">
          <Input
            value={customAnswer}
            onChange={(e) => setCustomAnswer(e.target.value)}
            placeholder="הקלד תשובה..."
            className="text-right"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCustomSubmit();
              }
            }}
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              onClick={handleCustomSubmit}
              disabled={!customAnswer.trim()}
              className="flex-1"
            >
              שלח
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowCustomInput(false);
                setCustomAnswer('');
              }}
              className="flex-1"
            >
              ביטול
            </Button>
          </div>
        </div>
      ) : (
        /* Action Buttons */
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCustomInput(true)}
            className="flex-1"
          >
            תשובה אחרת
          </Button>
          {onSkip && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSkip(question.id)}
              className="text-gray-500"
            >
              דלג
            </Button>
          )}
        </div>
      )}

      {/* Priority Indicator */}
      {question.priority === 'critical' && (
        <div className="mt-2 text-xs text-red-600 font-medium flex items-center gap-1">
          <span className="inline-block w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
          שאלה קריטית
        </div>
      )}
    </Card>
  );
};
