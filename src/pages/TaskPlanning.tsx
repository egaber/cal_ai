import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { taskService } from '@/services/taskService';
import { StorageService } from '@/services/storageService';
import { Task, TaskAnalysisRequest, TaskAnalysisResponse, EventSuggestion } from '@/types/task';
import { FamilyMember, CalendarEvent } from '@/types/calendar';
import { 
  Plus, 
  Sparkles, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight,
  Trash2,
  Calendar,
  Users,
  Car,
  MapPin,
  Brain,
  ListTodo,
  TrendingUp,
  AlertTriangle,
  Edit,
  Save,
  X,
  GripVertical
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SubTask } from '@/types/task';

export default function TaskPlanning() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isScheduling, setIsScheduling] = useState(false);
  const [schedulingResults, setSchedulingResults] = useState<{
    scheduled: Array<{ taskId: string; reason: string; when: string }>;
    deferred: Array<{ taskId: string; reason: string; period: string }>;
    warnings: string[];
  } | null>(null);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const navigate = useNavigate();
  
  // New task form
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<TaskAnalysisResponse | null>(null);
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const loadedTasks = taskService.loadTasks();
    const loadedMembers = StorageService.loadFamilyMembers() || [];
    
    // Sort tasks by priority (highest first)
    loadedTasks.sort((a, b) => b.priority - a.priority);
    
    setTasks(loadedTasks);
    setFamilyMembers(loadedMembers);
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      toast({
        title: 'שגיאה',
        description: 'נא להזין כותרת למשימה',
        variant: 'destructive'
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const request: TaskAnalysisRequest = {
        title: newTaskTitle,
        description: newTaskDescription,
        deadline: newTaskDeadline || undefined,
        userContext: followUpAnswers
      };

      const analysis = await taskService.analyzeTask(request, familyMembers);
      
      // If AI has follow-up questions, show dialog
      if (analysis.followUpQuestions && analysis.followUpQuestions.length > 0 && Object.keys(followUpAnswers).length === 0) {
        setCurrentAnalysis(analysis);
        setShowAIDialog(true);
        setIsAnalyzing(false);
        return;
      }

      const newTask = taskService.createTask(
        newTaskTitle,
        newTaskDescription,
        analysis,
        followUpAnswers
      );

      const updatedTasks = [...tasks, newTask];
      updatedTasks.sort((a, b) => b.priority - a.priority);
      
      taskService.saveTasks(updatedTasks);
      setTasks(updatedTasks);

      // Reset form
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskDeadline('');
      setFollowUpAnswers({});
      setCurrentAnalysis(null);

      toast({
        title: '✅ משימה נוספה',
        description: `המשימה "${newTask.title}" נותחה ונוספה בהצלחה`
      });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן היה להוסיף את המשימה',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnswerFollowUp = async () => {
    if (!currentAnalysis) return;
    
    setShowAIDialog(false);
    setIsAnalyzing(true);

    try {
      // Re-analyze with answers
      const request: TaskAnalysisRequest = {
        title: newTaskTitle,
        description: newTaskDescription,
        deadline: newTaskDeadline || undefined,
        userContext: followUpAnswers
      };

      const analysis = await taskService.analyzeTask(request, familyMembers);
      
      const newTask = taskService.createTask(
        newTaskTitle,
        newTaskDescription,
        analysis,
        followUpAnswers
      );

      const updatedTasks = [...tasks, newTask];
      updatedTasks.sort((a, b) => b.priority - a.priority);
      
      taskService.saveTasks(updatedTasks);
      setTasks(updatedTasks);

      // Reset
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskDeadline('');
      setFollowUpAnswers({});
      setCurrentAnalysis(null);

      toast({
        title: '✅ משימה נוספה',
        description: `המשימה "${newTask.title}" נותחה ונוספה בהצלחה`
      });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן היה להוסיף את המשימה',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleTaskExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    taskService.toggleSubtask(taskId, subtaskId);
    loadData();
  };

  const deleteTask = (taskId: string) => {
    taskService.deleteTask(taskId);
    loadData();
    toast({
      title: '🗑️ משימה נמחקה',
      description: 'המשימה הוסרה מהרשימה'
    });
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 70) return 'bg-red-500';
    if (priority >= 50) return 'bg-orange-500';
    if (priority >= 30) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPriorityLabel = (task: Task) => {
    return `${task.importance} / ${task.urgency}`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} דקות`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}:${mins.toString().padStart(2, '0')} שעות` : `${hours} שעות`;
  };

  const totalPendingTime = tasks
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.estimatedDuration, 0);

  const totalTasksCount = tasks.filter(t => t.status === 'pending').length;

  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTaskIds);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTaskIds(newSelected);
  };

  const handleScheduleSelected = async () => {
    if (selectedTaskIds.size === 0) {
      toast({
        title: 'שגיאה',
        description: 'נא לבחור לפחות משימה אחת',
        variant: 'destructive'
      });
      return;
    }

    setIsScheduling(true);

    try {
      const selectedTasks = tasks.filter(t => selectedTaskIds.has(t.id));
      const existingEvents = StorageService.loadEvents() || [];
      const weekStartDate = new Date();
      weekStartDate.setHours(0, 0, 0, 0);

      // Get AI scheduling suggestions
      const schedule = await taskService.generateWeeklySchedule(
        selectedTasks,
        existingEvents,
        weekStartDate
      );

      // Convert suggestions to EventSuggestion objects
      const eventSuggestions: EventSuggestion[] = [];
      const scheduledInfo: Array<{ taskId: string; reason: string; when: string }> = [];
      const deferredInfo: Array<{ taskId: string; reason: string; period: string }> = [];
      
      schedule.tasksToSchedule.forEach(taskSchedule => {
        const task = selectedTasks.find(t => t.id === taskSchedule.taskId);
        if (!task) return;

        // Take the first suggested slot (highest confidence)
        const slot = taskSchedule.suggestedSlots[0];
        if (slot) {
          eventSuggestions.push({
            id: `suggestion-${Date.now()}-${task.id}`,
            taskId: task.id,
            taskTitle: task.title,
            taskEmoji: task.emoji,
            suggestedStartTime: slot.startTime,
            suggestedEndTime: slot.endTime,
            confidence: slot.confidence,
            reasoning: slot.reasoning,
            status: 'pending'
          });

          // Format the time for display
          const startDate = new Date(slot.startTime);
          const isThisWeek = startDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          const whenLabel = isThisWeek 
            ? `השבוע - ${startDate.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' })}`
            : `שבוע הבא או מאוחר יותר - ${startDate.toLocaleDateString('he-IL')}`;

          scheduledInfo.push({
            taskId: task.id,
            reason: slot.reasoning,
            when: whenLabel
          });
        }
      });

      schedule.tasksToDefer.forEach(deferTask => {
        const task = selectedTasks.find(t => t.id === deferTask.taskId);
        if (!task) return;

        const periodLabels = {
          'next-week': 'שבוע הבא',
          'later': 'מאוחר יותר',
          'delegate': 'להאציל למישהו אחר',
          'cancel': 'לבטל'
        };

        deferredInfo.push({
          taskId: deferTask.taskId,
          reason: deferTask.reason,
          period: periodLabels[deferTask.suggestedDeferralPeriod] || deferTask.suggestedDeferralPeriod
        });
      });

      // Save suggestions to localStorage
      localStorage.setItem('event_suggestions', JSON.stringify(eventSuggestions));

      // Save results for display
      setSchedulingResults({
        scheduled: scheduledInfo,
        deferred: deferredInfo,
        warnings: schedule.overallCapacityAnalysis.warnings
      });

      // Show results dialog
      setShowResultsDialog(true);
    } catch (error) {
      console.error('Error scheduling tasks:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן היה לתזמן את המשימות',
        variant: 'destructive'
      });
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <ListTodo className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">תכנון משימות שבועי</h1>
                <p className="text-sm text-gray-600">רשימה → עדיפויות → תזמון</p>
              </div>
            </div>
                  <div className="flex items-center gap-4">
              {selectedTaskIds.size > 0 && (
                <>
                  <Button
                    onClick={handleScheduleSelected}
                    disabled={isScheduling}
                    className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                    size="lg"
                  >
                    {isScheduling ? (
                      <>
                        <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                        מתזמן...
                      </>
                    ) : (
                      <>
                        <Calendar className="h-5 w-5 mr-2" />
                        תזמן {selectedTaskIds.size} משימות
                      </>
                    )}
                  </Button>
                  <Separator orientation="vertical" className="h-12" />
                </>
              )}
              <div className="text-right">
                <div className="text-sm text-gray-600">סה"כ משימות</div>
                <div className="text-2xl font-bold text-purple-600">{totalTasksCount}</div>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div className="text-right">
                <div className="text-sm text-gray-600">זמן משוער</div>
                <div className="text-2xl font-bold text-blue-600">{formatDuration(totalPendingTime)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Left: Task List */}
            <div className="lg:col-span-2">
              <Card className="h-full flex flex-col shadow-lg border-2">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      משימות לפי עדיפות
                    </span>
                    <Badge variant="secondary" className="bg-white text-purple-700">
                      {totalTasksCount} פעילות
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-purple-100">
                    מסודר לפי חשיבות + דחיפות (גבוה → נמוך)
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  <ScrollArea className="h-full">
                    <div className="p-6 space-y-3">
                      {tasks.filter(t => t.status === 'pending').length === 0 ? (
                        <div className="text-center py-12">
                          <CheckCircle2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 text-lg">אין משימות - הוסף משימה חדשה</p>
                        </div>
                      ) : (
                        tasks
                          .filter(t => t.status === 'pending')
                          .map((task, index) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              index={index}
                              isExpanded={expandedTasks.has(task.id)}
                              isSelected={selectedTaskIds.has(task.id)}
                              onToggleExpanded={toggleTaskExpanded}
                              onToggleSelection={toggleTaskSelection}
                              onToggleSubtask={toggleSubtask}
                              onDelete={deleteTask}
                              familyMembers={familyMembers}
                            />
                          ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Right: Task Input */}
            <div className="lg:col-span-1">
              <Card className="h-full flex flex-col shadow-lg border-2">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    הוספת משימה חדשה
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    רשום את כל המשימות שצריך לבצע
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      כותרת המשימה *
                    </label>
                    <Input
                      placeholder="לדוגמה: לקנות מתנה ליום הולדת"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="text-right"
                      dir="rtl"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      תיאור (אופציונלי)
                    </label>
                    <Textarea
                      placeholder="פרטים נוספים על המשימה..."
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      className="text-right min-h-[100px]"
                      dir="rtl"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      מועד אחרון (אופציונלי)
                    </label>
                    <Input
                      type="date"
                      value={newTaskDeadline}
                      onChange={(e) => setNewTaskDeadline(e.target.value)}
                      className="text-right"
                    />
                  </div>

                  <Button
                    onClick={handleAddTask}
                    disabled={isAnalyzing || !newTaskTitle.trim()}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                        AI מנתח...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        הוסף משימה + ניתוח AI
                      </>
                    )}
                  </Button>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                    <div className="flex items-start gap-2">
                      <Brain className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-900">
                        <strong>AI יעשה עבורך:</strong>
                        <ul className="mt-2 space-y-1 list-disc list-inside">
                          <li>קטגוריה אוטומטית</li>
                          <li>הערכת דחיפות וחשיבות</li>
                          <li>פירוק למשימות משנה</li>
                          <li>הערכת זמן לביצוע</li>
                          <li>הצעת בני משפחה</li>
                          <li>טיפים לתזמון</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Scheduling Results Panel at Bottom */}
      {schedulingResults && showResultsDialog && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-purple-500 shadow-2xl z-50 max-h-[60vh] overflow-y-auto">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">תוצאות תזמון AI</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    setShowResultsDialog(false);
                    navigate('/', { state: { showSuggestions: true } });
                  }}
                  className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                  size="lg"
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  אשר המלצות ועבור ללוח שנה ({schedulingResults.scheduled.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResultsDialog(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Scheduled Tasks */}
              {schedulingResults.scheduled.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-900">
                      משימות שתוזמנו ({schedulingResults.scheduled.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {schedulingResults.scheduled.map(item => {
                      const task = tasks.find(t => t.id === item.taskId);
                      if (!task) return null;
                      return (
                        <Card key={item.taskId} className="border-l-4 border-green-500 bg-green-50/50">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              {task.emoji && <span className="text-2xl">{task.emoji}</span>}
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-1">{task.title}</h4>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="text-green-700 border-green-300">
                                    <Calendar className="h-3 w-3 ml-1" />
                                    {item.when}
                                  </Badge>
                                  <Badge variant="outline" className="text-gray-600">
                                    <Clock className="h-3 w-3 ml-1" />
                                    {formatDuration(task.estimatedDuration)}
                                  </Badge>
                                </div>
                                <div className="bg-white/80 rounded-lg p-3 text-sm text-gray-700">
                                  <strong>סיבה:</strong> {item.reason}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Deferred Tasks */}
              {schedulingResults.deferred.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-orange-900">
                      משימות שנדחו / לא תוזמנו ({schedulingResults.deferred.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {schedulingResults.deferred.map(item => {
                      const task = tasks.find(t => t.id === item.taskId);
                      if (!task) return null;
                      return (
                        <Card key={item.taskId} className="border-l-4 border-orange-500 bg-orange-50/50">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              {task.emoji && <span className="text-2xl">{task.emoji}</span>}
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-1">{task.title}</h4>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="text-orange-700 border-orange-300">
                                    <AlertTriangle className="h-3 w-3 ml-1" />
                                    המלצה: {item.period}
                                  </Badge>
                                  <Badge variant="outline" className="text-gray-600">
                                    <Clock className="h-3 w-3 ml-1" />
                                    {formatDuration(task.estimatedDuration)}
                                  </Badge>
                                </div>
                                <div className="bg-white/80 rounded-lg p-3 text-sm text-gray-700">
                                  <strong>סיבה:</strong> {item.reason}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {schedulingResults.warnings.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <h3 className="text-lg font-semibold text-yellow-900">
                      אזהרות וממצאים
                    </h3>
                  </div>
                  <Card className="border-l-4 border-yellow-500 bg-yellow-50/50">
                    <CardContent className="p-4">
                      <ul className="space-y-2">
                        {schedulingResults.warnings.map((warning, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-yellow-900">
                            <span className="text-yellow-600 font-bold">•</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* AI Follow-up Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              שאלות נוספות לניתוח טוב יותר
            </DialogTitle>
            <DialogDescription>
              ענה על השאלות הבאות כדי שה-AI יוכל לנתח את המשימה בצורה מדויקת יותר
            </DialogDescription>
          </DialogHeader>

          {currentAnalysis?.followUpQuestions && (
            <div className="space-y-4 py-4">
              {currentAnalysis.followUpQuestions.map((question: string, index: number) => (
                <div key={index}>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    {question}
                  </label>
                  <Input
                    placeholder="תשובתך..."
                    value={followUpAnswers[question] || ''}
                    onChange={(e) => setFollowUpAnswers({
                      ...followUpAnswers,
                      [question]: e.target.value
                    })}
                    className="text-right"
                    dir="rtl"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowAIDialog(false)}>
              דלג
            </Button>
            <Button onClick={handleAnswerFollowUp} className="bg-purple-600 hover:bg-purple-700">
              המשך לניתוח
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// SubtaskManager Component - Inline editing for subtasks
interface SubtaskManagerProps {
  taskId: string;
  subtasks: SubTask[];
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
}

function SubtaskManager({ taskId, subtasks, onToggleSubtask }: SubtaskManagerProps) {
  const { toast } = useToast();
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDuration, setEditedDuration] = useState(0);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskDuration, setNewSubtaskDuration] = useState(30);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}ד`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}:${mins.toString().padStart(2, '0')}ש` : `${hours}ש`;
  };

  const handleStartEdit = (subtask: SubTask) => {
    setEditingSubtaskId(subtask.id);
    setEditedTitle(subtask.title);
    setEditedDuration(subtask.estimatedDuration);
  };

  const handleSaveEdit = (subtaskId: string) => {
    if (!editedTitle.trim()) {
      toast({
        title: 'שגיאה',
        description: 'נא להזין כותרת למשימת המשנה',
        variant: 'destructive'
      });
      return;
    }

    const tasks = taskService.loadTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedSubtasks = task.subtasks.map(st =>
      st.id === subtaskId
        ? { ...st, title: editedTitle, estimatedDuration: editedDuration }
        : st
    );

    const totalDuration = updatedSubtasks.reduce((sum, st) => sum + st.estimatedDuration, 0);

    taskService.updateTask(taskId, {
      subtasks: updatedSubtasks,
      estimatedDuration: totalDuration
    });

    setEditingSubtaskId(null);
    toast({
      title: '✅ משימת משנה עודכנה',
      description: 'השינויים נשמרו בהצלחה'
    });

    // Reload page to reflect changes
    window.location.reload();
  };

  const handleCancelEdit = () => {
    setEditingSubtaskId(null);
    setEditedTitle('');
    setEditedDuration(0);
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const tasks = taskService.loadTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
    const totalDuration = updatedSubtasks.reduce((sum, st) => sum + st.estimatedDuration, 0);

    taskService.updateTask(taskId, {
      subtasks: updatedSubtasks,
      estimatedDuration: totalDuration || task.estimatedDuration
    });

    toast({
      title: '🗑️ משימת משנה נמחקה',
      description: 'משימת המשנה הוסרה'
    });

    // Reload page to reflect changes
    window.location.reload();
  };

  const handleAddNewSubtask = () => {
    if (!newSubtaskTitle.trim()) {
      toast({
        title: 'שגיאה',
        description: 'נא להזין כותרת למשימת המשנה',
        variant: 'destructive'
      });
      return;
    }

    const tasks = taskService.loadTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newSubtask: SubTask = {
      id: `subtask-${Date.now()}`,
      title: newSubtaskTitle,
      estimatedDuration: newSubtaskDuration,
      completed: false,
      order: task.subtasks.length
    };

    const updatedSubtasks = [...task.subtasks, newSubtask];
    const totalDuration = updatedSubtasks.reduce((sum, st) => sum + st.estimatedDuration, 0);

    taskService.updateTask(taskId, {
      subtasks: updatedSubtasks,
      estimatedDuration: totalDuration
    });

    setIsAddingNew(false);
    setNewSubtaskTitle('');
    setNewSubtaskDuration(30);

    toast({
      title: '✅ משימת משנה נוספה',
      description: 'משימת המשנה נוספה בהצלחה'
    });

    // Reload page to reflect changes
    window.location.reload();
  };

  if (subtasks.length === 0 && !isAddingNew) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-sm text-gray-700 flex items-center gap-2">
            <ListTodo className="h-4 w-4" />
            משימות משנה
          </h4>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddingNew(true)}
          className="w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          הוסף משימת משנה
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm text-gray-700 flex items-center gap-2">
          <ListTodo className="h-4 w-4" />
          משימות משנה
        </h4>
        {!isAddingNew && subtasks.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAddingNew(true)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-3 w-3 mr-1" />
            הוסף
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {subtasks.map((subtask) => (
          <div key={subtask.id}>
            {editingSubtaskId === subtask.id ? (
              // Edit mode
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200">
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="flex-1 text-right h-8 text-sm"
                  dir="rtl"
                  placeholder="כותרת"
                  autoFocus
                />
                <Input
                  type="number"
                  value={editedDuration}
                  onChange={(e) => setEditedDuration(parseInt(e.target.value) || 0)}
                  className="w-20 h-8 text-sm"
                  placeholder="דקות"
                />
                <Button
                  size="sm"
                  onClick={() => handleSaveEdit(subtask.id)}
                  className="h-8 px-2 bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="h-8 px-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              // View mode
              <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 group">
                <Checkbox
                  checked={subtask.completed}
                  onCheckedChange={() => onToggleSubtask(taskId, subtask.id)}
                  className="flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {subtask.title}
                  </div>
                  {subtask.description && (
                    <div className="text-xs text-gray-500 mt-0.5">{subtask.description}</div>
                  )}
                </div>
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDuration(subtask.estimatedDuration)}
                </Badge>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStartEdit(subtask)}
                    className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add New Subtask Form */}
        {isAddingNew && (
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
            <Input
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              className="flex-1 text-right h-8 text-sm"
              dir="rtl"
              placeholder="משימת משנה חדשה..."
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddNewSubtask();
                }
              }}
            />
            <Input
              type="number"
              value={newSubtaskDuration}
              onChange={(e) => setNewSubtaskDuration(parseInt(e.target.value) || 0)}
              className="w-20 h-8 text-sm"
              placeholder="דקות"
            />
            <Button
              size="sm"
              onClick={handleAddNewSubtask}
              className="h-8 px-2 bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsAddingNew(false);
                setNewSubtaskTitle('');
                setNewSubtaskDuration(30);
              }}
              className="h-8 px-2"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Task Card Component
interface TaskCardProps {
  task: Task;
  index: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpanded: (taskId: string) => void;
  onToggleSelection: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDelete: (taskId: string) => void;
  familyMembers: FamilyMember[];
}

function TaskCard({ 
  task, 
  index, 
  isExpanded,
  isSelected,
  onToggleExpanded,
  onToggleSelection,
  onToggleSubtask, 
  onDelete,
  familyMembers 
}: TaskCardProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Task>(task);

  const getPriorityColor = (priority: number) => {
    if (priority >= 70) return 'bg-red-500';
    if (priority >= 50) return 'bg-orange-500';
    if (priority >= 30) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}د`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}:${mins.toString().padStart(2, '0')}ש` : `${hours}ש`;
  };

  const handleSaveEdit = () => {
    // Recalculate priority based on urgency and importance
    const urgencyScores = { low: 10, medium: 30, high: 50, critical: 70 };
    const importanceScores = { low: 10, medium: 30, high: 50, critical: 70 };
    const urgencyScore = urgencyScores[editedTask.urgency];
    const importanceScore = importanceScores[editedTask.importance];
    const newPriority = Math.round((importanceScore * 0.6) + (urgencyScore * 0.4));

    const updatedTask = {
      ...editedTask,
      priority: newPriority,
      estimatedDuration: editedTask.subtasks.reduce((sum, st) => sum + st.estimatedDuration, 0) || editedTask.estimatedDuration
    };

    taskService.updateTask(task.id, updatedTask);
    setIsEditing(false);
    
    toast({
      title: '✅ משימה עודכנה',
      description: 'השינויים נשמרו בהצלחה'
    });

    // Reload to refresh the list
    window.location.reload();
  };

  const handleCancelEdit = () => {
    setEditedTask(task);
    setIsEditing(false);
  };

  const completedSubtasks = task.subtasks.filter(st => st.completed).length;
  const totalSubtasks = task.subtasks.length;
  const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  if (isEditing) {
    return (
      <Card className="border-l-4 border-blue-500">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                עריכת משימה
              </h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-1" />
                  ביטול
                </Button>
                <Button size="sm" onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-1" />
                  שמור
                </Button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">כותרת</label>
              <Input
                value={editedTask.title}
                onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                className="text-right"
                dir="rtl"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">תיאור</label>
              <Textarea
                value={editedTask.description || ''}
                onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                className="text-right"
                dir="rtl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">קטגוריה</label>
                <Select value={editedTask.category} onValueChange={(value) => setEditedTask({ ...editedTask, category: value as Task['category'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work">עבודה</SelectItem>
                    <SelectItem value="personal">אישי</SelectItem>
                    <SelectItem value="family">משפחה</SelectItem>
                    <SelectItem value="health">בריאות</SelectItem>
                    <SelectItem value="education">חינוך</SelectItem>
                    <SelectItem value="shopping">קניות</SelectItem>
                    <SelectItem value="home">בית</SelectItem>
                    <SelectItem value="finance">כספים</SelectItem>
                    <SelectItem value="social">חברתי</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Deadline */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">מועד אחרון</label>
                <Input
                  type="date"
                  value={editedTask.deadline ? new Date(editedTask.deadline).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditedTask({ ...editedTask, deadline: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Urgency */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">דחיפות</label>
                <Select value={editedTask.urgency} onValueChange={(value) => setEditedTask({ ...editedTask, urgency: value as Task['urgency'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">נמוכה</SelectItem>
                    <SelectItem value="medium">בינונית</SelectItem>
                    <SelectItem value="high">גבוהה</SelectItem>
                    <SelectItem value="critical">קריטית</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Importance */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">חשיבות</label>
                <Select value={editedTask.importance} onValueChange={(value) => setEditedTask({ ...editedTask, importance: value as Task['importance'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">נמוכה</SelectItem>
                    <SelectItem value="medium">בינונית</SelectItem>
                    <SelectItem value="high">גבוהה</SelectItem>
                    <SelectItem value="critical">קריטית</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Estimated Duration */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">זמן משוער (דקות)</label>
                <Input
                  type="number"
                  value={editedTask.estimatedDuration}
                  onChange={(e) => setEditedTask({ ...editedTask, estimatedDuration: parseInt(e.target.value) || 0 })}
                />
              </div>

              {/* Preferred Time */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">זמן מועדף</label>
                <Select value={editedTask.preferredTimeOfDay} onValueChange={(value) => setEditedTask({ ...editedTask, preferredTimeOfDay: value as Task['preferredTimeOfDay'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">בוקר</SelectItem>
                    <SelectItem value="afternoon">צהריים</SelectItem>
                    <SelectItem value="evening">ערב</SelectItem>
                    <SelectItem value="flexible">גמיש</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Requires Driving */}
            <div className="flex items-center gap-2">
              <Checkbox
                checked={editedTask.requiresDriving}
                onCheckedChange={(checked) => setEditedTask({ ...editedTask, requiresDriving: !!checked })}
              />
              <label className="text-sm font-medium text-gray-700">דורש נסיעה</label>
            </div>

            {/* Subtasks */}
            {editedTask.subtasks.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">משימות משנה</label>
                <div className="space-y-2">
                  {editedTask.subtasks.map((subtask, idx) => (
                    <div key={subtask.id} className="flex gap-2">
                      <Input
                        value={subtask.title}
                        onChange={(e) => {
                          const newSubtasks = [...editedTask.subtasks];
                          newSubtasks[idx] = { ...subtask, title: e.target.value };
                          setEditedTask({ ...editedTask, subtasks: newSubtasks });
                        }}
                        className="text-right flex-1"
                        dir="rtl"
                        placeholder="כותרת משימת משנה"
                      />
                      <Input
                        type="number"
                        value={subtask.estimatedDuration}
                        onChange={(e) => {
                          const newSubtasks = [...editedTask.subtasks];
                          newSubtasks[idx] = { ...subtask, estimatedDuration: parseInt(e.target.value) || 0 };
                          setEditedTask({ ...editedTask, subtasks: newSubtasks });
                        }}
                        className="w-24"
                        placeholder="דקות"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-l-4 hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-green-500 shadow-lg' : ''}`} style={{ borderLeftColor: getPriorityColor(task.priority).replace('bg-', '#') }}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelection(task.id)}
              className="mt-1.5"
            />
            <div className={`${getPriorityColor(task.priority)} text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0`}>
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {task.emoji && <span className="text-2xl">{task.emoji}</span>}
                <h3 className="font-semibold text-lg text-gray-900">{task.title}</h3>
                <Badge variant="secondary" className="text-xs">{task.category}</Badge>
              </div>
              {task.description && (
                <p className="text-sm text-gray-600 mb-2">{task.description}</p>
              )}
              
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-2">
                {/* Status Badge */}
                {task.status === 'scheduled' && (
                  <Badge className="gap-1 bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="h-3 w-3" />
                    תוזמן ללוח שנה
                  </Badge>
                )}
                {task.status === 'in-progress' && (
                  <Badge className="gap-1 bg-blue-600 hover:bg-blue-700">
                    <Clock className="h-3 w-3" />
                    בביצוע
                  </Badge>
                )}
                {task.status === 'cancelled' && (
                  <Badge className="gap-1 bg-gray-600 hover:bg-gray-700">
                    <X className="h-3 w-3" />
                    בוטל
                  </Badge>
                )}
                
                <Badge variant="outline" className="gap-1">
                  <TrendingUp className="h-3 w-3" />
                  עדיפות: {task.priority}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(task.estimatedDuration)}
                </Badge>
                {task.deadline && (
                  <Badge variant="outline" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {new Date(task.deadline).toLocaleDateString('he-IL')}
                  </Badge>
                )}
                {task.requiresDriving && (
                  <Badge variant="outline" className="gap-1">
                    <Car className="h-3 w-3" />
                    נסיעה
                  </Badge>
                )}
                {task.assignedToMemberIds.length > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Users className="h-3 w-3" />
                    {task.assignedToMemberIds.join(', ')}
                  </Badge>
                )}
              </div>

              {/* Progress */}
              {totalSubtasks > 0 && (
                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>התקדמות</span>
                    <span>{completedSubtasks}/{totalSubtasks}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpanded(task.id)}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(task.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t space-y-4">
            {/* Subtasks with Inline Editing */}
            <SubtaskManager
              taskId={task.id}
              subtasks={task.subtasks}
              onToggleSubtask={onToggleSubtask}
            />

            {/* AI Analysis */}
            {task.aiAnalysis && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <h4 className="font-medium text-sm text-purple-900 mb-2 flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  ניתוח AI
                </h4>
                <p className="text-sm text-purple-800 mb-2">{task.aiAnalysis.reasoning}</p>
                {task.aiAnalysis.schedulingTips && task.aiAnalysis.schedulingTips.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs font-medium text-purple-700 mb-1">טיפים לתזמון:</div>
                    <ul className="text-xs text-purple-700 space-y-1">
                      {task.aiAnalysis.schedulingTips.map((tip, i) => (
                        <li key={i}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
