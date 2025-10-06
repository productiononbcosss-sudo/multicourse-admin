import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, CheckCircle, XCircle, Users } from 'lucide-react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Course } from '../../types';
import { useModal } from '../../hooks/useModal';
import Modal from '../common/Modal';
import CourseEditor from './CourseEditor';

interface CourseManagementProps {
  courses: Course[];
  onClose: () => void;
  onRefresh: () => void;
}

const CourseManagement: React.FC<CourseManagementProps> = ({ courses, onClose, onRefresh }) => {
  const [showEditor, setShowEditor] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { modalState, showSuccess, showError, showConfirm, closeModal } = useModal();

  const handleCreateCourse = () => {
    setEditingCourse(null);
    setShowEditor(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setShowEditor(true);
  };

  const handleDeleteCourse = async (courseId: string, courseName: string) => {
    showConfirm(
      "Delete Course",
      `Are you sure you want to delete "${courseName}"?\n\nThis will NOT delete associated questions, but instructors will lose access to them.`,
      async () => {
        setDeleting(courseId);
        try {
          await deleteDoc(doc(db, 'courses', courseId));
          onRefresh();
          showSuccess("Deleted", `Course "${courseName}" deleted successfully!`);
        } catch (err) {
          console.error('Error deleting course:', err);
          showError("Delete Failed", "Failed to delete course. Please try again.");
        } finally {
          setDeleting(null);
        }
      },
      { confirmText: "Yes, Delete", cancelText: "Cancel" }
    );
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingCourse(null);
    onRefresh();
  };

  if (showEditor) {
    return <CourseEditor course={editingCourse} onClose={handleCloseEditor} />;
  }

  return (
    <>
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        showCancel={modalState.showCancel}
      />
      
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-primary text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Course Management</h2>
          <button
            onClick={onClose}
            className="hover:bg-white hover:bg-opacity-20 rounded p-1"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Create Course Button */}
          <button
            onClick={handleCreateCourse}
            className="mb-4 px-4 py-2 bg-primary text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Create New Course
          </button>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map(course => (
              <div
                key={course.courseId}
                className="border border-neutral-300 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Course Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-800">
                      {course.courseName}
                    </h3>
                    <p className="text-sm text-neutral-500">
                      ID: {course.courseId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {course.active ? (
                      <CheckCircle className="text-success" size={20} />
                    ) : (
                      <XCircle className="text-danger" size={20} />
                    )}
                  </div>
                </div>

                {/* Course Stats */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-neutral-50 p-2 rounded">
                    <p className="text-xs text-neutral-600">Chapters</p>
                    <p className="text-lg font-semibold text-neutral-800">
                      {Object.keys(course.courseStructure || {}).length}
                    </p>
                  </div>
                  <div className="bg-neutral-50 p-2 rounded">
                    <p className="text-xs text-neutral-600">Instructors</p>
                    <p className="text-lg font-semibold text-neutral-800 flex items-center gap-1">
                      <Users size={16} />
                      {course.instructorIds?.length || 0}
                    </p>
                  </div>
                </div>

                {/* Telegram Status */}
                <div className="mb-3">
                  <p className="text-xs text-neutral-600 mb-1">Telegram Integration</p>
                  {course.telegramBotToken && course.telegramChannelId ? (
                    <span className="text-xs px-2 py-1 bg-success bg-opacity-20 text-success rounded">
                      ✓ Configured
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 bg-warning bg-opacity-20 text-warning rounded">
                      ⚠ Not Configured
                    </span>
                  )}
                </div>

                {/* Auto-Created Badge */}
                {course.autoCreated && (
                  <div className="mb-3">
                    <span className="text-xs px-2 py-1 bg-neutral-200 text-neutral-700 rounded">
                      Auto-Created
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-neutral-200">
                  <button
                    onClick={() => handleEditCourse(course)}
                    className="flex-1 px-3 py-2 bg-primary text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.courseId, course.courseName)}
                    disabled={deleting === course.courseId}
                    className="px-3 py-2 bg-danger text-white rounded hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                    {deleting === course.courseId ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {courses.length === 0 && (
            <div className="text-center py-12 text-neutral-500">
              <p className="mb-2">No courses found.</p>
              <p className="text-sm">Create your first course or wait for auto-creation from Storyline.</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
};

export default CourseManagement;