import { useState, useEffect } from 'react';
import { GOOGLE_CALENDAR_CONFIG, validateGoogleCalendarConfig } from '@/config/googleCalendar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FamilyMember } from '@/types/calendar';
import { GoogleCalendarSettings, CalendarMemberMapping } from '@/types/googleCalendar';
import { googleCalendarService } from '@/services/googleCalendarService';
import { StorageService } from '@/services/storageService';
import { createEventService } from '@/services/eventService';
import { Cloud, CloudOff, RefreshCw, Settings, AlertCircle, CheckCircle, Plus, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';

interface GoogleCalendarSyncProps {
  familyId: string;
  userId: string;
  familyMembers: FamilyMember[];
  onSyncComplete?: () => void;
}

export function GoogleCalendarSync({
  familyId,
  userId,
  familyMembers,
  onSyncComplete,
}: GoogleCalendarSyncProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [calendars, setCalendars] = useState<Array<{ id: string; summary: string; description?: string }>>([]);
  const [settings, setSettings] = useState<GoogleCalendarSettings>({
    enabled: false,
    clientId: GOOGLE_CALENDAR_CONFIG.CLIENT_ID,
    apiKey: GOOGLE_CALENDAR_CONFIG.API_KEY,
    calendarMappings: [],
    autoSync: false,
    syncInterval: 30,
  });

  // Load settings on mount
  useEffect(() => {
    const savedSettings = StorageService.loadGoogleCalendarSettings();
    if (savedSettings) {
      // Merge saved settings but always use config file credentials
      setSettings({
        ...savedSettings,
        clientId: GOOGLE_CALENDAR_CONFIG.CLIENT_ID,
        apiKey: GOOGLE_CALENDAR_CONFIG.API_KEY,
      });
      if (savedSettings.enabled && validateGoogleCalendarConfig()) {
        initializeGoogleAPI(GOOGLE_CALENDAR_CONFIG.CLIENT_ID, GOOGLE_CALENDAR_CONFIG.API_KEY);
      }
    } else if (validateGoogleCalendarConfig()) {
      // Auto-initialize if credentials are configured
      initializeGoogleAPI(GOOGLE_CALENDAR_CONFIG.CLIENT_ID, GOOGLE_CALENDAR_CONFIG.API_KEY);
    }
  }, []);

  // Initialize Google API
  const initializeGoogleAPI = async (clientId: string, apiKey: string) => {
    try {
      await googleCalendarService.initialize(clientId, apiKey);
      setIsAuthenticated(googleCalendarService.isAuthenticated());
    } catch (error) {
      toast({
        title: 'Initialization Failed',
        description: error instanceof Error ? error.message : 'Failed to initialize Google Calendar API',
        variant: 'destructive',
      });
    }
  };

  // Handle authentication
  const handleAuthenticate = async () => {
    if (!validateGoogleCalendarConfig()) {
      toast({
        title: 'Missing Credentials',
        description: 'Please configure Google Calendar credentials in src/config/googleCalendar.ts',
        variant: 'destructive',
      });
      return;
    }

    try {
      await initializeGoogleAPI(GOOGLE_CALENDAR_CONFIG.CLIENT_ID, GOOGLE_CALENDAR_CONFIG.API_KEY);
      const authenticated = await googleCalendarService.authenticate();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        // Fetch calendar list with email info
        const calList = await googleCalendarService.getCalendarList();
        setCalendars(calList.map((cal) => ({ 
          id: cal.id, 
          summary: cal.summary,
          description: cal.description 
        })));

        toast({
          title: 'Connected',
          description: 'Successfully connected to Google Calendar',
        });
      }
    } catch (error) {
      toast({
        title: 'Authentication Failed',
        description: error instanceof Error ? error.message : 'Failed to authenticate',
        variant: 'destructive',
      });
    }
  };

  // Handle sign out
  const handleSignOut = () => {
    googleCalendarService.signOut();
    setIsAuthenticated(false);
    setCalendars([]);
    toast({
      title: 'Signed Out',
      description: 'Disconnected from Google Calendar',
    });
  };

  // Add calendar mapping
  const handleAddCalendarMapping = () => {
    const newMapping: CalendarMemberMapping = {
      calendarId: '',
      calendarName: '',
      memberId: familyMembers[0]?.id || '',
      calendarEmail: '',
    };
    setSettings({
      ...settings,
      calendarMappings: [...settings.calendarMappings, newMapping],
    });
  };

  // Update calendar mapping
  const handleUpdateCalendarMapping = (index: number, field: keyof CalendarMemberMapping, value: string) => {
    const updated = [...settings.calendarMappings];
    
    if (field === 'calendarId') {
      const selectedCal = calendars.find(c => c.id === value);
      updated[index] = {
        ...updated[index],
        calendarId: value,
        calendarName: selectedCal?.summary || '',
        calendarEmail: value, // Calendar ID is typically the email
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
    }
    
    setSettings({ ...settings, calendarMappings: updated });
  };

  // Remove calendar mapping
  const handleRemoveCalendarMapping = (index: number) => {
    const updated = settings.calendarMappings.filter((_, i) => i !== index);
    setSettings({ ...settings, calendarMappings: updated });
  };

  // Save settings
  const handleSaveSettings = () => {
    // Filter out incomplete mappings
    const validMappings = settings.calendarMappings.filter(
      m => m.calendarId && m.memberId
    );
    
    const settingsToSave = {
      ...settings,
      calendarMappings: validMappings,
    };
    
    StorageService.saveGoogleCalendarSettings(settingsToSave);
    toast({
      title: 'Settings Saved',
      description: `${validMappings.length} calendar mapping(s) saved`,
    });
    setIsOpen(false);
  };

  // Sync from Google Calendar (all mapped calendars) - NOW SAVES TO FIRESTORE
  const handleSyncFromGoogle = async () => {
    console.log('🔄 Starting Google Calendar sync...');
    
    if (!isAuthenticated) {
      toast({
        title: 'Not Authenticated',
        description: 'Please connect to Google Calendar first',
        variant: 'destructive',
      });
      return;
    }

    if (settings.calendarMappings.length === 0) {
      toast({
        title: 'No Calendars Configured',
        description: 'Please add at least one calendar mapping in settings',
        variant: 'destructive',
      });
      return;
    }

    console.log('📋 Calendar mappings:', settings.calendarMappings);
    
    setIsSyncing(true);
    let totalImported = 0;

    try {
      // Get events from the last 7 days to 90 days in the future
      const timeMin = new Date();
      timeMin.setDate(timeMin.getDate() - 7);
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 90);

      console.log('📅 Date range:', { timeMin, timeMax });
      console.log('👤 User ID:', userId);
      console.log('👨‍👩‍👧‍👦 Family ID:', familyId);

      // Create EventService for Google calendar source
      const googleEventService = createEventService(familyId, userId, 'google');

      // Sync each mapped calendar
      for (const mapping of settings.calendarMappings) {
        try {
          console.log(`📥 Fetching events from calendar: ${mapping.calendarName} (${mapping.calendarId})`);
          
          const googleEvents = await googleCalendarService.syncFromGoogle(
            mapping.calendarId,
            mapping.memberId,
            timeMin.toISOString(),
            timeMax.toISOString(),
            mapping.calendarEmail
          );

          console.log(`✅ Received ${googleEvents.length} events from Google Calendar`);
          
          if (googleEvents.length > 0) {
            console.log('📝 Sample event:', googleEvents[0]);
          }

          // Save each event to Firestore in the 'google' calendar source
          for (const event of googleEvents) {
            console.log(`💾 Saving event to Firestore:`, event.title);
            await googleEventService.createEvent(event);
            totalImported++;
          }
          
          console.log(`✅ Successfully saved ${googleEvents.length} events to Firestore`);
        } catch (error) {
          console.error(`❌ Failed to sync calendar ${mapping.calendarName}:`, error);
        }
      }

      // Update last sync time
      const updatedSettings = {
        ...settings,
        lastSyncTime: new Date().toISOString(),
      };
      setSettings(updatedSettings);
      StorageService.saveGoogleCalendarSettings(updatedSettings);

      // Notify parent to refresh
      onSyncComplete?.();

      toast({
        title: 'Sync Complete',
        description: `Imported ${totalImported} events from ${settings.calendarMappings.length} calendar(s)`,
      });
    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Failed to sync from Google Calendar',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync to Google Calendar - Export local events
  const handleSyncToGoogle = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Not Authenticated',
        description: 'Please connect to Google Calendar first',
        variant: 'destructive',
      });
      return;
    }

    if (settings.calendarMappings.length === 0) {
      toast({
        title: 'No Calendars Configured',
        description: 'Please add at least one calendar mapping in settings',
        variant: 'destructive',
      });
      return;
    }

    setIsSyncing(true);
    try {
      let totalSuccess = 0;
      let totalFailed = 0;

      // Load local events from cal_ai source
      const localEventService = createEventService(familyId, userId, 'cal_ai');
      const allLocalEvents = await localEventService.loadAllEvents();

      // Export events to each mapped calendar based on member
      for (const mapping of settings.calendarMappings) {
        const memberEvents = allLocalEvents.filter(
          e => e.memberId === mapping.memberId
        );

        if (memberEvents.length > 0) {
          const results = await googleCalendarService.syncToGoogle(
            memberEvents,
            familyMembers,
            mapping.calendarId
          );
          totalSuccess += results.success;
          totalFailed += results.failed;
        }
      }

      toast({
        title: 'Sync Complete',
        description: `Exported ${totalSuccess} events${totalFailed > 0 ? ` (${totalFailed} failed)` : ''}`,
        variant: totalFailed > 0 ? 'destructive' : 'default',
      });
    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Failed to sync to Google Calendar',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Sync Status Indicator */}
      {settings.enabled && (
        <div className="flex items-center gap-1 text-sm">
          {isAuthenticated ? (
            <Cloud className="h-4 w-4 text-green-500" />
          ) : (
            <CloudOff className="h-4 w-4 text-gray-400" />
          )}
        </div>
      )}

      {/* Quick Sync Button */}
      {settings.enabled && isAuthenticated && settings.calendarMappings.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSyncFromGoogle}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync ({settings.calendarMappings.length})
            </>
          )}
        </Button>
      )}

      {/* Settings Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Google Calendar
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Google Calendar Integration</DialogTitle>
            <DialogDescription>
              Connect multiple Google Calendars to family members
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <Label htmlFor="enabled">Enable Google Calendar Sync</Label>
              <Switch
                id="enabled"
                checked={settings.enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enabled: checked })
                }
              />
            </div>

            {settings.enabled && (
              <>
                {/* Credentials Status */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold">API Credentials</p>
                      {validateGoogleCalendarConfig() ? (
                        <p className="text-sm text-green-600">
                          ✅ Credentials are configured in code
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-orange-600">
                            ⚠️ Credentials not configured
                          </p>
                          <p className="text-sm">
                            Please update <code className="bg-gray-100 px-1 rounded">src/config/googleCalendar.ts</code>
                          </p>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Authentication Status */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {isAuthenticated ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Connected to Google Calendar</span>
                      </>
                    ) : (
                      <>
                        <CloudOff className="h-5 w-5 text-gray-400" />
                        <span>Not connected</span>
                      </>
                    )}
                  </div>
                  {isAuthenticated ? (
                    <Button variant="outline" size="sm" onClick={handleSignOut}>
                      Sign Out
                    </Button>
                  ) : (
                    <Button size="sm" onClick={handleAuthenticate}>
                      Connect
                    </Button>
                  )}
                </div>

                {/* Calendar Mappings */}
                {isAuthenticated && calendars.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Calendar Mappings</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAddCalendarMapping}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Calendar
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {settings.calendarMappings.map((mapping, index) => (
                        <Card key={index} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-3">
                                {/* Calendar Selection */}
                                <div>
                                  <Label className="text-xs">Google Calendar</Label>
                                  <Select
                                    value={mapping.calendarId}
                                    onValueChange={(value) =>
                                      handleUpdateCalendarMapping(index, 'calendarId', value)
                                    }
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue placeholder="Select calendar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {calendars.map((cal) => (
                                        <SelectItem key={cal.id} value={cal.id}>
                                          <div className="flex flex-col">
                                            <span>{cal.summary}</span>
                                            <span className="text-xs text-gray-500">{cal.id}</span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Family Member Selection */}
                                <div>
                                  <Label className="text-xs">Assign to Family Member</Label>
                                  <Select
                                    value={mapping.memberId}
                                    onValueChange={(value) =>
                                      handleUpdateCalendarMapping(index, 'memberId', value)
                                    }
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue placeholder="Select member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {familyMembers.map((member) => (
                                        <SelectItem key={member.id} value={member.id}>
                                          <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${member.color}`} />
                                            {member.name}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Calendar Email Display */}
                                {mapping.calendarEmail && (
                                  <div className="text-xs text-gray-500">
                                    📧 {mapping.calendarEmail}
                                  </div>
                                )}
                              </div>

                              {/* Remove Button */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveCalendarMapping(index)}
                                className="ml-2"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}

                      {settings.calendarMappings.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p>No calendars mapped yet</p>
                          <p className="text-sm">Click "Add Calendar" to start syncing</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sync Actions */}
                {isAuthenticated && settings.calendarMappings.length > 0 && (
                  <div className="space-y-2">
                    <Label>Manual Sync</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleSyncFromGoogle}
                        disabled={isSyncing}
                        className="flex-1"
                      >
                        <Cloud className="mr-2 h-4 w-4" />
                        Import from Google
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleSyncToGoogle}
                        disabled={isSyncing}
                        className="flex-1"
                      >
                        <Cloud className="mr-2 h-4 w-4" />
                        Export to Google
                      </Button>
                    </div>
                  </div>
                )}

                {/* Last Sync Time */}
                {settings.lastSyncTime && (
                  <div className="text-sm text-gray-500">
                    Last synced: {new Date(settings.lastSyncTime).toLocaleString()}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings}>Save Settings</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
