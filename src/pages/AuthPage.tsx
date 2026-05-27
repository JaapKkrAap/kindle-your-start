import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Mail, Lock, User, ShieldCheck, Play } from 'lucide-react';

const AUTH_PREVIEW_MODES = [
  { label: 'Romantic', description: 'Tender continuity and emotional attachment.', accent: '18 62% 54%' },
  { label: 'Spicy', description: 'Heightened tension after adult confirmation.', accent: '332 52% 48%' },
  { label: 'Explicit', description: 'Adult-only mode with provider safeguards.', accent: '352 58% 50%' },
];

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, signInAnonymously } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGuestAccess = async () => {
    setLoading(true);
    try {
      const { error } = await signInAnonymously();
      if (error) {
        toast({
          title: 'Guest access failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Welcome!',
          description: 'Logged in as guest.',
        });
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Sign in failed',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Welcome back!',
            description: 'Successfully signed in.',
          });
          navigate('/');
        }
      } else {
        const { error, data } = await signUp(email, password, displayName);
        if (error) {
          toast({
            title: 'Sign up failed',
            description: error.message,
            variant: 'destructive',
          });
        } else if (data.user && !data.session) {
          // Email confirmation required
          toast({
            title: 'Check your email',
            description: 'We sent you a confirmation link. Please check your inbox.',
          });
        } else {
          toast({
            title: 'Account created!',
            description: 'Welcome to the roleplay engine.',
          });
          navigate('/');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,1.05fr)_420px] lg:items-center">
        <div>
          <div className="mb-8">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Kindle Your Start
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
              Instant AI roleplay discovery for adult fictional characters, with advanced studio tools when you want deeper continuity.
            </p>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            <Badge className="border-primary/25 bg-primary/10 text-primary hover:bg-primary/10" variant="outline">
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
              18+ confirmation before adult discovery
            </Badge>
            <Badge variant="outline" className="border-border/70 text-muted-foreground">
              Guest-first onboarding
            </Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {AUTH_PREVIEW_MODES.map(mode => (
              <div key={mode.label} className="premium-card overflow-hidden">
                <div
                  className="flex aspect-[4/3] items-end p-4"
                  style={{
                    background: `linear-gradient(145deg, hsl(${mode.accent} / 0.92), hsl(222 24% 8%))`,
                  }}
                >
                  <div>
                    <Badge className="mb-2 bg-background/75 text-foreground hover:bg-background/75">
                      {mode.label}
                    </Badge>
                    <p className="font-semibold text-white">Discovery mode</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{mode.description}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-primary">
                    <Play className="h-3.5 w-3.5" />
                    Start after age gate
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle>{isLogin ? 'Welcome back' : 'Create account'}</CardTitle>
            <CardDescription>
              {isLogin
                ? 'Sign in to continue your adventures'
                : 'Start your roleplay journey today'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your character name"
                      className="bg-muted/50 pl-10"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="bg-muted/50 pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="bg-muted/50 pl-10"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full glow-primary"
                disabled={loading}
              >
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
              </Button>

              <Button
                type="button"
                onClick={handleGuestAccess}
                variant="outline"
                className="w-full border-border/70"
                disabled={loading}
              >
                Continue as Guest
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="font-medium text-primary hover:underline"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
