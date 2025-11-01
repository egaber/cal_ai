import { useState, useRef, useEffect } from 'react';
import { PlanningChatMessage, OpenQuestion, ProposedAnchor, ChatContext } from '@/types/planningChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { QuestionPrompt } from './QuestionPrompt';
import { AnchorProposalCard } from './AnchorProposalCard';
import { Bot, User, Send, Loader2, CheckCircle2 } from 'lucide-react';

interface PlanningChatInterfaceProps {
  messages: PlanningChatMessage[];
  context: ChatContext;
  onSendMessage: (message: string) => void;
  onAnswerQuestion: (questionId: string, answer: string) => void;
  onApproveAnchor: (anchorId: string, modifications?: any) => void;
  onRejectAnchor: (anchorId: string) => void;
  isLoading?: boolean;
}

/**
 * PlanningChatInterface - מסך הצ'אט המלא לתכנון עם AI
 */
export const PlanningChatInterface = ({
  messages,
  context,
  onSendMessage,
  onAnswerQuestion,
  onApproveAnchor,
  onRejectAnchor,
  isLoading = false
}: PlanningChatInterfaceProps) => {
  const [inputValue, setInputValue] = useState('');
  const [scrollAreaElement, setScrollAreaElement] = useState<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getGoalText = () => {
    switch (context.currentGoal) {
      case 'identify_frameworks': return 'זיהוי מסגרות';
      case 'gather_details': return 'איסוף פרטים';
      case 'propose_anchors': return 'הצעת עוגנים';
      case 'finalize': return 'סיכום';
      default: return 'תכנון';
    }
  };

  const renderMessage = (message: PlanningChatMessage) => {
    const isAI = message.role === 'ai';

    return (
      <div
        key={message.id}
        className={`flex gap-3 mb-4 ${isAI ? 'justify-start' : 'justify-end'}`}
      >
        {isAI && (
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
          </div>
        )}

        <div className={`flex-1 max-w-[80%] ${!isAI && 'flex justify-end'}`}>
          <div
            className={`rounded-2xl px-4 py-3 ${
              isAI
                ? 'bg-white border border-gray-200 shadow-sm'
                : 'bg-primary text-white'
            }`}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
            <span className="text-xs opacity-60 mt-1 block">
              {new Date(message.timestamp).toLocaleTimeString('he-IL', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>

          {/* Render question if present */}
          {message.metadata?.question && (
            <div className="mt-3">
              <QuestionPrompt
                question={message.metadata.question}
                onAnswer={onAnswerQuestion}
              />
            </div>
          )}

          {/* Render anchor proposal if present */}
          {message.metadata?.proposal && (
            <div className="mt-3">
              <AnchorProposalCard
                anchor={message.metadata.proposal}
                onApprove={onApproveAnchor}
                onReject={onRejectAnchor}
              />
            </div>
          )}
        </div>

        {!isAI && (
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="flex-none bg-white border-b shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">תכנון חכם עם AI</h2>
            <p className="text-sm text-gray-600">שלב: {getGoalText()}</p>
          </div>
          <div className="text-left">
            <div className="text-xs text-gray-500">התקדמות</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="font-medium">{context.answeredQuestions.size}</span>
                <span className="text-gray-500">שאלות</span>
              </div>
              <div className="w-px h-4 bg-gray-300" />
              <div className="flex items-center gap-1 text-sm">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                <span className="font-medium">{context.createdEvents.length}</span>
                <span className="text-gray-500">עוגנים</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Bot className="h-16 w-16 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                בוא נתכנן את השבוע שלך!
              </h3>
              <p className="text-gray-600 max-w-md">
                אני אעזור לך לזהות מסגרות קבועות, לתאם נסיעות, ולהקים עוגנים חוזרים
                שיהפכו את ניהול היומן לפשוט ונוח.
              </p>
            </div>
          ) : (
            <>
              {messages.map(renderMessage)}
              {isLoading && (
                <div className="flex gap-3 mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <Bot className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 max-w-[80%]">
                    <div className="rounded-2xl px-4 py-3 bg-white border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-gray-600">מחשב תשובה...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="flex-none bg-white border-t shadow-lg p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="הקלד הודעה..."
              className="flex-1 text-right"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              size="lg"
              className="px-6"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Send className="h-5 w-5 ml-2" />
                  שלח
                </>
              )}
            </Button>
          </div>

          {/* Quick Actions */}
          {messages.length > 0 && !isLoading && (
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSendMessage('המשך')}
              >
                המשך
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSendMessage('ספר לי עוד')}
              >
                ספר לי עוד
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSendMessage('סיימנו')}
              >
                סיימנו
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
