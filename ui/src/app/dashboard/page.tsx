'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { CheckCircle } from 'lucide-react';

export default function DashboardPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome to Your Dashboard
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Hello, {user?.first_name}! You have successfully logged in.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h2 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Your Account Details
            </h2>
            <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <p>
                <strong>Email:</strong> {user?.email}
              </p>
              <p>
                <strong>Name:</strong> {user?.first_name} {user?.last_name}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
