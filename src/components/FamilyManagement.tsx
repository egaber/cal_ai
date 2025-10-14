import { useState } from 'react';
import { FamilyMember } from '@/types/calendar';
import { UserProfile } from '@/types/user';
import { UserPlus, Copy, Check, Users, Smartphone, X, Link2, Baby } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useFamily } from '@/contexts/FamilyContext';

interface FamilyManagementProps {
  members: FamilyMember[];
  onAddMember: (member: Omit<FamilyMember, 'id'>) => void;
  onRemoveMember: (memberId: string) => void;
  currentUser?: UserProfile;
}

export const FamilyManagement = ({
  members,
  onAddMember,
  onRemoveMember,
  currentUser,
}: FamilyManagementProps) => {
  const { toast } = useToast();
  const { family } = useFamily();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'parent' | 'child'>('parent');
  const [newMemberAge, setNewMemberAge] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedParentLink, setCopiedParentLink] = useState(false);
  const [copiedChildLink, setCopiedChildLink] = useState(false);

  const handleCopyCode = () => {
    if (family?.inviteCode) {
      navigator.clipboard.writeText(family.inviteCode);
      setCopied(true);
      toast({
        title: "Code Copied!",
        description: "Family invite code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyParentLink = () => {
    if (family?.inviteCode) {
      const link = `${window.location.origin}/?invite=${family.inviteCode}&role=parent`;
      navigator.clipboard.writeText(link);
      setCopiedParentLink(true);
      toast({
        title: "Parent Link Copied!",
        description: "Share this link with adults",
      });
      setTimeout(() => setCopiedParentLink(false), 2000);
    }
  };

  const handleCopyChildLink = () => {
    if (family?.inviteCode) {
      const link = `${window.location.origin}/?invite=${family.inviteCode}&role=child`;
      navigator.clipboard.writeText(link);
      setCopiedChildLink(true);
      toast({
        title: "Child Link Copied!",
        description: "Share this link with children",
      });
      setTimeout(() => setCopiedChildLink(false), 2000);
    }
  };

  const handleAddMember = () => {
    if (!newMemberName.trim() || !newMemberAge) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const age = parseFloat(newMemberAge);
    if (isNaN(age) || age <= 0) {
      toast({
        title: "Invalid Age",
        description: "Please enter a valid age",
        variant: "destructive",
      });
      return;
    }

    // Automatically set isMobile based on age and role
    const isMobile = newMemberRole === 'parent' || age >= 18;

    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-green-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500',
    ];
    const usedColors = members.map(m => m.color);
    const availableColor = colors.find(c => !usedColors.includes(c)) || colors[0];

    onAddMember({
      name: newMemberName.trim(),
      role: newMemberRole,
      age,
      isMobile,
      color: availableColor,
    });

    // Reset form
    setNewMemberName('');
    setNewMemberAge('');
    setNewMemberRole('parent');
    setIsAddDialogOpen(false);

    toast({
      title: "Member Added",
      description: `${newMemberName} has been added to the family`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Invite Code Section */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Invite Family Members</h3>
        </div>
        
        {family?.inviteCode ? (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Share this code with family members so they can join your family calendar
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Family Invite Code</Label>
              <div className="flex gap-2">
                <Input 
                  value={family.inviteCode} 
                  readOnly 
                  className="flex-1 text-center text-2xl font-bold tracking-widest font-mono"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyCode}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                New members can join by entering this code when they sign in
              </p>
            </div>

            <Separator />

            {/* Shareable Links */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Shareable Invite Links
              </Label>
              
              {/* Parent Link */}
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Parent / Adult</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}/?invite=${family.inviteCode}&role=parent`}
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
                    value={`${window.location.origin}/?invite=${family.inviteCode}&role=child`}
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

              <p className="text-xs text-muted-foreground">
                Share these links and they'll automatically join with the correct role
              </p>
            </div>
          </div>
        ) : (
          <Alert>
            <AlertDescription>
              No family invite code available. Please contact support.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Current Members Section */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Family Members</h3>
            <Badge variant="secondary">{members.length}</Badge>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Family Member</DialogTitle>
                <DialogDescription>
                  Add a new member to your family calendar
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter name"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={newMemberRole} 
                    onValueChange={(value: 'parent' | 'child') => setNewMemberRole(value)}
                  >
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="child">Child</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Enter age"
                    value={newMemberAge}
                    onChange={(e) => setNewMemberAge(e.target.value)}
                    min="0"
                    step="0.5"
                  />
                  <p className="text-xs text-muted-foreground">
                    Mobile access is automatically set based on role and age (18+)
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMember}>Add Member</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3"
            >
              <div className={`h-10 w-10 rounded-full ${member.color} flex items-center justify-center text-white font-semibold`}>
                {member.name[0].toUpperCase()}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{member.name}</span>
                  {member.isYou && (
                    <Badge variant="secondary" className="text-xs">You</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="capitalize">{member.role}</span>
                  <span>•</span>
                  <span>{member.age} years old</span>
                  <span>•</span>
                  {member.isMobile ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <Smartphone className="h-3 w-3" />
                      Mobile
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-orange-600">
                      <X className="h-3 w-3" />
                      No Mobile
                    </span>
                  )}
                </div>
              </div>

              {!member.isYou && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (window.confirm(`Remove ${member.name} from the family?`)) {
                      onRemoveMember(member.id);
                      toast({
                        title: "Member Removed",
                        description: `${member.name} has been removed`,
                      });
                    }
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
