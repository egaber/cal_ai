import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  storeFaceDescriptor,
} from '@/services/authService';
import {
  startVideoStream,
  stopVideoStream,
  findUserByFace,
  extractFaceDescriptor,
  loadModels,
} from '@/services/faceRecognitionService';
import { UserProfile } from '@/types/user';
import { Loader2, Camera, Chrome, Mail, User } from 'lucide-react';
import { APP_ICON, APP_NAME, APP_TAGLINE } from '@/config/branding';

interface WelcomeProps {
  onAuthenticated: (user: UserProfile) => void;
}

export default function Welcome({ onAuthenticated }: WelcomeProps) {
  const [loading, setLoading] = useState(false);
  const [faceAuthMode, setFaceAuthMode] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [faceModelsLoaded, setFaceModelsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  // Email/Password sign in state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Check for invite code in URL and default to signup tab
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get('invite');
    if (inviteCode) {
      setActiveTab('signup');
    }
  }, []);

  // Load face recognition models on mount
  useEffect(() => {
    loadModels()
      .then(() => setFaceModelsLoaded(true))
      .catch((error) => {
        console.error('Failed to load face recognition models:', error);
      });
  }, []);

  // Cleanup video stream on unmount
  useEffect(() => {
    return () => {
      if (videoStream) {
        stopVideoStream(videoStream);
      }
    };
  }, [videoStream]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      toast({
        title: 'Welcome!',
        description: `Signed in as ${user.displayName}`,
      });
      onAuthenticated(user);
    } catch (error: any) {
      toast({
        title: 'Sign in failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await signInWithEmail(email, password);
      toast({
        title: 'Welcome back!',
        description: `Signed in as ${user.displayName}`,
      });
      onAuthenticated(user);
    } catch (error: any) {
      // Check if error is user-not-found or invalid-credential
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        toast({
          title: 'Account not found',
          description: 'Switching to Sign Up. Please create an account.',
        });
        setActiveTab('signup');
      } else {
        toast({
          title: 'Sign in failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await signUpWithEmail(email, password, displayName);
      toast({
        title: 'Account created!',
        description: `Welcome, ${user.displayName}`,
      });
      onAuthenticated(user);
    } catch (error: any) {
      toast({
        title: 'Sign up failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const startFaceAuth = async () => {
    if (!faceModelsLoaded) {
      toast({
        title: 'Please wait',
        description: 'Face recognition models are still loading...',
      });
      return;
    }

    setFaceAuthMode(true);
    setLoading(true);

    try {
      if (videoRef.current) {
        const stream = await startVideoStream(videoRef.current);
        setVideoStream(stream);

        // Wait for video to be ready
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = resolve;
          }
        });

        setLoading(false);
      }
    } catch (error: any) {
      toast({
        title: 'Camera access denied',
        description: 'Please allow camera access to use face recognition',
        variant: 'destructive',
      });
      setFaceAuthMode(false);
      setLoading(false);
    }
  };

  const stopFaceAuth = () => {
    if (videoStream) {
      stopVideoStream(videoStream);
      setVideoStream(null);
    }
    setFaceAuthMode(false);
  };

  const handleFaceRecognition = async () => {
    if (!videoRef.current || !videoStream) return;

    setLoading(true);
    try {
      const result = await findUserByFace(videoRef.current);

      if (result.success && result.userId) {
        // Successfully recognized user
        const { getCurrentUser } = await import('@/services/authService');
        const user = await getCurrentUser();
        
        if (user) {
          toast({
            title: 'Face recognized!',
            description: `Welcome back, ${user.displayName}`,
          });
          stopFaceAuth();
          onAuthenticated(user);
        }
      } else {
        toast({
          title: 'Face not recognized',
          description: result.error || 'Please try again or use another sign-in method',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Recognition failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const registerFace = async () => {
    if (!videoRef.current || !videoStream) return;

    setLoading(true);
    try {
      const descriptor = await extractFaceDescriptor(videoRef.current);

      if (!descriptor) {
        toast({
          title: 'No face detected',
          description: 'Please position your face in the camera',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // For now, show a message that they need to sign up first
      toast({
        title: 'Face captured!',
        description: 'Please sign up with email first, then you can register your face',
      });
      stopFaceAuth();
    } catch (error: any) {
      toast({
        title: 'Face registration failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (faceAuthMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Face Recognition Sign In</CardTitle>
            <CardDescription>
              Position your face in the camera for recognition
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleFaceRecognition}
                disabled={loading}
                className="flex-1"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Recognize Face
              </Button>
              <Button onClick={stopFaceAuth} variant="outline">
                Cancel
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              New user? Click "Recognize Face" to check, then sign up with email if not found
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <img src="pandai.png" alt="Panda AI" className="h-32 w-32 mx-auto object-contain" />
          </div>
          <CardTitle className="text-2xl">Welcome to {APP_NAME}</CardTitle>
          <CardDescription>
            {APP_TAGLINE}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <Button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Chrome className="mr-2 h-4 w-4" />
                )}
                Sign in with Google
              </Button>

              <Button
                onClick={startFaceAuth}
                disabled={loading || !faceModelsLoaded}
                className="w-full"
                variant="outline"
              >
                <Camera className="mr-2 h-4 w-4" />
                Sign in with Face Recognition
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Mail className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <Button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Chrome className="mr-2 h-4 w-4" />
                )}
                Sign up with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or create account with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <User className="mr-2 h-4 w-4" />
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
