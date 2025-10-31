import React, { useState, useEffect } from 'react';
import { ArrowRight, Brain, MessageCircle, User, MapPin, Clock, AlertCircle, Calendar, Sparkles, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '@/contexts/FamilyContext';
import { MemoryService } from '@/services/memoryService';
import { FamilyMemory, MemoryType } from '@/types/memory';
import { Timestamp } from 'firebase/firestore';

const MobileMemory = () => {
  const navigate = useNavigate();
  const { family, familyMembers } = useFamily();
  const [memories, setMemories] = useState<FamilyMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MemoryType | 'all'>('all');
  const [stats, setStats] = useState<{
    total: number;
    byType: Record<MemoryType, number>;
    bySource: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    loadMemories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [family?.id]);

  const loadMemories = async () => {
    if (!family?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const allMemories = await MemoryService.getAllMemories(family.id);
      setMemories(allMemories);

      const memoryStats = await MemoryService.getMemoryStats(family.id);
      setStats(memoryStats);
    } catch (error) {
      console.error('Error loading memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    if (!family?.id) return;
    
    if (confirm('האם אתה בטוח שברצונך למחוק זיכרון זה?')) {
      try {
        await MemoryService.deleteMemory(family.id, memoryId);
        await loadMemories();
      } catch (error) {
        console.error('Error deleting memory:', error);
        alert('שגיאה במחיקת הזיכרון');
      }
    }
  };

  const getMemoryIcon = (type: MemoryType) => {
    switch (type) {
      case 'place': return <MapPin className="w-5 h-5" />;
      case 'preference': return <User className="w-5 h-5" />;
      case 'restriction': return <AlertCircle className="w-5 h-5" />;
      case 'habit': return <Clock className="w-5 h-5" />;
      case 'event_pattern': return <Calendar className="w-5 h-5" />;
      case 'fact': return <Brain className="w-5 h-5" />;
      case 'note': return <Sparkles className="w-5 h-5" />;
    }
  };

  const getMemoryColor = (type: MemoryType) => {
    switch (type) {
      case 'place': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'preference': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'restriction': return 'bg-red-50 text-red-700 border-red-200';
      case 'habit': return 'bg-green-50 text-green-700 border-green-200';
      case 'event_pattern': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'fact': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'note': return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'user': return '👤';
      case 'system': return '⚙️';
      case 'ai_inferred': return '🤖';
      default: return '❓';
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'user': return 'משתמש';
      case 'system': return 'מערכת';
      case 'ai_inferred': return 'WhatsApp AI';
      default: return source;
    }
  };

  const getUserNames = (userIds?: string[]) => {
    if (!userIds || userIds.length === 0) return '';
    return userIds
      .map(id => familyMembers.find(m => m.id === id)?.name || id)
      .join(', ');
  };

  const filteredMemories = filter === 'all' 
    ? memories 
    : memories.filter(m => m.memoryType === filter);

  const typeLabels: Record<MemoryType, string> = {
    place: 'מקומות',
    preference: 'העדפות',
    restriction: 'הגבלות',
    habit: 'הרגלים',
    event_pattern: 'תבניות',
    fact: 'עובדות',
    note: 'הערות'
  };

  return (
    <div className="h-full bg-gradient-to-b from-purple-50 to-white overflow-y-auto" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowRight className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-purple-100 p-2 rounded-xl">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">זיכרון המשפחה</h1>
              <p className="text-sm text-gray-500">
                {stats ? `${stats.total} זיכרונות` : 'טוען...'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="px-6 py-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="text-2xl font-bold text-blue-600">
                {stats.bySource.user || 0}
              </div>
              <div className="text-xs text-blue-700 mt-1">באפליקציה</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="text-2xl font-bold text-green-600">
                {stats.bySource.ai_inferred || 0}
              </div>
              <div className="text-xs text-green-700 mt-1">מ-WhatsApp</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <div className="text-2xl font-bold text-purple-600">
                {stats.bySource.system || 0}
              </div>
              <div className="text-xs text-purple-700 mt-1">מערכת</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="px-6 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            הכל ({stats?.total || 0})
          </button>
          {Object.entries(typeLabels).map(([type, label]) => {
            const count = stats?.byType[type as MemoryType] || 0;
            return (
              <button
                key={type}
                onClick={() => setFilter(type as MemoryType)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === type
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Memories List */}
      <div className="px-6 pb-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Brain className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'אין זיכרונות עדיין' : `אין ${typeLabels[filter as MemoryType]}`}
            </h3>
            <p className="text-gray-500 text-sm">
              זיכרונות יווצרו אוטומטית מהשיחות ב-WhatsApp
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMemories.map((memory) => (
              <div
                key={memory.id}
                className={`bg-white rounded-xl p-4 border ${getMemoryColor(memory.memoryType)} shadow-sm`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getMemoryColor(memory.memoryType)}`}>
                    {getMemoryIcon(memory.memoryType)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Memory Title/Type */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase">
                        {typeLabels[memory.memoryType]}
                      </span>
                      {memory.tags && memory.tags.length > 0 && (
                        <div className="flex gap-1">
                          {memory.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Memory Text */}
                    <p className="text-gray-900 font-medium mb-2">
                      {memory.text}
                    </p>

                    {/* Related Users */}
                    {memory.relatedUserIds && memory.relatedUserIds.length > 0 && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                        <User className="w-4 h-4" />
                        <span>{getUserNames(memory.relatedUserIds)}</span>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          {getSourceIcon(memory.source)} {getSourceLabel(memory.source)}
                        </span>
                        {memory.confidence && (
                          <span>
                            ביטחון: {Math.round(memory.confidence * 100)}%
                          </span>
                        )}
                        <span>
                          {memory.createdAt instanceof Timestamp
                            ? memory.createdAt.toDate().toLocaleDateString('he-IL')
                            : new Date(memory.createdAt).toLocaleDateString('he-IL')}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteMemory(memory.id)}
                        className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileMemory;
