import React from 'react';
import { LogOut, Users, BookOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Course } from '../../types';

interface HeaderProps {
  courses: Course[];
  selectedCourseId: string | null;
  onCourseChange: (courseId: string | null) => void;
  onManageUsers?: () => void;
  onManageCourses?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  courses,
  selectedCourseId,
  onCourseChange,
  onManageUsers,
  onManageCourses
}) => {
  const { currentUser, userRole, userData, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo/Title */}
          <div>
            <h1 className="text-2xl font-bold text-primary">Question Manager</h1>
            <p className="text-sm text-neutral-600">
              {userData?.displayName || currentUser?.email}
            </p>
          </div>

          {/* Center - Course Selector */}
          <div className="flex-1 max-w-md mx-8">
            <select
              value={selectedCourseId || ''}
              onChange={(e) => onCourseChange(e.target.value || null)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Select course"
            >
              <option value="">All Courses</option>
              {courses.map(course => (
                <option key={course.courseId} value={course.courseId}>
                  {course.courseName}
                </option>
              ))}
            </select>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-3">
            {userRole === 'client_support' && (
              <>
                <button
                  onClick={onManageUsers}
                  className="px-4 py-2 bg-neutral-600 text-white rounded-lg hover:bg-neutral-700 flex items-center gap-2"
                >
                  <Users size={18} />
                  Manage Users
                </button>
                <button
                  onClick={onManageCourses}
                  className="px-4 py-2 bg-success text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <BookOpen size={18} />
                  Manage Courses
                </button>
              </>
            )}
            <button
              onClick={logout}
              className="px-4 py-2 bg-danger text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;