import { useState } from 'react';
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
import { UserProfile } from '@/types/user';
import { signOut } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { Chrome, Mail, User, LogOut, Calendar, Shield } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface AccountSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile;
}

export function AccountSettingsDialog({
  open,
  onOpenChange,
  user,
}: AccountSettingsDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>
            Manage your account details and preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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
        </div>

        <DialogFooter>
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
