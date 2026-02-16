import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, FileText, BarChart3, Menu } from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import ProfileSetupPrompt from '../auth/ProfileSetupPrompt';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { identity, clear } = useInternetIdentity();
  const { userProfile, userRole, isFetched } = useCurrentUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: '/' });
  };

  const isAuthenticated = !!identity;
  const showProfilePrompt = isAuthenticated && isFetched && userProfile === null;

  const navItems = [
    ...(userRole === 'admin' ? [{ label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' }] : []),
    { label: 'Invoices', icon: FileText, path: '/invoices' },
    { label: 'Reports', icon: BarChart3, path: '/reports' },
  ];

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.path}
            onClick={() => {
              navigate({ to: item.path });
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent transition-colors"
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </button>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-primary">ADPL</h1>
              {identity && (
                <nav className="hidden md:flex items-center gap-2">
                  <NavLinks />
                </nav>
              )}
            </div>

            {identity && (
              <div className="flex items-center gap-4">
                {userProfile && (
                  <div className="hidden sm:block text-sm">
                    <p className="font-medium">{userProfile.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{userRole || 'user'}</p>
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={handleLogout} className="hidden md:flex">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="md:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <div className="flex flex-col gap-4 mt-8">
                      {userProfile && (
                        <div className="pb-4 border-b">
                          <p className="font-medium">{userProfile.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">{userRole || 'user'}</p>
                        </div>
                      )}
                      <nav className="flex flex-col gap-2">
                        <NavLinks />
                      </nav>
                      <Button variant="outline" onClick={handleLogout} className="mt-4">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {showProfilePrompt && <ProfileSetupPrompt />}
        {children}
      </main>

      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ADPL Distribution Management System
            </p>
            <p className="text-sm text-muted-foreground">
              Built with love using{' '}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
