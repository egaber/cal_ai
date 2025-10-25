import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserProfile } from '@/types/user';
import { FamilyMember } from '@/types/calendar';
import { signOut } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { Chrome, Mail, User, LogOut, Calendar, Shield, Users, Sparkles, MessageCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { FamilyManagement } from './FamilyManagement';
import { llmService, LLMModel } from '@/services/llmService';
import { modelConfigService } from '@/services/modelConfigService';
import { getGeminiApiKey, getAzureOpenAIApiKey } from '@/config/gemini';

interface AccountSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile;
  familyMembers?: FamilyMember[];
  onAddMember?: (member: Omit<FamilyMember, 'id'>) => void;
  onRemoveMember?: (memberId: string) => void;
}

export function AccountSettingsDialog({
  open,
  onOpenChange,
  user,
  familyMembers = [],
  onAddMember,
  onRemoveMember,
}: AccountSettingsDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // AI Model settings
  const [models, setModels] = useState<LLMModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<LLMModel | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [azureOpenAIApiKey, setAzureOpenAIApiKey] = useState('');

  // Load API keys and models
  useEffect(() => {
    if (open) {
      // Load API keys from config/localStorage
      const geminiKey = getGeminiApiKey();
      if (geminiKey) {
        setGeminiApiKey(geminiKey);
        llmService.setGeminiKey(geminiKey);
      }

      const azureKey = getAzureOpenAIApiKey();
      if (azureKey) {
        setAzureOpenAIApiKey(azureKey);
        llmService.setAzureOpenAIKey(azureKey);
      }

      loadModels();
    }
  }, [open]);

  const loadModels = async () => {
    const availableModels = await llmService.getAvailableModels();
    setModels(availableModels);
    
    // Get the current selected model from central config
    const currentModel = modelConfigService.findModel(availableModels);
    setSelectedModel(currentModel);
  };

  const handleSaveAISettings = () => {
    let saved = false;

    if (geminiApiKey) {
      localStorage.setItem('gemini_api_key', geminiApiKey);
      llmService.setGeminiKey(geminiApiKey);
      saved = true;
    }

    if (azureOpenAIApiKey) {
      localStorage.setItem('azure_openai_api_key', azureOpenAIApiKey);
      llmService.setAzureOpenAIKey(azureOpenAIApiKey);
      saved = true;
    }

    if (selectedModel) {
      modelConfigService.setSelectedModel(selectedModel);
      saved = true;
    }

    if (saved) {
      toast({
        title: 'AI Settings saved',
        description: 'Your AI model preferences have been saved.',
      });
      loadModels(); // Reload to update available models
    }
  };

  const handleOpenWhatsApp = () => {
    const phoneNumber = '14155238886';
    const message = 'join knowledge-dog';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully',
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error signing out',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const isGoogleAccount = user.photoURL && user.photoURL.includes('googleusercontent.com');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>
            Manage your account details, family members, AI models, and preferences
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="account">
              <User className="h-4 w-4 mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger value="family">
              <Users className="h-4 w-4 mr-2" />
              Family
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Models
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6 mt-6">
          {/* Profile Photo */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
              <AvatarImage src={user.photoURL} alt={user.displayName} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-2xl font-semibold text-white">
                {getInitials(user.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {user.displayName}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {user.email}
              </p>
            </div>
          </div>

          <Separator />

          {/* Account Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Account Information
            </h4>

            {/* Email */}
            <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <Mail className="mt-0.5 h-4 w-4 text-slate-500" />
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Email Address
                </p>
                <p className="text-sm text-slate-900 dark:text-slate-100">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Account Type */}
            <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              {isGoogleAccount ? (
                <Chrome className="mt-0.5 h-4 w-4 text-blue-600" />
              ) : (
                <Shield className="mt-0.5 h-4 w-4 text-slate-500" />
              )}
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Sign-In Method
                </p>
                <p className="text-sm text-slate-900 dark:text-slate-100">
                  {isGoogleAccount ? (
                    <span className="flex items-center gap-2">
                      Google Account
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        Connected
                      </span>
                    </span>
                  ) : (
                    'Email & Password'
                  )}
                </p>
              </div>
            </div>

            {/* Member Since */}
            <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <Calendar className="mt-0.5 h-4 w-4 text-slate-500" />
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Member Since
                </p>
                <p className="text-sm text-slate-900 dark:text-slate-100">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Last Login */}
            <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <User className="mt-0.5 h-4 w-4 text-slate-500" />
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Last Login
                </p>
                <p className="text-sm text-slate-900 dark:text-slate-100">
                  {new Date(user.lastLoginAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  at{' '}
                  {new Date(user.lastLoginAt).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>

          <Separator />

            {/* Actions */}
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  toast({
                    title: 'Coming soon',
                    description: 'Profile editing will be available soon',
                  });
                }}
              >
                <User className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="family" className="mt-6">
            {onAddMember && onRemoveMember ? (
              <FamilyManagement
                members={familyMembers}
                onAddMember={onAddMember}
                onRemoveMember={onRemoveMember}
                currentUser={user}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Family management not available
              </div>
            )}
          </TabsContent>

          <TabsContent value="ai" className="mt-6 space-y-6">
            {/* WhatsApp Connection Section */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
              <div className="flex items-center gap-3 mb-4">
                <MessageCircle className="w-6 h-6 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">WhatsApp Connection</h2>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Connect to our WhatsApp to receive updates and notifications directly on your phone
              </p>

              <button
                onClick={handleOpenWhatsApp}
                className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Open in WhatsApp</span>
              </button>

              <p className="text-xs text-gray-500 mt-3 text-center">
                Will send message to +1 (415) 523-8886
              </p>
            </div>

            <Separator />

            {/* Model Selection Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">AI Model Selection</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model-select">Selected Model</Label>
                <Select
                  value={selectedModel?.id || ''}
                  onValueChange={(value) => {
                    const model = models.find(m => m.id === value);
                    if (model) {
                      setSelectedModel(model);
                    }
                  }}
                >
                  <SelectTrigger id="model-select" className="w-full">
                    <SelectValue placeholder="Select an AI model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No models available - configure API keys below
                      </SelectItem>
                    ) : (
                      models.map((model) => (
                        <SelectItem key={`${model.provider}-${model.id}`} value={model.id}>
                          {model.name} ({model.vendor})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Default priority: VS Code LM API (Copilot) → Azure GPT-4.1
                </p>
              </div>

              <Separator />

              {/* API Keys Configuration */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-700">API Configuration</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="gemini-key">Gemini API Key (Optional)</Label>
                  <Input
                    id="gemini-key"
                    type="password"
                    placeholder="Enter your Gemini API key"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your API key from{' '}
                    <a
                      href="https://makersuite.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Google AI Studio
                    </a>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="azure-openai-key">Azure OpenAI API Key (Optional)</Label>
                  <Input
                    id="azure-openai-key"
                    type="password"
                    placeholder="Enter your Azure OpenAI API key"
                    value={azureOpenAIApiKey}
                    onChange={(e) => setAzureOpenAIApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    For Azure models: GPT-4.1, GPT-5 Mini, Grok 4, O3 Mini
                  </p>
                </div>

                <Button onClick={handleSaveAISettings} className="w-full">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Save AI Settings
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Close
          </Button>
          <Button
            variant="destructive"
            onClick={handleSignOut}
            disabled={loading}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {loading ? 'Signing out...' : 'Sign Out'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
