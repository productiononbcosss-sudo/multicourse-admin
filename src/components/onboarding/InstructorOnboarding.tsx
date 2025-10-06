import React from 'react';
import { BookOpen, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface InstructorOnboardingProps {
  userName: string;
  userEmail: string;
}

const InstructorOnboarding: React.FC<InstructorOnboardingProps> = ({
  userName,
  userEmail
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen size={32} />
            <h1 className="text-3xl font-bold">Welcome to MultiCourse Admin!</h1>
          </div>
          <p className="text-blue-100">We're excited to have you on board, {userName}!</p>
        </div>

        {/* Body */}
        <div className="px-8 py-8">
          {/* Status Alert */}
          <div className="mb-8 p-6 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
            <div className="flex items-start gap-3">
              <Clock className="text-yellow-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                  Account Pending Activation
                </h3>
                <p className="text-yellow-800 leading-relaxed">
                  Your instructor account has been created successfully, but it's currently pending activation. 
                  You won't be able to access courses or answer questions until a client support administrator 
                  assigns courses to your account.
                </p>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Account Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-gray-600 font-medium w-24">Name:</span>
                <span className="text-gray-900">{userName}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-600 font-medium w-24">Email:</span>
                <span className="text-gray-900">{userEmail}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-600 font-medium w-24">Role:</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  Instructor
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-600 font-medium w-24">Status:</span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                  Pending Activation
                </span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="text-green-600" size={24} />
              Next Steps
            </h3>
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </span>
                <div>
                  <p className="font-semibold text-gray-900">Contact Your Administrator</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Reach out to your client support team to request account activation and course assignments.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </span>
                <div>
                  <p className="font-semibold text-gray-900">Wait for Course Assignment</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Once activated, an administrator will assign specific courses to your account based on your expertise.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </span>
                <div>
                  <p className="font-semibold text-gray-900">Start Answering Questions</p>
                  <p className="text-gray-600 text-sm mt-1">
                    After activation, you'll be able to view and answer approved questions for your assigned courses.
                  </p>
                </div>
              </li>
            </ol>
          </div>

          {/* Info Box */}
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-1" size={20} />
              <div>
                <p className="text-sm text-blue-900 leading-relaxed">
                  <strong>Note:</strong> This page will automatically refresh once your account is activated. 
                  You can also try refreshing your browser periodically to check if your account has been activated.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
          <p className="text-center text-gray-600 text-sm">
            Need help? Contact your administrator or support team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InstructorOnboarding;
