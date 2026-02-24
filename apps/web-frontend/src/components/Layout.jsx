import React from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { Shield } from 'lucide-react';

const Layout = ({ children, showSidebar = true }) => {
  if (!showSidebar) {
    return (
      <div className="min-h-screen bg-slate-900">
        {children}
      </div>
    );
  }

  const { user, token } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <Sidebar />
      <main className="flex-1 ml-72">
        <div className="p-8">
          {/* Admin Panel Button */}
          {user && user.role === 'admin' && token && (
            <div className="mb-4 flex justify-end">
              <a
                href={`http://localhost:5174?token=${encodeURIComponent(token)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 rounded-lg border border-slate-600 text-slate-200 hover:bg-slate-800 transition-colors"
                title="Open Admin Panel"
              >
                <Shield className="w-4 h-4 mr-2" />
                Go to Admin Panel
              </a>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
