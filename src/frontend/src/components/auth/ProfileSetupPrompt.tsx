import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { User, X } from 'lucide-react';
import ProfileSetupModal from './ProfileSetupModal';

export default function ProfileSetupPrompt() {
  const [dismissed, setDismissed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <>
      <Alert className="mb-6 border-primary/50 bg-primary/5">
        <User className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between gap-4">
          <span className="flex-1">
            Complete your profile to help your team identify you. Your role will be assigned by an administrator.
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setModalOpen(true)}>
              Set up profile
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
      <ProfileSetupModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
