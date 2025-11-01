import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useEvents } from '@/contexts/EventContext';
import { Calendar, Clock, MapPin, AlertCircle, Sparkles, TrendingUp, Users } from 'lucide-react';
import { deepRoutineAnalysisService } from '@/services/deepRoutineAnalysis';
import type { RoutineInsights, MemberDailySchedule } from '@/types/routineInsights';

export default function MobileDailySchedules() {
  const { user } = useAuth();
  const { familyMembers, family } = useFamily();
  const { events } = useEvents();
  const [insights, setInsights] = useState<RoutineInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay()); // 0=Sunday
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [analyzing, setAnalyzing] = useState(false);

  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  useEffect(() => {
    loadInsights();
  }, [user]);

  const loadInsights = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const stored = await deepRoutineAnalysisService.loadInsights(user.uid);
      setInsights(stored);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeRoutines = async () => {
    if (!user || !family || !events.length) return;

    try {
      setAnalyzing(true);
      const result = await deepRoutineAnalysisService.analyzeDeepRoutines(
        user.uid,
        family.id,
        events,
        familyMembers
      );

      if (result.success && result.insights) {
        setInsights(result.insights);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getSchedulesForDay = (): MemberDailySchedule[] => {
    if (!insights) return [];

    let schedules = insights.memberSchedules.filter(s => s.dayOfWeek === selectedDay);

    if (selectedMember !== 'all') {
      schedules = schedules.filter(s => s.memberId === selectedMember);
    }

    return schedules;
  };

  const getStressColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
    }
  };

  const getBlockTypeIcon = (type: string) => {
    switch (type) {
      case 'framework': return '🏢';
      case 'travel': return '🚗';
      case 'free_time': return '🆓';
      case 'preparation': return '👔';
      case 'meal': return '🍽️';
      default: return '📅';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pb-20" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            לוחות זמנים יומיים
          </h1>
          <button
            onClick={analyzeRoutines}
            disabled={analyzing}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {analyzing ? 'מנתח...' : 'נתח מחדש'}
          </button>
        </div>

        {/* Day Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {dayNames.map((day, index) => (
            <button
              key={index}
              onClick={() => setSelectedDay(index)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedDay === index
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Member Filter */}
        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedMember('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
              selectedMember === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            כולם
          </button>
          {familyMembers.map(member => (
            <button
              key={member.id}
              onClick={() => setSelectedMember(member.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
                selectedMember === member.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {member.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        {!insights ? (
          <div className="bg-white rounded-xl p-6 text-center shadow-sm">
            <Sparkles className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              ניתוח חכם של שגרות יומיות
            </h3>
            <p className="text-gray-600 mb-4">
              לחץ על "נתח מחדש" כדי שה-AI יבין את השגרות המשפחתיות שלך
            </p>
            <button
              onClick={analyzeRoutines}
              disabled={analyzing}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg font-medium"
            >
              {analyzing ? 'מנתח...' : 'התחל ניתוח'}
            </button>
          </div>
        ) : (
          <>
            {/* Insights Summary */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5" />
                <h3 className="font-semibold">סיכום תובנות</h3>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/20 rounded-lg p-2 backdrop-blur">
                  <div className="text-2xl font-bold">{insights.frameworks.length}</div>
                  <div className="text-xs opacity-90">מסגרות</div>
                </div>
                <div className="bg-white/20 rounded-lg p-2 backdrop-blur">
                  <div className="text-2xl font-bold">{insights.criticalConflicts.length}</div>
                  <div className="text-xs opacity-90">קונפליקטים</div>
                </div>
                <div className="bg-white/20 rounded-lg p-2 backdrop-blur">
                  <div className="text-2xl font-bold">{insights.topSuggestions.length}</div>
                  <div className="text-xs opacity-90">הצעות</div>
                </div>
              </div>
            </div>

            {/* Critical Conflicts */}
            {insights.criticalConflicts.length > 0 && (
              <div className="bg-red-50 rounded-xl p-4 border-2 border-red-200">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-red-900">קונפליקטים דחופים</h3>
                </div>
                <div className="space-y-2">
                  {insights.criticalConflicts.map((conflict, index) => (
                    <div key={`conflict-${conflict.id}-${index}`} className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-sm font-medium text-gray-800">{conflict.description}</p>
                      <p className="text-xs text-gray-600 mt-1">{conflict.impact}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Frameworks */}
            {insights.frameworks.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-800">מסגרות יומיומיות</h3>
                </div>
                <div className="space-y-3">
                  {insights.frameworks.map(framework => (
                    <div key={framework.id} className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-800">{framework.name}</p>
                          <p className="text-sm text-gray-600">{framework.memberName}</p>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {framework.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {framework.schedule.arrivalTime} - {framework.schedule.departureTime}
                        </div>
                        {framework.address && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{framework.address}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        ימים: {framework.schedule.daysOfWeek.map(d => dayNames[d]).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Member Schedules */}
            {getSchedulesForDay().map(schedule => (
              <div key={`${schedule.memberId}-${schedule.dayOfWeek}`} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">{schedule.memberName}</h3>
                  <span className={`text-sm font-medium ${getStressColor(schedule.metrics.stressLevel)}`}>
                    רמת לחץ: {schedule.metrics.stressLevel === 'low' ? 'נמוכה' : schedule.metrics.stressLevel === 'medium' ? 'בינונית' : 'גבוהה'}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {Math.floor(schedule.metrics.totalBusyTime / 60)}:{String(schedule.metrics.totalBusyTime % 60).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-600">זמן עסוק</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-green-600">
                      {Math.floor(schedule.metrics.totalFreeTime / 60)}:{String(schedule.metrics.totalFreeTime % 60).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-600">זמן פנוי</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-purple-600">
                      {Math.floor(schedule.metrics.travelTime / 60)}:{String(schedule.metrics.travelTime % 60).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-600">נסיעות</div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-2">
                  {schedule.timeline.map(block => (
                    <div
                      key={block.id}
                      className={`p-3 rounded-lg border ${
                        block.type === 'free_time'
                          ? 'bg-gray-50 border-gray-200'
                          : block.type === 'travel'
                          ? 'bg-purple-50 border-purple-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{getBlockTypeIcon(block.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{block.title}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <Clock className="w-3 h-3" />
                            <span>{block.startTime} - {block.endTime}</span>
                          </div>
                          {block.location && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{block.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Top Suggestions */}
            {insights.topSuggestions.length > 0 && (
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">המלצות חכמות</h3>
                </div>
                <div className="space-y-2">
                  {insights.topSuggestions.map((suggestion, index) => (
                    <div key={`suggestion-${suggestion.id}-${index}`} className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="font-medium text-gray-800 text-sm">{suggestion.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          ביטחון: {suggestion.confidence}%
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          suggestion.priority === 'high' ? 'bg-red-100 text-red-700' :
                          suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {suggestion.priority === 'high' ? 'דחוף' : suggestion.priority === 'medium' ? 'בינוני' : 'נמוך'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
