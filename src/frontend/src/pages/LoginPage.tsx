import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message === 'User is already authenticated') {
        queryClient.clear();
        setTimeout(() => login(), 300);
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
                Sign In
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
