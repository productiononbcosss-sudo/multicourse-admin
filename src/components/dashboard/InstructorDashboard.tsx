import React, { useState, useMemo } from 'react';
import { AlertCircle, RefreshCw, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuestions } from '../../hooks/useQuestions';
import { useCourses } from '../../hooks/useCourses';
import { postToTelegram, getLessonInfo } from '../../services/telegram';
import { useModal } from '../../hooks/useModal';
import { useLanguage } from '../../contexts/LanguageContext';
import Header from './Header';
import QuestionCard from '../questions/QuestionCard';
import Modal from '../common/Modal';
import InstructorOnboarding from '../onboarding/InstructorOnboarding';

const InstructorDashboard: React.FC = () => {
  const { userData, currentUser } = useAuth();
  const { courses } = useCourses();
  const userCourses = userData?.assignedCourses || [];
  const { questions, loading, error, answerQuestion } = useQuestions(userCourses);
  const { modalState, showSuccess, showError, showConfirm, closeModal } = useModal();

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'unanswered' | 'answered'>('unanswered');
  const { language, setLanguage, t } = useLanguage();

  // Manual refresh function
  const handleRefresh = () => {
    setRefreshing(true);
    // Firebase real-time listeners will auto-update, so just show visual feedback
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Filter approved questions (unanswered)
  const approvedQuestions = useMemo(() => {
    return questions.filter(q => {
      if (q.status !== 'approved') return false;
      if (selectedCourseId && q.courseId !== selectedCourseId) return false;
      return true;
    });
  }, [questions, selectedCourseId]);

  // Filter answered questions by current instructor
  const answeredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (q.status !== 'answered') return false;
      if (q.answeredBy !== userData?.uid) return false;
      if (selectedCourseId && q.courseId !== selectedCourseId) return false;
      return true;
    }).sort((a, b) => {
      // Sort by answered date, newest first
      const dateA = a.answeredAt ? new Date(a.answeredAt as any).getTime() : 0;
      const dateB = b.answeredAt ? new Date(b.answeredAt as any).getTime() : 0;
      return dateB - dateA;
    });
  }, [questions, selectedCourseId, userData?.uid]);

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

  // Check if instructor has no assigned courses (onboarding state)
  const needsOnboarding = userData && userData.role === 'instructor' && (!userData.assignedCourses || userData.assignedCourses.length === 0);

  // Show onboarding screen for new instructors
  if (needsOnboarding) {
    return (
      <InstructorOnboarding
        userName={userData.displayName || userData.email.split('@')[0]}
        userEmail={userData.email}
      />
    );
  }

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
      showError(t('error.authFailed'), t('error.authFailed'));
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
        showSuccess(t('success.published'), t('success.published'));
      } else {
        // Save answer without Telegram
        await answerQuestion(questionId, answer, userId);
        showSuccess(t('success.saved'), t('success.saved'));
      }
    } catch (err: any) {
      console.error('Error answering question:', err);
      showError(t('error.answerFailed'), `${t('error.answerFailed')}: ${err.message}`);
    }
  };

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

        {/* Language Selector and Statistics */}
        <div className="mb-6">
          {/* Language Selector */}
          <div className="bg-white p-4 rounded-lg shadow mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe size={20} className="text-neutral-600" />
              <span className="text-sm font-medium text-neutral-700">Language:</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setLanguage('en')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  language === 'en'
                    ? 'bg-primary text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {t('language.english')}
              </button>
              <button
                onClick={() => setLanguage('fr')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  language === 'fr'
                    ? 'bg-primary text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {t('language.french')}
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-neutral-600">{t('dashboard.awaitingAnswer')}</p>
              <p className="text-3xl font-bold text-primary">{stats.approved}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-neutral-600">{t('dashboard.totalAnswered')}</p>
              <p className="text-3xl font-bold text-success">{stats.answered}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-neutral-600">{t('dashboard.myAnswers')}</p>
              <p className="text-3xl font-bold text-neutral-800">{stats.myAnswered}</p>
            </div>
          </div>
        </div>

        {/* Questions List with Tabs */}
        <div className="bg-white rounded-lg shadow">
          {/* Header with Tabs and Refresh */}
          <div className="px-6 py-4 border-b border-neutral-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-neutral-800">
                {activeTab === 'unanswered' ? t('dashboard.questionsAwaitingAnswer') : t('dashboard.answeredQuestions')}
              </h2>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-neutral-600 text-white rounded hover:bg-neutral-700 flex items-center gap-2 disabled:opacity-50"
                title={t('dashboard.refresh')}
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                {t('dashboard.refresh')}
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('unanswered')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'unanswered'
                    ? 'bg-primary text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {t('tabs.unanswered')} ({approvedQuestions.length})
              </button>
              <button
                onClick={() => setActiveTab('answered')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'answered'
                    ? 'bg-success text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {t('tabs.answered')} ({answeredQuestions.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-neutral-600">{t('dashboard.loading')}</p>
              </div>
            ) : activeTab === 'unanswered' ? (
              approvedQuestions.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto mb-4 text-neutral-400" size={48} />
                  <p className="text-neutral-600">{t('dashboard.noQuestions')}</p>
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
      onConfirmPublish={(answer, callback) => {
        showConfirm(
          t('confirm.publishTitle'),
          t('confirm.publishMessage'),
          callback,
          { confirmText: t('confirm.yes'), cancelText: t('confirm.no') }
        );
      }}
      telegramConfigured={!!(course?.telegramBotToken && course?.telegramChannelId)}
    />
  );
})}
                </div>
              )
            ) : (
              answeredQuestions.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto mb-4 text-neutral-400" size={48} />
                  <p className="text-neutral-600">{t('dashboard.noAnsweredQuestions')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {answeredQuestions.map(question => {
                    const course = courses.find(c => c.courseId === question.courseId);
                    
                    return (
                      <QuestionCard
                        key={question.firestoreDocId}
                        question={question}
                        courseStructure={course?.courseStructure || {}}
                        userRole="instructor"
                        telegramConfigured={!!(course?.telegramBotToken && course?.telegramChannelId)}
                      />
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default InstructorDashboard;