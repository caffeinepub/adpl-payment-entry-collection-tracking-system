import { useState } from 'react';
import { useActor } from '../../hooks/useActor';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ProfileSetupModal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [role, setRole] = useState('user');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (!actor) {
      toast.error('System not ready');
      return;
    }

    setSaving(true);
    try {
      await actor.saveCallerUserProfile({ name: name.trim(), role });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile created successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome to ADPL</DialogTitle>
          <DialogDescription>
            Please set up your profile to continue
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Your Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="mt-1"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
