import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Check, Loader2, Link2, Users, Baby } from 'lucide-react';
import { createFamily, joinFamily, Family } from '@/services/familyService';
import { UserProfile } from '@/types/user';

interface FamilySetupDialogProps {
  open: boolean;
  user: UserProfile;
  onComplete: (family: Family) => void;
  initialInviteCode?: string;
  initialRole?: 'parent' | 'child';
}

export const FamilySetupDialog = ({ open, user, onComplete, initialInviteCode, initialRole }: FamilySetupDialogProps) => {
  const [tab, setTab] = useState<'create' | 'join'>(initialInviteCode ? 'join' : 'create');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState(initialInviteCode || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdFamily, setCreatedFamily] = useState<Family | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedParentLink, setCopiedParentLink] = useState(false);
  const [copiedChildLink, setCopiedChildLink] = useState(false);

  // Auto-join if invite code is provided in URL
  useEffect(() => {
    if (initialInviteCode && open && !loading && !createdFamily) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        handleJoinFamily();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialInviteCode, open, createdFamily]);

  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      setError('Please enter a family name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const family = await createFamily(
        familyName.trim(),
        user.uid,
        user.displayName,
        user.photoURL
      );
      setCreatedFamily(family);
    } catch (err: any) {
      setError(err.message || 'Failed to create family');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async () => {
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Attempting to join with code:', inviteCode.trim().toUpperCase());
      const family = await joinFamily(
        inviteCode.trim().toUpperCase(),
        user.uid,
        user.displayName,
        user.photoURL
      );
      console.log('Successfully joined family:', family);
      onComplete(family);
    } catch (err: any) {
      console.error('Error joining family:', err);
      setError(err.message || 'Failed to join family');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInviteCode = () => {
    if (createdFamily?.inviteCode) {
      navigator.clipboard.writeText(createdFamily.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyParentLink = () => {
    if (createdFamily?.inviteCode) {
      const link = `${window.location.origin}/?invite=${createdFamily.inviteCode}&role=parent`;
      navigator.clipboard.writeText(link);
      setCopiedParentLink(true);
      setTimeout(() => setCopiedParentLink(false), 2000);
    }
  };

  const handleCopyChildLink = () => {
    if (createdFamily?.inviteCode) {
      const link = `${window.location.origin}/?invite=${createdFamily.inviteCode}&role=child`;
      navigator.clipboard.writeText(link);
      setCopiedChildLink(true);
      setTimeout(() => setCopiedChildLink(false), 2000);
    }
  };

  const handleCompleteSetup = () => {
    if (createdFamily) {
      onComplete(createdFamily);
    }
  };

  // Show success screen after family creation
  if (createdFamily) {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Family Created Successfully! 🎉</DialogTitle>
            <DialogDescription>
              Share this code with family members so they can join
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <Label htmlFor="code">Family Invite Code</Label>
                <div className="relative">
                  <Input
                    id="code"
                    value={createdFamily.inviteCode}
                    readOnly
                    className="pr-10 text-center text-2xl font-bold tracking-widest"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="absolute right-1 top-1"
                    onClick={handleCopyInviteCode}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Shareable Invite Links</Label>
              
              {/* Parent Link */}
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Parent / Adult</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}/?invite=${createdFamily.inviteCode}&role=parent`}
                    readOnly
                    className="text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCopyParentLink}
                  >
                    {copiedParentLink ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Child Link */}
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Baby className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Child</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}/?invite=${createdFamily.inviteCode}&role=child`}
                    readOnly
                    className="text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCopyChildLink}
                  >
                    {copiedChildLink ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <Alert>
              <Link2 className="h-4 w-4" />
              <AlertDescription>
                Share these links with family members. They'll be prompted to sign in and automatically join with the correct role.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button onClick={handleCompleteSetup} className="w-full">
              Continue to Calendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to Cal AI! 👋</DialogTitle>
          <DialogDescription>
            Let's set up your family calendar
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'create' | 'join')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Family</TabsTrigger>
            <TabsTrigger value="join">Join Family</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="familyName">Family Name</Label>
              <Input
                id="familyName"
                placeholder="The Smiths"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFamily()}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleCreateFamily}
              disabled={loading}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Family
            </Button>
          </TabsContent>

          <TabsContent value="join" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Family Invite Code</Label>
              <Input
                id="inviteCode"
                placeholder="ABC123"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinFamily()}
                className="text-center text-lg font-mono tracking-widest uppercase"
                maxLength={6}
              />
              <p className="text-sm text-muted-foreground">
                Ask a family member for the 6-character code
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleJoinFamily}
              disabled={loading}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Join Family
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
