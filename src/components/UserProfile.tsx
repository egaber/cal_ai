import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserProfile as UserProfileType } from '@/types/user';
import { signOut } from '@/services/authService';
import { LogOut, Settings, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AccountSettingsDialog } from './AccountSettingsDialog';

interface UserProfileProps {
  user: UserProfileType;
}

export function UserProfile({ user }: UserProfileProps) {
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { toast } = useToast();

  // Debug: Log user data in component
  console.log('UserProfile component received:', {
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  });

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully',
      });
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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 rounded-full border border-slate-200/80 bg-white p-1 pr-3 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
            <Avatar className="h-8 w-8">
              {user.photoURL ? (
                <AvatarImage 
                  src={user.photoURL} 
                  alt={user.displayName}
                  onError={(e) => {
                    console.error('Avatar image failed to load:', user.photoURL);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-semibold text-white">
                {getInitials(user.displayName)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium text-slate-700 dark:text-slate-200 sm:inline">
              {user.displayName}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{user.displayName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Account Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} disabled={loading}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>{loading ? 'Signing out...' : 'Sign out'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AccountSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        user={user}
      />
    </>
  );
}
