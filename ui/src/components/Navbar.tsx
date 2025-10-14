'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, User, FolderOpen } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Contextual Knowledge Base
              </h1>
            </Link>
            <nav className="flex gap-4">
              <Link
                href="/dashboard/projects"
                className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FolderOpen className="w-4 h-4" />
                Projects
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <User className="w-5 h-5" />
                <span>
                  {user.first_name} {user.last_name}
                </span>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
