import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useEvents } from '@/contexts/EventContext';
import { PlanningChatInterface } from '@/components/PlanningChatInterface';
import { planningChatService } from '@/services/planningChatService';
import { deepRoutineAnalysisService } from '@/services/deepRoutineAnalysis';
import type { PlanningChatMessage, ChatContext } from '@/types/planningChat';
import type { RoutineInsights } from '@/types/routineInsights';
import { Loader2 } from 'lucide-react';

/**
 * MobilePlanningChat - Real AI Planning Chat
 * משתמש ב-AI אמיתי עם כל הנתונים מהאפליקציה
 */
export default function MobilePlanningChat() {
  const { user } = useAuth();
  const { familyMembers, family } = useFamily();
  const { events } = useEvents();
  
  const [messages, setMessages] = useState<PlanningChatMessage[]>([]);
  const [context, setContext] = useState<ChatContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize session when component mounts
  useEffect(() => {
    initializeSession();
  }, [user, family, events, familyMembers]);

  const initializeSession = async () => {
    if (!user || !family || events.length === 0) {
      setIsInitializing(false);
      return;
    }

    try {
      setIsInitializing(true);

      // 1. Analyze calendar data
      console.log('📊 Analyzing calendar data...');
      
      // Get routine insights from events
      const result = await deepRoutineAnalysisService.analyzeDeepRoutines(
        user.uid,
        family.id,
        events,
        familyMembers
      );

      if (!result.success || !result.insights) {
        throw new Error(result.error || 'Failed to analyze routines');
      }

      const insights = result.insights;

      console.log('✅ Data analyzed:', {
        events: events.length,
        frameworks: insights.frameworks.length,
        memberSchedules: insights.memberSchedules.length
      });

      // 2. Initialize planning session with AI
      const membersWithDisplay = familyMembers.map(m => ({
        id: m.id,
        displayName: m.name,
        role: m.role
      }));
      
      const { prompt, context: sessionContext } = await planningChatService.initializePlanningSession(
        insights,
        membersWithDisplay
      );

      // 3. Set initial context
      setContext(sessionContext);

      // 4. Get initial AI message WITH THE FULL PROMPT
      const response = await planningChatService.sendMessage(
        sessionContext.sessionId,
        prompt,  // ✅ שולח את הפרומפט המלא עם כל הנתונים!
        sessionContext
      );

      setMessages([response.message]);
      setContext(response.context);
    } catch (error) {
      console.error('❌ Failed to initialize session:', error);
      
      // Add error message
      const errorMessage: PlanningChatMessage = {
        id: 'error',
        role: 'ai',
        content: 'מצטער, הייתה בעיה באתחול המערכת. אנא נסה שוב מאוחר יותר.',
        timestamp: new Date().toISOString()
      };
      setMessages([errorMessage]);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!context || !user || !family) return;

    // Add user message
    const userMessage: PlanningChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send to AI and get response
      const response = await planningChatService.sendMessage(
        context.sessionId,
        message,
        context
      );

      // Add AI response
      setMessages(prev => [...prev, response.message]);
      
      // Update context
      setContext(response.context);
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      
      // Add error message
      const errorMessage: PlanningChatMessage = {
        id: `error_${Date.now()}`,
        role: 'ai',
        content: 'מצטער, הייתה בעיה בשליחת ההודעה. אנא נסה שוב.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerQuestion = async (questionId: string, answer: string) => {
    if (!context) return;

    // Update context with answer
    const updatedContext = {
      ...context,
      answeredQuestions: new Map(context.answeredQuestions).set(questionId, answer)
    };
    setContext(updatedContext);

    // Send answer as message
    await handleSendMessage(answer);
  };

  const handleApproveAnchor = async (anchorId: string, modifications?: Partial<any>) => {
    if (!context || !user || !family) return;

    try {
      setIsLoading(true);

      // Find the proposal
      const proposal = context.proposals.find(p => p.id === anchorId);
      if (!proposal) return;

      // Create the anchor event
      const event = await planningChatService.approveAnchor(
        {
          anchor: proposal,
          modifications
        },
        user.uid,
        family.id
      );

      // Update context
      const updatedContext = {
        ...context,
        createdEvents: [...context.createdEvents, event]
      };
      setContext(updatedContext);

      // Add confirmation message
      const confirmationMessage: PlanningChatMessage = {
        id: `conf_${Date.now()}`,
        role: 'ai',
        content: `✅ מעולה! העוגן "${proposal.title}" נוסף ליומן. האם יש עוד דבר שתרצה לתכנן?`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, confirmationMessage]);
    } catch (error) {
      console.error('❌ Failed to approve anchor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectAnchor = async (anchorId: string) => {
    if (!context) return;

    // Remove proposal from context
    const updatedContext = {
      ...context,
      proposals: context.proposals.filter(p => p.id !== anchorId)
    };
    setContext(updatedContext);

    // Add message
    const message: PlanningChatMessage = {
      id: `reject_${Date.now()}`,
      role: 'ai',
      content: 'בסדר, נדלג על זה. יש עוד משהו שתרצה לתכנן?',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, message]);
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">מאתחל מערכת תכנון חכמה...</p>
          <p className="text-sm text-gray-500 mt-2">מנתח אירועים, משימות וזיכרונות</p>
        </div>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center p-6">
          <p className="text-gray-600 mb-4">לא הצלחנו לאתחל את המערכת</p>
          <button
            onClick={initializeSession}
            className="bg-primary text-white px-6 py-2 rounded-lg"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <PlanningChatInterface
        messages={messages}
        context={context}
        onSendMessage={handleSendMessage}
        onAnswerQuestion={handleAnswerQuestion}
        onApproveAnchor={handleApproveAnchor}
        onRejectAnchor={handleRejectAnchor}
        isLoading={isLoading}
      />
    </div>
  );
}
