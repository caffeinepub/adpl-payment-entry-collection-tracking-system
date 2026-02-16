import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';

export default function LoginPage() {
  const { login, loginStatus, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    try {
      // Clear any stale data before login
      queryClient.clear();
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.message === 'User is already authenticated') {
        // Clear existing session and retry
        await clear();
        queryClient.clear();
        setTimeout(async () => {
          try {
            await login();
          } catch (retryError: any) {
            setError('Login failed. Please try again.');
          }
        }, 500);
      } else {
        setError('Login failed. Please try again or check your Internet Identity.');
      }
    }
  };

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to ADPL</CardTitle>
          <CardDescription>
            Payment Entry & Collection Tracking System
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <p className="text-sm text-muted-foreground text-center">
            Sign in with Internet Identity to access the system
          </p>
          
          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full"
            size="lg"
          >
            {isLoggingIn ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Sign In with Internet Identity
              </>
            )}
          </Button>

          <div className="text-xs text-muted-foreground text-center space-y-1 pt-2 border-t">
            <p className="font-medium">First time here?</p>
            <p>Internet Identity will create your account automatically.</p>
            <p className="text-orange-600 dark:text-orange-400 font-medium">
              Admin access must be granted by an existing administrator and cannot be self-assigned.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
