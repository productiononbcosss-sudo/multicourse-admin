import React, { useState, useMemo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuestions } from '../../hooks/useQuestions';
import { useCourses } from '../../hooks/useCourses';
import { postToTelegram, getLessonInfo } from '../../services/telegram';
import Header from './Header';
import QuestionCard from '../questions/QuestionCard';

const InstructorDashboard: React.FC = () => {
  const { userData, currentUser } = useAuth();
  const { courses } = useCourses();
  const userCourses = userData?.assignedCourses || [];
  const { questions, loading, error, answerQuestion } = useQuestions(userCourses);

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Manual refresh function
  const handleRefresh = () => {
    setRefreshing(true);
    // Firebase real-time listeners will auto-update, so just show visual feedback
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Filter approved questions only
  const approvedQuestions = useMemo(() => {
    return questions.filter(q => {
      if (q.status !== 'approved') return false;
      if (selectedCourseId && q.courseId !== selectedCourseId) return false;
      return true;
    });
  }, [questions, selectedCourseId]);

  // Statistics for instructor
  const stats = useMemo(() => {
    const filtered = selectedCourseId
      ? questions.filter(q => q.courseId === selectedCourseId)
      : questions;

    return {
      approved: filtered.filter(q => q.status === 'approved').length,
      answered: filtered.filter(q => q.status === 'answered').length,
      myAnswered: filtered.filter(q => q.status === 'answered' && q.answeredBy === userData?.uid).length
    };
  }, [questions, selectedCourseId, userData?.uid]);

  const handleAnswer = async (
    questionId: string,
    answer: string,
    courseId: string
  ) => {
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
      alert("Not authenticated. Please refresh the page and try again.");
      return;
    }

    try {
      const question = questions.find(q => q.id === questionId || q.firestoreDocId === questionId);
      if (!question) throw new Error('Question not found');

      const course = courses.find(c => c.courseId === courseId);
      if (!course) throw new Error('Course not found');

      // Check if Telegram is configured
      if (course.telegramBotToken && course.telegramChannelId) {
        const lessonInfo = getLessonInfo(
          course.courseStructure,
          question.chapterNumber,
          question.lessonNumber
        );

        // Post to Telegram
        const messageId = await postToTelegram(
          course.telegramBotToken,
          course.telegramChannelId,
          question,
          answer,
          lessonInfo
        );

        // Save answer with Telegram message ID
        await answerQuestion(questionId, answer, userId, messageId);
      } else {
        // Save answer without Telegram
        await answerQuestion(questionId, answer, userId);
      }
    } catch (err: any) {
      console.error('Error answering question:', err);
      alert(`Failed to answer question: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header
        courses={courses.filter(c => userCourses.includes(c.courseId))}
        selectedCourseId={selectedCourseId}
        onCourseChange={setSelectedCourseId}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-danger bg-opacity-10 border border-danger text-danger rounded-lg">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-neutral-600">Awaiting My Answer</p>
            <p className="text-3xl font-bold text-primary">{stats.approved}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-neutral-600">Total Answered</p>
            <p className="text-3xl font-bold text-success">{stats.answered}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-neutral-600">My Answers</p>
            <p className="text-3xl font-bold text-neutral-800">{stats.myAnswered}</p>
          </div>
        </div>

        {/* Approved Questions List with Refresh Button */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-neutral-800">
              Questions Awaiting Answer
            </h2>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-neutral-600 text-white rounded hover:bg-neutral-700 flex items-center gap-2 disabled:opacity-50"
              title="Refresh questions"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-neutral-600">Loading questions...</p>
              </div>
            ) : approvedQuestions.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto mb-4 text-neutral-400" size={48} />
                <p className="text-neutral-600">No approved questions waiting for your answer</p>
              </div>
            ) : (
              <div className="space-y-4">
                {approvedQuestions.map(question => {
  const course = courses.find(c => c.courseId === question.courseId);
  const questionId = question.firestoreDocId || ''; // USE firestoreDocId
  
  return (
    <QuestionCard
      key={question.firestoreDocId}
      question={question}
      courseStructure={course?.courseStructure || {}}
      userRole="instructor"
      onAnswer={(answer) => handleAnswer(
        questionId, // Pass the actual Firestore document ID
        answer,
        question.courseId
      )}
      telegramConfigured={!!(course?.telegramBotToken && course?.telegramChannelId)}
    />
  );
})}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;