import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

export default function AccessDeniedScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate({ to: '/' })} className="w-full">
            Go to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
