import { useEffect, useState } from 'react';
import { Task, TaskProcessingPhase } from '@/types/task';
import { FamilyMember } from '@/types/calendar';
import { taskService } from '@/services/taskService';
import { StorageService } from '@/services/storageService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Brain,
  ListTodo,
  Hash,
  Flame,
  Layers,
  Timer,
  Wand2,
  Sparkles,
  Gauge,
  Calendar,
  PlayCircle,
  ChevronsRight,
  RefreshCw,
  X,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Edit3
} from 'lucide-react';
import { PRIMARY_COLOR } from '@/config/branding';
import { useEvents } from '@/contexts/EventContext';

const PIPELINE_PHASE_LABELS: Record<TaskProcessingPhase, string> = {
  idle: 'ממתין',
  context_loading: 'טעינת הקשר',
  categorizing: 'קטגוריזציה',
  prioritizing: 'עדיפות',
  breaking_down: 'פירוק',
  estimating: 'הערכת זמנים',
  enhancing: 'שיפור',
  smart_evaluating: 'SMART',
  complete: 'הושלם',
  error: 'שגיאה'
};

export default function TaskPlanning() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDescription, setQuickDescription] = useState('');
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);
  const [showGuidance, setShowGuidance] = useState(false);
  const [showPipelineDialog, setShowPipelineDialog] = useState(false);
  const [pipelineTask, setPipelineTask] = useState<Task | null>(null);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const { events } = useEvents();

  // Load initial data
  useEffect(() => {
    const members = StorageService.loadFamilyMembers() || [];
    setFamilyMembers(members);
    hydrateTasks();
  }, []);

  const hydrateTasks = () => {
    const loaded = taskService.loadTasks();
    const updated = loaded.map(t => {
      if (!t.processingPhase) {
        return {
          ...t,
          processingPhase: (t.aiAnalysis ? 'complete' : 'idle') as TaskProcessingPhase,
          processingSteps: t.aiAnalysis
            ? []
            : [
                {
                  id: 'step-context_loading',
                  phase: 'context_loading' as TaskProcessingPhase,
                  label: 'טעינת הקשר',
                  status: 'pending'
                },
                {
                  id: 'step-categorizing',
                  phase: 'categorizing' as TaskProcessingPhase,
                  label: 'קטגוריזציה',
                  status: 'pending'
                },
                {
                  id: 'step-prioritizing',
                  phase: 'prioritizing' as TaskProcessingPhase,
                  label: 'קביעת עדיפות',
                  status: 'pending'
                },
                {
                  id: 'step-breaking_down',
                  phase: 'breaking_down' as TaskProcessingPhase,
                  label: 'פירוק למשימות משנה',
                  status: 'pending'
                },
                {
                  id: 'step-estimating',
                  phase: 'estimating' as TaskProcessingPhase,
                  label: 'הערכת זמנים',
                  status: 'pending'
                },
                {
                  id: 'step-enhancing',
                  phase: 'enhancing' as TaskProcessingPhase,
                  label: 'שיפור ואופטימיזציה',
                  status: 'pending'
                },
                {
                  id: 'step-smart_evaluating',
                  phase: 'smart_evaluating' as TaskProcessingPhase,
                  label: 'SMART / קס"ם',
                  status: 'pending'
                }
              ]
        } as Task;
      }
      return t;
    });

    const phaseOrder: TaskProcessingPhase[] = [
      'idle',
      'context_loading',
      'categorizing',
      'prioritizing',
      'breaking_down',
      'estimating',
      'enhancing',
      'smart_evaluating',
      'complete',
      'error'
    ];

    updated.sort((a, b) => {
      const phaseDiff =
        phaseOrder.indexOf(a.processingPhase) - phaseOrder.indexOf(b.processingPhase);
      if (phaseDiff !== 0) return phaseDiff;
      return (b.priority || 0) - (a.priority || 0);
    });

    taskService.saveTasks(updated);
    setTasks(updated);
  };

  // Quick create (instant insert)
  const handleQuickAdd = () => {
    if (!quickTitle.trim()) {
      toast({
        title: 'שגיאה',
        description: 'נא להזין כותרת',
        variant: 'destructive'
      });
      return;
    }
    const newTask = taskService.quickCreateTask(quickTitle.trim(), quickDescription.trim());
    setQuickTitle('');
    setQuickDescription('');
    hydrateTasks();
    toast({
      title: '✅ נוספה משימה',
      description: `המשימה "${newTask.title}" נוצרה. ה-AI עדיין לא התחיל.`
    });
  };

  // Run a single phase (stream update after completion)
  const runPhase = async (taskId: string, phase: TaskProcessingPhase) => {
    if (
      ![
        'context_loading',
        'categorizing',
        'prioritizing',
        'breaking_down',
        'estimating',
        'enhancing',
        'smart_evaluating'
      ].includes(phase)
    ) {
      return;
    }
    setRunningTaskId(taskId);
    try {
      await taskService.runPhase(taskId, phase, familyMembers, events);
      hydrateTasks();
      toast({
        title: 'AI',
        description: `השלב "${PIPELINE_PHASE_LABELS[phase]}" הושלם`
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'שגיאה בשלב';
      toast({
        title: 'שגיאת AI',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setRunningTaskId(null);
    }
  };

  // Stream each phase sequentially (skip breakdown for small tasks unless user asks)
  const runFullPipeline = async (taskId: string, forceBreakdown: boolean = false) => {
    setRunningTaskId(taskId);
    try {
      const current = taskService.loadTasks().find(t => t.id === taskId);
      const smallTask = current && current.estimatedDuration && current.estimatedDuration <= 60 && current.subtasks.length === 0;
      // Build phases without spread to satisfy strict TaskProcessingPhase typing
      const phases: TaskProcessingPhase[] = [
        'context_loading',
        'categorizing',
        'prioritizing',
        'estimating',
        'enhancing',
        'smart_evaluating'
      ];
      if (!(smallTask && !forceBreakdown)) {
        // Insert breakdown after prioritizing
        phases.splice(3, 0, 'breaking_down');
      }
      for (const phase of phases) {
        await taskService.runPhase(taskId, phase, familyMembers, events);
        hydrateTasks(); // refresh after each phase for live feel
      }
      taskService.updateTask(taskId, { processingPhase: 'complete' });
      hydrateTasks();
      toast({
        title: 'AI',
        description: 'תהליך ניתוח הושלם'
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'שגיאה בתהליך ניתוח';
      toast({
        title: 'שגיאה',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setRunningTaskId(null);
    }
  };

  // Batch run using streamed pipeline
  const runPipelineOnAllIdle = async () => {
    setIsBatchRunning(true);
    try {
      const idleIds = tasks.filter(t => t.processingPhase === 'idle').map(t => t.id);
      for (const id of idleIds) {
        await runFullPipeline(id); // uses skip logic
      }
      hydrateTasks();
      toast({
        title: 'עיבוד אצווה',
        description: 'כל משימות idle עובדו'
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'תקלה';
      toast({
        title: 'שגיאה בעיבוד אצווה',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsBatchRunning(false);
    }
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    taskService.toggleSubtask(taskId, subtaskId);
    hydrateTasks();
  };

  // Adjust single subtask duration by delta minutes
  const adjustSubtaskDuration = (taskId: string, subtaskId: string, delta: number) => {
    const all = taskService.loadTasks();
    const t = all.find(x => x.id === taskId);
    if (!t) return;
    const st = t.subtasks.find(s => s.id === subtaskId);
    if (!st) return;
    st.estimatedDuration = Math.max(1, (st.estimatedDuration || 0) + delta);
    // Recalculate total
    t.estimatedDuration = t.subtasks.reduce((sum, s) => sum + s.estimatedDuration, 0);
    taskService.saveTasks(all);
    hydrateTasks();
  };

  // Set specific subtask duration
  const setSubtaskDuration = (taskId: string, subtaskId: string, value: number) => {
    if (isNaN(value) || value <= 0) return;
    const all = taskService.loadTasks();
    const t = all.find(x => x.id === taskId);
    if (!t) return;
    const st = t.subtasks.find(s => s.id === subtaskId);
    if (!st) return;
    st.estimatedDuration = Math.round(value);
    t.estimatedDuration = t.subtasks.reduce((sum, s) => sum + s.estimatedDuration, 0);
    taskService.saveTasks(all);
    hydrateTasks();
  };

  // Set total duration and proportionally distribute across subtasks
  const setTotalDuration = (taskId: string, newTotal: number) => {
    if (isNaN(newTotal) || newTotal <= 0) return;
    const all = taskService.loadTasks();
    const t = all.find(x => x.id === taskId);
    if (!t) return;
    if (t.subtasks.length === 0) {
      t.estimatedDuration = Math.round(newTotal);
    } else {
      const currentTotal = t.subtasks.reduce((sum, s) => sum + s.estimatedDuration, 0);
      if (currentTotal === 0) {
        // Equal split
        const equal = Math.round(newTotal / t.subtasks.length);
        t.subtasks.forEach(st => (st.estimatedDuration = Math.max(1, equal)));
      } else {
        const ratio = newTotal / currentTotal;
        let cumulative = 0;
        t.subtasks.forEach((st, idx) => {
          const scaled = Math.max(1, Math.round(st.estimatedDuration * ratio));
          st.estimatedDuration = scaled;
          cumulative += scaled;
          // Adjust last to match total exactly
          if (idx === t.subtasks.length - 1 && cumulative !== Math.round(newTotal)) {
            const diff = Math.round(newTotal) - cumulative;
            st.estimatedDuration = Math.max(1, st.estimatedDuration + diff);
          }
        });
      }
      t.estimatedDuration = t.subtasks.reduce((sum, s) => sum + s.estimatedDuration, 0);
    }
    taskService.saveTasks(all);
    hydrateTasks();
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ background: `linear-gradient(to right, ${PRIMARY_COLOR}, #e91e63)` }}
            >
              <ListTodo className="h-5 w-5 text-white" />
            </div>
            <div className="text-right" dir="rtl">
              <h1 className="text-xl font-bold text-gray-900">משימות (גרסה חדשה)</h1>
              <p className="text-xs text-gray-600">רשימה → ניתוח AI → SMART → לוח שנה</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGuidance(true)}
              className="whitespace-nowrap"
            >
              <Sparkles className="h-4 w-4 ml-1" />
              עקרונות
            </Button>
            <Button
              size="sm"
              disabled={isBatchRunning}
              onClick={runPipelineOnAllIdle}
              className="bg-green-600 hover:bg-green-700"
            >
              {isBatchRunning ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="h-4 w-4" />
              )}
              עבד הכל
            </Button>
          </div>
        </div>
        {/* Quick Input */}
        <div className="px-4 pb-3">
          <div className="bg-white rounded-lg shadow p-3 space-y-2 border">
            <Input
              dir="rtl"
              placeholder="הוסף משימה מידית... (כותרת)"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              className="text-right"
            />
            <Textarea
              dir="rtl"
              placeholder="תיאור (אופציונלי)"
              value={quickDescription}
              onChange={(e) => setQuickDescription(e.target.value)}
              className="text-right min-h-[70px]"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleQuickAdd}
                disabled={!quickTitle.trim()}
                className="flex-1 text-white"
                style={{ background: `linear-gradient(to right, ${PRIMARY_COLOR}, #e91e63)` }}
              >
                <Plus className="h-4 w-4 ml-1" />
                הוסף מיד
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setQuickTitle('');
                  setQuickDescription('');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-gray-600" dir="rtl">
              המשימה נכנסת מיד לרשימה. AI מתחיל רק לאחר לחיצה על שלב או הפעלת Run AI.
            </div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {tasks.length === 0 && (
              <div className="text-center py-12">
                <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">אין משימות עדיין. הוסף משימה חדשה.</p>
              </div>
            )}
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                running={runningTaskId === task.id}
                onRunPhase={runPhase}
                onRunFull={(forceBreakdown?: boolean) => runFullPipeline(task.id, forceBreakdown)}
                onOpenPipeline={() => {
                  setPipelineTask(task);
                  setShowPipelineDialog(true);
                }}
                onToggleSubtask={toggleSubtask}
                onAdjustSubtask={adjustSubtaskDuration}
                onSetSubtask={setSubtaskDuration}
                onSetTotal={setTotalDuration}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Guidance Dialog */}
      <Dialog open={showGuidance} onOpenChange={setShowGuidance}>
        <DialogContent dir="rtl" className="max-w-xl">
          <DialogHeader>
            <DialogTitle>עקרונות תיעדוף ומשימות</DialogTitle>
            <DialogDescription>תהליך מובנה לניהול משימות אפקטיבי</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-4 text-sm text-gray-800">
              <div className="bg-blue-50 rounded p-3 border border-blue-200">
                <h4 className="font-semibold mb-1">שלושת השלבים:</h4>
                <ol className="list-decimal list-inside space-y-1">
                  <li>רשימות – כתיבה מוחלטת של כל המטלות (Inbox)</li>
                  <li>הערכת חשיבות / דחיפות וזמנים (שעה-שעתיים למשימה)</li>
                  <li>הכנסה ללוז (עוגנים והרגלים תחילה, אחר כך משימות)</li>
                </ol>
                <p className="mt-2">
                  שאלת סינון: האם חייב השבוע / אפשר לדחות / לבטל / להאציל?
                </p>
              </div>
              <div className="bg-purple-50 rounded p-3 border border-purple-200">
                <h4 className="font-semibold mb-1">SMART:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>ספציפי (Specific)</li>
                  <li>מדיד (Measurable)</li>
                  <li>בר השגה (Achievable)</li>
                  <li>רלוונטי (Relevant)</li>
                  <li>מוגבל בזמן (Time-bound)</li>
                </ul>
                <h4 className="font-semibold mt-3 mb-1">קס"ם (וריאציה):</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>קונקרטי / קצר</li>
                  <li>ספציפי</li>
                  <li>מדיד</li>
                  <li>מוגבל בזמן / מתואם</li>
                </ul>
              </div>
              <div className="bg-green-50 rounded p-3 border border-green-200">
                <h4 className="font-semibold mb-1">תזמון AI:</h4>
                <p>
                  AI מנתח עומס שבועי, זמנים, משימות משנה (רק אם ביקשת פירוק), ומסייע לשילוב בלוח.
                </p>
              </div>
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 mt-2">
            <Button onClick={() => setShowGuidance(false)}>סגור</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pipeline Details Dialog */}
      <Dialog open={showPipelineDialog} onOpenChange={setShowPipelineDialog}>
        <DialogContent dir="rtl" className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>תהליך ניתוח AI למשימה</DialogTitle>
            <DialogDescription>מעקב מפורט אחר כל שלב חי</DialogDescription>
          </DialogHeader>
          {pipelineTask && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                {pipelineTask.emoji && <span className="text-2xl">{pipelineTask.emoji}</span>}
                {pipelineTask.title}
              </h3>
              <ScrollArea className="max-h-[60vh] pr-1">
                <div className="space-y-2">
                  {pipelineTask.processingSteps?.map((step) => (
                    <div
                      key={step.id}
                      className="p-3 rounded border bg-white flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              step.status === 'done'
                                ? 'default'
                                : step.status === 'in-progress'
                                ? 'secondary'
                                : step.status === 'error'
                                ? 'destructive'
                                : 'outline'
                            }
                          >
                            {step.label}
                            {step.status === 'in-progress' && (
                              <span className="ml-1 animate-pulse">…</span>
                            )}
                          </Badge>
                          {step.status === 'in-progress' && (
                            <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                          )}
                          {step.status === 'done' && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                          {step.status === 'error' && <X className="h-4 w-4 text-red-600" />}
                        </div>
                        <div className="flex gap-1">
                          {step.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => runPhase(pipelineTask.id, step.phase)}
                            >
                              הפעל
                            </Button>
                          )}
                        </div>
                      </div>
                      {step.status === 'in-progress' && (
                        <div className="text-[11px] text-blue-700">
                          מבצע: {PIPELINE_PHASE_LABELS[step.phase]}…
                        </div>
                      )}
                      {step.reasoning && (
                        <div className="text-xs text-gray-700">
                          <strong>היגיון:</strong> {step.reasoning}
                        </div>
                      )}
                      {step.outputSummary && (
                        <div className="text-xs text-gray-600">
                          <strong>תוצאה:</strong> {step.outputSummary}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPipelineDialog(false)}>
                  סגור
                </Button>
                <Button
                  onClick={() => runFullPipeline(pipelineTask.id)}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={runningTaskId === pipelineTask.id}
                >
                  <ChevronsRight className="h-4 w-4 ml-1" />
                  כל השלבים
                </Button>
                {pipelineTask &&
                  pipelineTask.subtasks.length === 0 &&
                  pipelineTask.estimatedDuration <= 60 && (
                    <Button
                      onClick={() => runFullPipeline(pipelineTask.id, true)}
                      variant="secondary"
                      disabled={runningTaskId === pipelineTask.id}
                    >
                      <Layers className="h-4 w-4 ml-1" />
                      פירוק (בקש)
                    </Button>
                  )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  running: boolean;
  onRunPhase: (taskId: string, phase: TaskProcessingPhase) => void;
  onRunFull: (forceBreakdown?: boolean) => void;
  onOpenPipeline: () => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAdjustSubtask: (taskId: string, subtaskId: string, delta: number) => void;
  onSetSubtask: (taskId: string, subtaskId: string, value: number) => void;
  onSetTotal: (taskId: string, total: number) => void;
}

function TaskCard({
  task,
  running,
  onRunPhase,
  onRunFull,
  onOpenPipeline,
  onToggleSubtask,
  onAdjustSubtask,
  onSetSubtask,
  onSetTotal
}: TaskCardProps) {
  const nextStep = task.processingSteps?.find((s) => s.status === 'pending');
  const pipelineProgress =
    task.processingSteps && task.processingSteps.length
      ? Math.round(
          (task.processingSteps.filter((s) => s.status === 'done').length /
            task.processingSteps.length) * 100
        )
      : task.processingPhase === 'complete'
      ? 100
      : 0;

  const smallTaskNoBreakdown =
    task.subtasks.length === 0 && task.estimatedDuration <= 60;

  return (
    <div
      className={`rounded-xl border shadow-sm bg-white p-3 flex flex-col gap-3 relative ${
        running ? 'ring-2 ring-blue-400' : ''
      }`}
    >
      {/* Running overlay label */}
      {running && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-10">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mb-2" />
            <div className="text-sm font-medium text-blue-800 flex items-center gap-1">
            AI: {PIPELINE_PHASE_LABELS[task.processingPhase]} <span className="animate-pulse">…</span>
          </div>
          <div className="text-[11px] text-gray-600 mt-1">
            מעבד את המשימה בזמן אמת
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0" dir="rtl">
          <div className="flex items-center gap-2 flex-wrap">
            {task.emoji && <span className="text-2xl">{task.emoji}</span>}
            <h3 className="font-semibold text-gray-900 text-base">{task.title}</h3>
            <Badge variant="outline" className="text-xs">
              {PIPELINE_PHASE_LABELS[task.processingPhase]}
              {running && <span className="ml-1 animate-pulse">…</span>}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {task.category}
            </Badge>
            {task.priority > 0 && (
              <Badge variant="secondary" className="text-xs">
                עדיפות {task.priority}
              </Badge>
            )}
          </div>
          {task.description && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-3">{task.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenPipeline}
            className="text-xs"
            disabled={running}
          >
            <Gauge className="h-4 w-4 ml-1" />
            תהליך ניתוח
          </Button>
          <div className="flex gap-1">
            <Button
              size="sm"
              onClick={() => onRunFull(false)}
              disabled={running || task.processingPhase === 'complete'}
              className="bg-green-600 hover:bg-green-700 text-xs"
            >
              <PlayCircle className="h-4 w-4 ml-1" />
              run AI
            </Button>
            {smallTaskNoBreakdown && (
              <Button
                size="sm"
                variant="secondary"
                disabled={running}
                onClick={() => onRunFull(true)}
                className="text-xs"
              >
                <Layers className="h-4 w-4 ml-1" />
                פירוק
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-gray-600" dir="rtl">
          <span>התקדמות AI</span>
          <span>{pipelineProgress}%</span>
        </div>
        <Progress value={pipelineProgress} className="h-2" />
      </div>

      {/* Duration Editing */}
      <div className="flex items-center justify-between gap-2" dir="rtl">
        <div className="text-[11px] text-gray-700 flex items-center gap-1">
          <Timer className="h-3 w-3" />
          משך כולל:
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2"
            disabled={running}
            onClick={() => onSetTotal(task.id, Math.max(5, (task.estimatedDuration || 0) - 5))}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
          <Input
            type="number"
            min={1}
            value={task.estimatedDuration || 0}
            disabled={running}
            onChange={(e) => onSetTotal(task.id, Number(e.target.value))}
            className="h-6 w-16 text-center text-xs"
          />
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2"
            disabled={running}
            onClick={() => onSetTotal(task.id, (task.estimatedDuration || 0) + 5)}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <span className="text-[10px] text-gray-500">דקות</span>
        </div>
      </div>

      {/* Action row */}
      {nextStep &&
        task.processingPhase !== 'complete' &&
        task.processingPhase !== 'error' &&
        !running && (
          <div className="flex flex-wrap gap-2" dir="rtl">
            <Button
              size="sm"
              variant="outline"
              disabled={running}
              onClick={() => onRunPhase(task.id, nextStep.phase)}
              className="text-xs"
            >
              {iconForPhase(nextStep.phase)}
              הפעל {PIPELINE_PHASE_LABELS[nextStep.phase]}
            </Button>
            {task.processingSteps
              .filter((s) => s.phase !== nextStep.phase && s.status === 'pending')
              .slice(0, 2)
              .map((s) => (
                <Button
                  key={s.id}
                  size="sm"
                  variant="ghost"
                  disabled={running}
                  onClick={() => onRunPhase(task.id, s.phase)}
                  className="text-xs"
                >
                  {iconForPhase(s.phase)}
                  {PIPELINE_PHASE_LABELS[s.phase]}
                </Button>
              ))}
          </div>
        )}

      {/* Subtasks */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="space-y-1" dir="rtl">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
              <Layers className="h-3 w-3" /> משימות משנה
            </span>
            <span className="text-[10px] text-gray-500">
              {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
            </span>
          </div>
          <div className="space-y-1">
            {task.subtasks.slice(0, 8).map((st) => (
              <div key={st.id} className="flex items-center gap-2 text-xs">
                <Checkbox
                  checked={st.completed}
                  onCheckedChange={() => onToggleSubtask(task.id, st.id)}
                />
                <span
                  className={`flex-1 ${
                    st.completed ? 'line-through text-gray-400' : 'text-gray-700'
                  }`}
                >
                  {st.title}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2"
                    disabled={running}
                    onClick={() => onAdjustSubtask(task.id, st.id, -5)}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    value={st.estimatedDuration}
                    disabled={running}
                    onChange={(e) =>
                      onSetSubtask(task.id, st.id, Number(e.target.value))
                    }
                    className="h-6 w-14 text-center text-[11px]"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2"
                    disabled={running}
                    onClick={() => onAdjustSubtask(task.id, st.id, +5)}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <span className="text-[10px] text-gray-500">דק</span>
                </div>
              </div>
            ))}
            {task.subtasks.length > 8 && (
              <span className="text-[10px] text-gray-500">
                + עוד {task.subtasks.length - 8} משימות משנה
              </span>
            )}
          </div>
        </div>
      )}

      {/* SMART Summary */}
      {task.smart && (
        <div className="rounded bg-purple-50 border border-purple-200 p-2" dir="rtl">
          <div className="flex items-center gap-1 text-[11px] font-medium text-purple-800">
            <Hash className="h-3 w-3" />
            SMART / קס"ם
          </div>
          <div className="grid grid-cols-3 gap-1 mt-1 text-[10px] text-purple-700">
            <div>
              <span className="font-semibold">S:</span> {truncate(task.smart.specific)}
            </div>
            <div>
              <span className="font-semibold">M:</span> {truncate(task.smart.measurable)}
            </div>
            <div>
              <span className="font-semibold">A:</span> {truncate(task.smart.achievable)}
            </div>
            <div>
              <span className="font-semibold">R:</span> {truncate(task.smart.relevant)}
            </div>
            <div>
              <span className="font-semibold">T:</span> {truncate(task.smart.timeBound)}
            </div>
            <div>
              <span className="font-semibold">ציון:</span> {task.smart.score ?? '—'}
            </div>
          </div>
        </div>
      )}

      {/* Scheduling readiness */}
      {task.processingPhase === 'complete' && (
        <div className="flex items-center gap-2 justify-between">
          <Badge variant="secondary" className="text-xs">
            מוכן לתזמון
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            disabled={running}
            // Future scheduling suggestion
          >
            <Calendar className="h-3 w-3 ml-1" />
            הצעת זמן
          </Button>
        </div>
      )}
    </div>
  );
}

function iconForPhase(phase: TaskProcessingPhase) {
  switch (phase) {
    case 'context_loading':
      return <RefreshCw className="h-3 w-3 ml-1" />;
    case 'categorizing':
      return <Flame className="h-3 w-3 ml-1" />;
    case 'prioritizing':
      return <Gauge className="h-3 w-3 ml-1" />;
    case 'breaking_down':
      return <Layers className="h-3 w-3 ml-1" />;
    case 'estimating':
      return <Timer className="h-3 w-3 ml-1" />;
    case 'enhancing':
      return <Wand2 className="h-3 w-3 ml-1" />;
    case 'smart_evaluating':
      return <Hash className="h-3 w-3 ml-1" />;
    default:
      return <Brain className="h-3 w-3 ml-1" />;
  }
}

function truncate(value?: string, max: number = 22) {
  if (!value) return '—';
  return value.length > max ? value.slice(0, max) + '…' : value;
}
