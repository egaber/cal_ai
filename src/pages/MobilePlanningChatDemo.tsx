import { useState } from 'react';
import { PlanningChatInterface } from '@/components/PlanningChatInterface';
import { PlanningChatMessage, ChatContext, OpenQuestion, ProposedAnchor } from '@/types/planningChat';

/**
 * MobilePlanningChatDemo - Demo page for Planning Chat
 * הדגמה של ממשק הצ'אט לתכנון
 */
export default function MobilePlanningChatDemo() {
  const [messages, setMessages] = useState<PlanningChatMessage[]>([
    {
      id: 'msg1',
      role: 'ai',
      content: 'שלום! אני כאן לעזור לך לארגן את השבוע. ראיתי שיש לך אירועים רבים ביומן. בוא נתחיל - ספר לי קצת על השגרה השבועית שלך.',
      timestamp: new Date().toISOString()
    }
  ]);

  const [context, setContext] = useState<ChatContext>({
    sessionId: 'demo_session',
    userId: 'demo_user',
    familyId: 'demo_family',
    startTime: new Date().toISOString(),
    questions: [],
    answeredQuestions: new Map(),
    proposals: [],
    currentGoal: 'identify_frameworks',
    createdEvents: []
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (message: string) => {
    // Add user message
    const userMessage: PlanningChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      // Example response with question
      if (messages.length === 1) {
        const question: OpenQuestion = {
          id: 'q1',
          category: 'framework',
          question: 'האם לאלון יש גן או בית ספר? באילו ימים בשבוע?',
          context: {
            memberId: 'member1'
          },
          priority: 'high',
          suggestedAnswers: ['גן - ראשון עד חמישי', 'בית ספר - ראשון עד חמישי', 'לא רלוונטי']
        };

        const aiMessage: PlanningChatMessage = {
          id: `msg_${Date.now()}`,
          role: 'ai',
          content: 'נהדר! בואו נתחיל עם הילדים. זיהיתי שיש לך ילד בשם אלון.',
          timestamp: new Date().toISOString(),
          metadata: {
            question
          }
        };
        setMessages(prev => [...prev, aiMessage]);
      } else if (messages.length === 3) {
        // After first question answered - propose anchor
        const proposal: ProposedAnchor = {
          id: 'anchor1',
          type: 'framework',
          title: 'גן השקמה - אלון',
          description: 'מסגרת קבועה 5 ימים בשבוע',
          event: {
            title: 'גן השקמה',
            startTime: new Date('2025-01-01T08:00:00').toISOString(),
            endTime: new Date('2025-01-01T16:00:00').toISOString(),
            recurrence: {
              frequency: 'weekly',
              daysOfWeek: [0, 1, 2, 3, 4],
              interval: 1
            },
            category: 'family',
            memberId: 'member1',
            location: 'גן השקמה, רחוב הדקל 15',
            metadata: {
              isAnchor: true,
              confidence: 0.95,
              learnedFrom: ['event1', 'event2', 'event3'],
              source: 'ai_analysis'
            }
          },
          reasoning: 'זוהה 15 פעמים ביומן בחודש האחרון, תמיד באותם ימים ושעות',
          benefits: [
            'לא צריך להזין כל שבוע מחדש',
            'תזכורות אוטומטיות בזמן',
            'זיהוי קונפליקטים אוטומטי',
            'חיסכון של 5 דקות בשבוע'
          ],
          status: 'pending'
        };

        const aiMessage: PlanningChatMessage = {
          id: `msg_${Date.now()}`,
          role: 'ai',
          content: 'מצוין! אני רואה שזה חוזר על עצמו. הנה הצעה שלי:',
          timestamp: new Date().toISOString(),
          metadata: {
            proposal
          }
        };
        setMessages(prev => [...prev, aiMessage]);
        setContext(prev => ({ ...prev, currentGoal: 'propose_anchors' }));
      } else {
        // Generic response
        const aiMessage: PlanningChatMessage = {
          id: `msg_${Date.now()}`,
          role: 'ai',
          content: 'אני מבין. בוא נמשיך לפרטים הבאים...',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
      }
      
      setIsLoading(false);
    }, 1500);
  };

  const handleAnswerQuestion = (questionId: string, answer: string) => {
    // Add answer to context
    setContext(prev => ({
      ...prev,
      answeredQuestions: new Map(prev.answeredQuestions).set(questionId, answer)
    }));

    // Add user message
    const userMessage: PlanningChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: answer,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    // Continue conversation
    handleSendMessage(answer);
  };

  const handleApproveAnchor = (anchorId: string, modifications?: any) => {
    // Add to created events
    setContext(prev => ({
      ...prev,
      createdEvents: [...prev.createdEvents, { id: anchorId } as any]
    }));

    // Add confirmation message
    const aiMessage: PlanningChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'ai',
      content: '✅ מעולה! העוגן נוסף ליומן. עכשיו בואו נמשיך - מי מוביל את אלון לגן בבוקר?',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, aiMessage]);
    setContext(prev => ({ ...prev, currentGoal: 'gather_details' }));
  };

  const handleRejectAnchor = (anchorId: string) => {
    const aiMessage: PlanningChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'ai',
      content: 'בסדר גמור! נדלג על זה. יש עוד דברים שאתה רוצה לספר לי?',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, aiMessage]);
  };

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
