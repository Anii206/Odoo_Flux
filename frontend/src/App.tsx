import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/common/Navbar';
import { NotificationBanner } from './components/common/NotificationBanner';
import { OutboxDrawer } from './components/common/OutboxDrawer';
import { DevTimeTravelToolbar } from './components/common/DevTimeTravelToolbar';
import { CommandPalette } from './components/common/CommandPalette';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuthSession, useNotification } from './hooks';
import { setToken } from './api';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AdminPage } from './pages/AdminPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { PortalPage } from './pages/PortalPage';
import { FinancePage } from './pages/FinancePage';

const AppContent: React.FC = () => {
  const { notification, notify, clearNotification } = useNotification();
  const { currentUser, setCurrentUser, logout, loading } = useAuthSession(notify);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('brightloop_theme') as 'dark' | 'light') || 'dark';
  });
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('brightloop_theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLoginSuccess = (token: string, user: any) => {
    setToken(token);
    setCurrentUser(user);
    notify(`Welcome back, ${user.email} (${user.role})!`, 'success');
  };

  return (
    <div className="min-h-screen bg-black text-[#EDEDED] dark:bg-black dark:text-[#EDEDED] flex flex-col font-sans selection:bg-white selection:text-black antialiased overflow-x-hidden w-full">
      <Navbar
        user={currentUser}
        onLogout={logout}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />
      <NotificationBanner notification={notification} onDismiss={clearNotification} />

      <main className="flex-1 w-full pb-20">
        <Routes>
          <Route path="/login" element={<LoginPage user={currentUser} onLoginSuccess={handleLoginSuccess} onError={(m) => notify(m, 'error')} onSuccess={(m) => notify(m, 'success')} />} />
          <Route path="/signup" element={<SignupPage onLoginSuccess={handleLoginSuccess} onError={(m) => notify(m, 'error')} onSuccess={(m) => notify(m, 'success')} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage onError={(m) => notify(m, 'error')} onSuccess={(m) => notify(m, 'success')} />} />
          <Route path="/reset-password" element={<ResetPasswordPage onError={(m) => notify(m, 'error')} onSuccess={(m) => notify(m, 'success')} />} />

          <Route path="/admin/*" element={<ProtectedRoute user={currentUser} loading={loading} allowedRoles={['admin']}><AdminPage onSuccess={(m) => notify(m, 'success')} onError={(m) => notify(m, 'error')} /></ProtectedRoute>} />
          <Route path="/workspace/*" element={<ProtectedRoute user={currentUser} loading={loading} allowedRoles={['admin', 'staff']}><WorkspacePage onSuccess={(m) => notify(m, 'success')} onError={(m) => notify(m, 'error')} /></ProtectedRoute>} />
          <Route path="/finance/*" element={<ProtectedRoute user={currentUser} loading={loading} allowedRoles={['admin', 'staff']}><FinancePage onSuccess={(m) => notify(m, 'success')} onError={(m) => notify(m, 'error')} /></ProtectedRoute>} />
          <Route path="/portal/*" element={<ProtectedRoute user={currentUser} loading={loading} allowedRoles={['customer']}><PortalPage onSuccess={(m) => notify(m, 'success')} onError={(m) => notify(m, 'error')} /></ProtectedRoute>} />

          <Route
            path="/"
            element={
              !currentUser ? (
                <Navigate to="/login" replace />
              ) : currentUser.role === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : currentUser.role === 'staff' ? (
                <Navigate to="/workspace" replace />
              ) : (
                <Navigate to="/portal" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {import.meta.env.DEV && <OutboxDrawer />}
      {import.meta.env.DEV && (
        <DevTimeTravelToolbar
          currentUser={currentUser}
          onRoleSwitch={handleLoginSuccess}
          onSuccess={(m) => notify(m, 'success')}
          onError={(m) => notify(m, 'error')}
        />
      )}
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} onNotify={notify} />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
