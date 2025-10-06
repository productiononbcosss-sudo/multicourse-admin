import React, { useState, useMemo } from "react";
import { Filter, Trash2, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useQuestions } from "../../hooks/useQuestions";
import { useCourses } from "../../hooks/useCourses";
import { useModal } from "../../hooks/useModal";
import Header from "./Header";
import QuestionCard from "../questions/QuestionCard";
import UserManagement from "../users/UserManagement";
import CourseManagement from "../courses/CourseManagement";
import Modal from "../common/Modal";
import { FilterType } from "../../types";

const ClientDashboard: React.FC = () => {
  const { userData, currentUser } = useAuth();
  const { courses } = useCourses();
  const userCourses =
    userData?.role === "client_support" ? [] : userData?.assignedCourses || [];
  const { questions, loading, approveQuestion, deleteQuestion } =
    useQuestions(userCourses);
  const { modalState, showSuccess, showError, showWarning, showConfirm, closeModal } = useModal();

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterType>("all");
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(
    new Set()
  );
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showCourseManagement, setShowCourseManagement] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // MOVE ALL useMemo HOOKS HERE - BEFORE EARLY RETURNS
  // Filter questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (selectedCourseId && q.courseId !== selectedCourseId) return false;
      if (filterStatus !== "all" && q.status !== filterStatus) return false;
      return true;
    });
  }, [questions, selectedCourseId, filterStatus]);

  // Statistics
  const stats = useMemo(() => {
  const filtered = selectedCourseId
    ? questions.filter(q => q.courseId === selectedCourseId)
    : questions;

  return {
    total: filtered.length,
    pending: filtered.filter(q => q.status === 'pending').length,
    approved: filtered.filter(q => q.status === 'approved').length,
    answered: filtered.filter(q => q.status === 'answered').length
  };
}, [questions, selectedCourseId]); // Remove userData dependency

  // Manual refresh function
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleApprove = async (questionId: string | undefined) => {
    // Use currentUser.uid as primary, fallback to userData.uid
    const userId = currentUser?.uid || userData?.uid;
    
    if (!userId) {
      console.error("Authentication check failed:", { 
        currentUser: currentUser ? {
          uid: currentUser.uid,
          email: currentUser.email
        } : null,
        userData: userData ? {
          uid: userData.uid,
          email: userData.email,
          role: userData.role
        } : null
      });
      showError("Authentication Error", "Not authenticated. Please refresh the page and try again.");
      return;
    }

    if (!questionId) {
      showError("Invalid Question", "Invalid question ID");
      return;
    }

    console.log("Approving question:", questionId, "by user:", userId);

    try {
      await approveQuestion(questionId, userId);
      showSuccess("Success!", "Question approved successfully!");
    } catch (err) {
      console.error("Approve error:", err);
      showError("Approval Failed", "Failed to approve: " + (err as Error).message);
    }
  };

  const handleDelete = async (questionId: string | undefined) => {
    if (!questionId) {
      showError("Invalid Question", "Invalid question ID");
      return;
    }

    showConfirm(
      "Delete Question",
      "Are you sure you want to delete this question? This action cannot be undone.",
      async () => {
        try {
          await deleteQuestion(questionId);
          showSuccess("Deleted", "Question deleted successfully!");
        } catch (err) {
          console.error("Error deleting question:", err);
          showError("Delete Failed", "Failed to delete question: " + (err as Error).message);
        }
      },
      { confirmText: "Yes, Delete", cancelText: "Cancel" }
    );
  };

  const handleBulkDelete = async () => {
    if (selectedQuestions.size === 0) return;
    
    showConfirm(
      "Delete Multiple Questions",
      `Are you sure you want to delete ${selectedQuestions.size} selected questions? This action cannot be undone.`,
      async () => {
        // Fix: Convert Set to Array
        const questionIds = Array.from(selectedQuestions);
        let successCount = 0;
        let errorCount = 0;
        
        for (const questionId of questionIds) {
          try {
            await deleteQuestion(questionId);
            successCount++;
          } catch (err) {
            console.error("Error deleting question:", err);
            errorCount++;
          }
        }
        
        setSelectedQuestions(new Set());
        
        if (errorCount === 0) {
          showSuccess("Success!", `Successfully deleted ${successCount} questions.`);
        } else {
          showWarning("Partial Success", `Deleted ${successCount} questions. Failed to delete ${errorCount} questions.`);
        }
      },
      { confirmText: "Yes, Delete All", cancelText: "Cancel" }
    );
  };

  const toggleQuestionSelection = (questionId: string) => {
    const newSelection = new Set(selectedQuestions);
    if (newSelection.has(questionId)) {
      newSelection.delete(questionId);
    } else {
      newSelection.add(questionId);
    }
    setSelectedQuestions(newSelection);
  };

  // NOW SAFE TO HAVE EARLY RETURNS (after all hooks)
  if (showUserManagement) {
    return (
      <UserManagement
        courses={courses}
        onClose={() => setShowUserManagement(false)}
      />
    );
  }

  if (showCourseManagement) {
    return (
      <CourseManagement
        courses={courses}
        onClose={() => setShowCourseManagement(false)}
        onRefresh={() => {
          setShowCourseManagement(false);
        }}
      />
    );
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
      
      <div className="min-h-screen bg-neutral-50">
        <Header
          courses={courses}
          selectedCourseId={selectedCourseId}
          onCourseChange={setSelectedCourseId}
          onManageUsers={() => setShowUserManagement(true)}
          onManageCourses={() => setShowCourseManagement(true)}
        />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-neutral-600">Total Questions</p>
            <p className="text-3xl font-bold text-neutral-800">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-neutral-600">Pending</p>
            <p className="text-3xl font-bold text-warning">{stats.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-neutral-600">Approved</p>
            <p className="text-3xl font-bold text-primary">{stats.approved}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-neutral-600">Answered</p>
            <p className="text-3xl font-bold text-success">{stats.answered}</p>
          </div>
        </div>

        {/* Filter Bar with Refresh Button */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex items-center gap-4">
            <Filter size={20} className="text-neutral-600" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterType)}
              className="px-4 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="answered">Answered</option>
            </select>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-neutral-600 text-white rounded hover:bg-neutral-700 flex items-center gap-2 disabled:opacity-50"
              title="Refresh questions"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            {selectedQuestions.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="ml-auto px-4 py-2 bg-danger text-white rounded hover:bg-red-700 flex items-center gap-2"
              >
                <Trash2 size={18} />
                Delete Selected ({selectedQuestions.size})
              </button>
            )}
          </div>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-neutral-600">Loading questions...</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <AlertCircle className="mx-auto mb-4 text-neutral-400" size={48} />
            <p className="text-neutral-600">No questions found</p>
          </div>
        ) : (
          <div className="space-y-4">
           {filteredQuestions.map(question => {
  const course = courses.find(c => c.courseId === question.courseId);
  const questionId = question.firestoreDocId;
  
  if (!questionId) return null; // Skip if no ID
  
  return (
    <div key={questionId} className="flex items-start gap-3">
      <input
        type="checkbox"
        checked={selectedQuestions.has(questionId)}
        onChange={() => toggleQuestionSelection(questionId)}
        className="mt-4 w-5 h-5 rounded border-neutral-300"
      />
      <div className="flex-1">
        <QuestionCard
          question={question}
          courseStructure={course?.courseStructure || {}}
          userRole="client_support"
          onApprove={() => handleApprove(questionId)}
          onDelete={() => handleDelete(questionId)}
        />
      </div>
    </div>
  );
})}
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default ClientDashboard;
