import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Users, MapPin, Plus, Trash2, Edit, Lightbulb, Calendar, RefreshCw } from "lucide-react";
import { UserMemory, FamilyMemory, Place, TravelInfo, MemoryData } from "@/types/memory";
import { FamilyMember } from "@/types/calendar";
import { StorageService } from "@/services/storageService";
import { useToast } from "@/hooks/use-toast";
import { CalendarInsights } from "@/types/calendarInsights";
import { calendarAnalysisService } from "@/services/calendarAnalysisService";

interface MemoryManagerProps {
  familyMembers: FamilyMember[];
  memoryData: MemoryData;
  onMemoryUpdate: (memoryData: MemoryData) => void;
  userId: string;
  familyId: string;
}

export function MemoryManager({ familyMembers, memoryData, onMemoryUpdate, userId, familyId }: MemoryManagerProps) {
  const { toast } = useToast();
  const [isAddUserMemoryOpen, setIsAddUserMemoryOpen] = useState(false);
  const [isAddFamilyMemoryOpen, setIsAddFamilyMemoryOpen] = useState(false);
  const [isAddPlaceOpen, setIsAddPlaceOpen] = useState(false);
  const [isAddTravelOpen, setIsAddTravelOpen] = useState(false);
  
  // Calendar Insights State
  const [calendarInsights, setCalendarInsights] = useState<CalendarInsights | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);

  // User Memory Form
  const [newUserMemory, setNewUserMemory] = useState({
    userId: familyMembers.find(m => m.isYou)?.id || '',
    fact: '',
    category: 'other' as UserMemory['category'],
    importance: 'medium' as UserMemory['importance'],
  });

  // Family Memory Form
  const [newFamilyMemory, setNewFamilyMemory] = useState({
    fact: '',
    category: 'other' as FamilyMemory['category'],
    importance: 'medium' as FamilyMemory['importance'],
    affectedMembers: [] as string[],
  });

  // Place Form
  const [newPlace, setNewPlace] = useState({
    name: '',
    address: '',
    type: 'other' as Place['type'],
    associatedMemberId: '',
  });

  // Travel Info Form
  const [newTravelInfo, setNewTravelInfo] = useState({
    fromPlaceId: '',
    toPlaceId: '',
    method: 'drive' as TravelInfo['method'],
    durationMinutes: 0,
    requiresAdult: false,
    accompaniedByMemberId: '',
  });

  const handleAddUserMemory = () => {
    const memory: UserMemory = {
      id: `user_mem_${Date.now()}`,
      ...newUserMemory,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    StorageService.addUserMemory(memory);
    const updatedData = StorageService.loadMemoryData();
    onMemoryUpdate(updatedData);
    setIsAddUserMemoryOpen(false);
    setNewUserMemory({
      userId: familyMembers.find(m => m.isYou)?.id || '',
      fact: '',
      category: 'other',
      importance: 'medium',
    });
    toast({
      title: "Memory Added",
      description: "User memory has been saved",
    });
  };

  const handleAddFamilyMemory = () => {
    const memory: FamilyMemory = {
      id: `family_mem_${Date.now()}`,
      ...newFamilyMemory,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    StorageService.addFamilyMemory(memory);
    const updatedData = StorageService.loadMemoryData();
    onMemoryUpdate(updatedData);
    setIsAddFamilyMemoryOpen(false);
    setNewFamilyMemory({
      fact: '',
      category: 'other',
      importance: 'medium',
      affectedMembers: [],
    });
    toast({
      title: "Memory Added",
      description: "Family memory has been saved",
    });
  };

  const handleAddPlace = () => {
    const place: Place = {
      id: `place_${Date.now()}`,
      ...newPlace,
      associatedMemberId: newPlace.associatedMemberId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    StorageService.addPlace(place);
    const updatedData = StorageService.loadMemoryData();
    onMemoryUpdate(updatedData);
    setIsAddPlaceOpen(false);
    setNewPlace({
      name: '',
      address: '',
      type: 'other',
      associatedMemberId: '',
    });
    toast({
      title: "Place Added",
      description: "Location has been saved",
    });
  };

  const handleAddTravelInfo = () => {
    const travel: TravelInfo = {
      id: `travel_${Date.now()}`,
      ...newTravelInfo,
      accompaniedByMemberId: newTravelInfo.accompaniedByMemberId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    StorageService.addTravelInfo(travel);
    const updatedData = StorageService.loadMemoryData();
    onMemoryUpdate(updatedData);
    setIsAddTravelOpen(false);
    setNewTravelInfo({
      fromPlaceId: '',
      toPlaceId: '',
      method: 'drive',
      durationMinutes: 0,
      requiresAdult: false,
      accompaniedByMemberId: '',
    });
    toast({
      title: "Travel Info Added",
      description: "Travel information has been saved",
    });
  };

  const handleDeleteUserMemory = (id: string) => {
    StorageService.deleteUserMemory(id);
    const updatedData = StorageService.loadMemoryData();
    onMemoryUpdate(updatedData);
    toast({
      title: "Memory Deleted",
      description: "User memory has been removed",
    });
  };

  const handleDeleteFamilyMemory = (id: string) => {
    StorageService.deleteFamilyMemory(id);
    const updatedData = StorageService.loadMemoryData();
    onMemoryUpdate(updatedData);
    toast({
      title: "Memory Deleted",
      description: "Family memory has been removed",
    });
  };

  const handleDeletePlace = (id: string) => {
    StorageService.deletePlace(id);
    const updatedData = StorageService.loadMemoryData();
    onMemoryUpdate(updatedData);
    toast({
      title: "Place Deleted",
      description: "Location has been removed",
    });
  };

  const handleDeleteTravelInfo = (id: string) => {
    StorageService.deleteTravelInfo(id);
    const updatedData = StorageService.loadMemoryData();
    onMemoryUpdate(updatedData);
    toast({
      title: "Travel Info Deleted",
      description: "Travel information has been removed",
    });
  };

  const getPlaceName = (placeId: string) => {
    return memoryData.places.find(p => p.id === placeId)?.name || 'Unknown';
  };

  const getMemberName = (memberId: string) => {
    return familyMembers.find(m => m.id === memberId)?.name || 'Unknown';
  };

  // Load calendar insights on mount
  useEffect(() => {
    loadCalendarInsights();
  }, []);

  const loadCalendarInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const insights = await calendarAnalysisService.loadInsights(userId);
      setCalendarInsights(insights);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const handleAnalyzeCalendar = async () => {
    setIsAnalyzing(true);
    try {
      const result = await calendarAnalysisService.analyzeCalendar(userId, familyId);
      
      if (result.success && result.insights) {
        setCalendarInsights(result.insights);
        await calendarAnalysisService.saveInsights(result.insights);
        
        toast({
          title: "ניתוח הושלם",
          description: `נותחו ${result.insights.eventsAnalyzed} אירועים`,
        });
      } else {
        toast({
          title: "הניתוח נכשל",
          description: result.error || 'אירעה שגיאה',
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה",
        description: error instanceof Error ? error.message : 'אירעה שגיאה',
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Memory Manager
        </CardTitle>
        <CardDescription>
          Store important information about users, family preferences, and places
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="user" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="insights">📊 Insights</TabsTrigger>
            <TabsTrigger value="user">User Memory</TabsTrigger>
            <TabsTrigger value="family">Family Memory</TabsTrigger>
            <TabsTrigger value="places">Places</TabsTrigger>
            <TabsTrigger value="travel">Travel Info</TabsTrigger>
          </TabsList>

          {/* Calendar Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Calendar Intelligence</p>
                <p className="text-xs text-muted-foreground">
                  {calendarInsights 
                    ? `Last analyzed: ${new Date(calendarInsights.analyzedAt).toLocaleString('he-IL')}`
                    : 'No analysis yet'}
                </p>
              </div>
              <Button 
                size="sm" 
                onClick={handleAnalyzeCalendar}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    מנתח...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    נתח יומן
                  </>
                )}
              </Button>
            </div>

            {isLoadingInsights ? (
              <div className="text-center py-8 text-muted-foreground">טוען תובנות...</div>
            ) : !calendarInsights ? (
              <Card className="p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <Lightbulb className="h-12 w-12 text-muted-foreground" />
                  <div>
                    <p className="font-medium mb-2">אין עדיין ניתוח</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      לחץ על "נתח יומן" כדי לקבל תובנות על ההרגלים והדפוסים שלך
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {/* Summary Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">סיכום</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">אירועים נותחו:</span>
                          <span className="font-medium ml-2">{calendarInsights.eventsAnalyzed}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">רמת ביטחון:</span>
                          <Badge variant={calendarInsights.confidence > 70 ? 'default' : 'secondary'} className="ml-2">
                            {calendarInsights.confidence}%
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Family Members */}
                  {calendarInsights.familyMembers.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          בני משפחה ותפקידים
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {calendarInsights.familyMembers.map((member, idx) => (
                            <div key={idx} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{member.name}</span>
                                <Badge variant="outline">{member.confidence}% ביטחון</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{member.role}</p>
                              {member.responsibilities.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {member.responsibilities.map((resp, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {resp}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recurring Anchors */}
                  {calendarInsights.recurringAnchors.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          עוגנים קבועים
                        </CardTitle>
                        <CardDescription>פעילויות חוזרות שמארגנות את השבוע</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {calendarInsights.recurringAnchors.map((anchor, idx) => (
                            <div key={idx} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{anchor.activity}</span>
                                <Badge variant="outline">{anchor.confidence}% ביטחון</Badge>
                              </div>
                              <div className="text-sm space-y-1">
                                <p><span className="text-muted-foreground">יום:</span> {anchor.dayOfWeek}</p>
                                <p><span className="text-muted-foreground">שעה:</span> {anchor.time}</p>
                                <p><span className="text-muted-foreground">תדירות:</span> {anchor.frequency}</p>
                                {anchor.participants.length > 0 && (
                                  <p><span className="text-muted-foreground">משתתפים:</span> {anchor.participants.join(', ')}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Habits */}
                  {calendarInsights.habits.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">הרגלים</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {calendarInsights.habits.map((habit, idx) => (
                            <div key={idx} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="secondary">{habit.timePreference}</Badge>
                                <Badge variant="outline">{habit.confidence}% ביטחון</Badge>
                              </div>
                              <p className="text-sm mb-2">{habit.description}</p>
                              {habit.examples.length > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  <span className="font-medium">דוגמאות:</span> {habit.examples.join(', ')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* General Insights */}
                  {calendarInsights.generalInsights.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Lightbulb className="h-5 w-5" />
                          תובנות כלליות
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {calendarInsights.generalInsights.map((insight, idx) => (
                            <div key={idx} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{insight.title}</span>
                                <div className="flex gap-2">
                                  <Badge variant={
                                    insight.impact === 'positive' ? 'default' :
                                    insight.impact === 'negative' ? 'destructive' :
                                    'secondary'
                                  }>
                                    {insight.impact}
                                  </Badge>
                                  <Badge variant="outline">{insight.confidence}%</Badge>
                                </div>
                              </div>
                              <p className="text-sm mb-2">{insight.description}</p>
                              {insight.suggestedAction && (
                                <p className="text-sm text-blue-600">
                                  💡 {insight.suggestedAction}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* User Memory Tab */}
          <TabsContent value="user" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {memoryData.userMemories.length} memories stored
              </p>
              <Dialog open={isAddUserMemoryOpen} onOpenChange={setIsAddUserMemoryOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Memory
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add User Memory</DialogTitle>
                    <DialogDescription>
                      Store an important fact about a user
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="userId">User</Label>
                      <Select value={newUserMemory.userId} onValueChange={(value) => setNewUserMemory({ ...newUserMemory, userId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent>
                          {familyMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="fact">Fact</Label>
                      <Textarea
                        id="fact"
                        value={newUserMemory.fact}
                        onChange={(e) => setNewUserMemory({ ...newUserMemory, fact: e.target.value })}
                        placeholder="Enter the memory/fact"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={newUserMemory.category} onValueChange={(value) => setNewUserMemory({ ...newUserMemory, category: value as UserMemory['category'] })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="preference">Preference</SelectItem>
                          <SelectItem value="habit">Habit</SelectItem>
                          <SelectItem value="constraint">Constraint</SelectItem>
                          <SelectItem value="goal">Goal</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="importance">Importance</Label>
                      <Select value={newUserMemory.importance} onValueChange={(value) => setNewUserMemory({ ...newUserMemory, importance: value as UserMemory['importance'] })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddUserMemory} className="w-full">
                      Save Memory
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {memoryData.userMemories.map((memory) => (
                  <Card key={memory.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{getMemberName(memory.userId)}</Badge>
                            <Badge variant="secondary">{memory.category}</Badge>
                            <Badge variant={memory.importance === 'high' ? 'destructive' : memory.importance === 'medium' ? 'default' : 'secondary'}>
                              {memory.importance}
                            </Badge>
                          </div>
                          <p className="text-sm">{memory.fact}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUserMemory(memory.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {memoryData.userMemories.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No user memories stored yet</p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Family Memory Tab */}
          <TabsContent value="family" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {memoryData.familyMemories.length} memories stored
              </p>
              <Dialog open={isAddFamilyMemoryOpen} onOpenChange={setIsAddFamilyMemoryOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Memory
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Family Memory</DialogTitle>
                    <DialogDescription>
                      Store an important fact about the family
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="familyFact">Fact</Label>
                      <Textarea
                        id="familyFact"
                        value={newFamilyMemory.fact}
                        onChange={(e) => setNewFamilyMemory({ ...newFamilyMemory, fact: e.target.value })}
                        placeholder="Enter the memory/fact"
                      />
                    </div>
                    <div>
                      <Label htmlFor="familyCategory">Category</Label>
                      <Select value={newFamilyMemory.category} onValueChange={(value) => setNewFamilyMemory({ ...newFamilyMemory, category: value as FamilyMemory['category'] })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="preference">Preference</SelectItem>
                          <SelectItem value="habit">Habit</SelectItem>
                          <SelectItem value="constraint">Constraint</SelectItem>
                          <SelectItem value="tradition">Tradition</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="familyImportance">Importance</Label>
                      <Select value={newFamilyMemory.importance} onValueChange={(value) => setNewFamilyMemory({ ...newFamilyMemory, importance: value as FamilyMemory['importance'] })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddFamilyMemory} className="w-full">
                      Save Memory
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {memoryData.familyMemories.map((memory) => (
                  <Card key={memory.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">{memory.category}</Badge>
                            <Badge variant={memory.importance === 'high' ? 'destructive' : memory.importance === 'medium' ? 'default' : 'secondary'}>
                              {memory.importance}
                            </Badge>
                          </div>
                          <p className="text-sm">{memory.fact}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteFamilyMemory(memory.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {memoryData.familyMemories.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No family memories stored yet</p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Places Tab */}
          <TabsContent value="places" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {memoryData.places.length} places stored
              </p>
              <Dialog open={isAddPlaceOpen} onOpenChange={setIsAddPlaceOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Place
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Place</DialogTitle>
                    <DialogDescription>
                      Store an important location
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="placeName">Name</Label>
                      <Input
                        id="placeName"
                        value={newPlace.name}
                        onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
                        placeholder="e.g., Home, Office, School"
                      />
                    </div>
                    <div>
                      <Label htmlFor="placeAddress">Address</Label>
                      <Input
                        id="placeAddress"
                        value={newPlace.address}
                        onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })}
                        placeholder="Enter address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="placeType">Type</Label>
                      <Select value={newPlace.type} onValueChange={(value) => setNewPlace({ ...newPlace, type: value as Place['type'] })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="home">Home</SelectItem>
                          <SelectItem value="work">Work</SelectItem>
                          <SelectItem value="school">School</SelectItem>
                          <SelectItem value="kindergarten">Kindergarten</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="associatedMember">Associated Member (Optional)</Label>
                      <Select value={newPlace.associatedMemberId} onValueChange={(value) => setNewPlace({ ...newPlace, associatedMemberId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select member" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {familyMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddPlace} className="w-full">
                      Save Place
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {memoryData.places.map((place) => (
                  <Card key={place.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4" />
                            <span className="font-medium">{place.name}</span>
                            <Badge variant="outline">{place.type}</Badge>
                            {place.associatedMemberId && (
                              <Badge variant="secondary">{getMemberName(place.associatedMemberId)}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{place.address}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePlace(place.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {memoryData.places.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No places stored yet</p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Travel Info Tab */}
          <TabsContent value="travel" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {memoryData.travelInfo.length} travel routes stored
              </p>
              <Dialog open={isAddTravelOpen} onOpenChange={setIsAddTravelOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Travel Info
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Travel Information</DialogTitle>
                    <DialogDescription>
                      Store travel time and requirements between locations
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fromPlace">From</Label>
                      <Select value={newTravelInfo.fromPlaceId} onValueChange={(value) => setNewTravelInfo({ ...newTravelInfo, fromPlaceId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select starting place" />
                        </SelectTrigger>
                        <SelectContent>
                          {memoryData.places.map((place) => (
                            <SelectItem key={place.id} value={place.id}>
                              {place.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="toPlace">To</Label>
                      <Select value={newTravelInfo.toPlaceId} onValueChange={(value) => setNewTravelInfo({ ...newTravelInfo, toPlaceId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select destination" />
                        </SelectTrigger>
                        <SelectContent>
                          {memoryData.places.map((place) => (
                            <SelectItem key={place.id} value={place.id}>
                              {place.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="method">Method</Label>
                      <Select value={newTravelInfo.method} onValueChange={(value) => setNewTravelInfo({ ...newTravelInfo, method: value as TravelInfo['method'] })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="drive">Drive</SelectItem>
                          <SelectItem value="walk">Walk</SelectItem>
                          <SelectItem value="public_transport">Public Transport</SelectItem>
                          <SelectItem value="bike">Bike</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={newTravelInfo.durationMinutes}
                        onChange={(e) => setNewTravelInfo({ ...newTravelInfo, durationMinutes: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="requiresAdult"
                        checked={newTravelInfo.requiresAdult}
                        onChange={(e) => setNewTravelInfo({ ...newTravelInfo, requiresAdult: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="requiresAdult">Requires adult accompaniment</Label>
                    </div>
                    {newTravelInfo.requiresAdult && (
                      <div>
                        <Label htmlFor="accompaniedBy">Accompanied by (Optional)</Label>
                        <Select value={newTravelInfo.accompaniedByMemberId} onValueChange={(value) => setNewTravelInfo({ ...newTravelInfo, accompaniedByMemberId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select parent" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Anyone</SelectItem>
                          {familyMembers.filter(m => m.role === 'parent').map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <Button onClick={handleAddTravelInfo} className="w-full">
                      Save Travel Info
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {memoryData.travelInfo.map((travel) => (
                  <Card key={travel.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{getPlaceName(travel.fromPlaceId)}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-medium">{getPlaceName(travel.toPlaceId)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline">{travel.method}</Badge>
                            <span>{travel.durationMinutes} min</span>
                            {travel.requiresAdult && (
                              <Badge variant="secondary">
                                Requires adult
                                {travel.accompaniedByMemberId && ` - ${getMemberName(travel.accompaniedByMemberId)}`}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTravelInfo(travel.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {memoryData.travelInfo.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No travel information stored yet</p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
