import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle } from 'lucide-react';

const LoginScreen: React.FC = () => {
  const { signInWithGoogle, loading, error, clearError } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Multi-Course Question Manager
          </h1>
          <p className="text-xl text-gray-600">
            نظام إدارة الأسئلة متعدد الدورات
          </p>
        </div>

        <p className="text-gray-600 text-center mb-8">
          Please sign in to access the admin panel
          <br />
          الرجاء تسجيل الدخول للوصول إلى لوحة التحكم
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-start gap-2">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-800 hover:text-red-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Loading...
            </>
          ) : (
            <>
              <span>🔐</span>
              Sign in with Google
            </>
          )}
        </button>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-semibold mb-2">
            ℹ️ Important Note / ملاحظة مهمة
          </p>
          <p className="text-xs text-blue-700">
            Your account must be registered by an administrator to access the system.
            <br />
            يجب أن يكون حسابك مسجلاً من قبل المسؤول للوصول إلى النظام.
          </p>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          © 2025 All Rights Reserved
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;