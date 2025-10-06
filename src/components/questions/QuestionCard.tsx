import React, { useState } from 'react';
import { CheckCircle, Trash2, Send, AlertCircle } from 'lucide-react';
import { Question, LessonInfo, CourseStructure } from '../../types';

interface QuestionCardProps {
  question: Question;
  courseStructure: CourseStructure;
  userRole: 'client_support' | 'instructor';
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onApprove?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onAnswer?: (answer: string) => Promise<void>;
  telegramConfigured?: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  courseStructure,
  userRole,
  isSelected = false,
  onSelect,
  onApprove,
  onDelete,
  onAnswer,
  telegramConfigured = false
}) => {
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(false);

  // Get lesson info
  const getLessonInfo = (): LessonInfo => {
    const chapterKey = `cH${question.chapterNumber}`;
    const lessonKey = `L${question.lessonNumber}`;

    if (courseStructure[chapterKey]) {
      const chapter = courseStructure[chapterKey];
      const lessonTitle = chapter.lessons[lessonKey] || 'Unknown Lesson';
      return {
        chapterTitle: chapter.title,
        lessonTitle: lessonTitle,
        fullTitle: `${chapter.title} - ${lessonTitle}`
      };
    }
    return {
      chapterTitle: 'Unknown Chapter',
      lessonTitle: 'Unknown Lesson',
      fullTitle: 'Unknown Chapter and Lesson'
    };
  };

  const lessonInfo = getLessonInfo();

  // Handle approve
  const handleApprove = async () => {
    if (!onApprove) return;
    setLoading(true);
    try {
      await onApprove(question.id);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!onDelete) return;
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    setLoading(true);
    try {
      await onDelete(question.id);
    } finally {
      setLoading(false);
    }
  };

  // Handle answer
  const handleAnswer = async () => {
    if (!onAnswer || !answerText.trim()) return;
    setLoading(true);
    try {
      await onAnswer(answerText.trim());
      setAnswerText('');
    } finally {
      setLoading(false);
    }
  };

  const questionStatus = question.status || 'pending';

  return (
    <div
      className={`bg-white rounded-lg shadow-sm p-6 transition-all ${
        isSelected ? 'ring-2 ring-blue-500 shadow-md' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          {userRole === 'client_support' && onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(question.id)}
              className="mt-1 w-5 h-5 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
          )}
          <div className="flex-1">
            {/* Status Badge */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  questionStatus === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : questionStatus === 'approved'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {questionStatus === 'pending'
                  ? '⏳ Pending'
                  : questionStatus === 'approved'
                  ? '✓ Approved'
                  : '✅ Answered'}
              </span>
              <span className="text-sm text-gray-500">
                📅 {question.dateSubmitted} - ⏰ {question.timeSubmitted}
              </span>
            </div>

            {/* Lesson Info */}
            <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-r-4 border-blue-500">
              <p className="text-sm font-semibold text-blue-900">
                {lessonInfo.chapterTitle}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                📖 {lessonInfo.lessonTitle}
              </p>
            </div>

            {/* Question Text */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-2 font-medium">❓ Question:</p>
              <p className="text-gray-800 leading-relaxed">{question.questionText}</p>
            </div>

            {/* Answer (if exists) */}
            {question.answer && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-semibold text-green-900 mb-2">✅ Answer:</p>
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {question.answer}
                </p>
                {question.answeredAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    📤 Posted: {new Date(question.answeredAt as any).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-4 flex gap-2 flex-wrap">
              {/* Client Support - Approve */}
              {userRole === 'client_support' && questionStatus === 'pending' && (
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={16} />
                  <span>Approve Question</span>
                </button>
              )}

              {/* Client Support - Delete */}
              {userRole === 'client_support' && (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              )}

              {/* Instructor - Answer */}
              {userRole === 'instructor' && questionStatus === 'approved' && !question.answer && (
                <div className="w-full">
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Write your answer here... It will be posted to Telegram channel"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-2 min-h-[120px] focus:ring-2 focus:ring-green-500 focus:border-transparent resize-y"
                    disabled={loading}
                  />
                  <button
                    onClick={handleAnswer}
                    disabled={!telegramConfigured || loading || !answerText.trim()}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Send size={16} />
                    <span>{loading ? 'Publishing...' : 'Publish to Telegram'}</span>
                  </button>
                  {!telegramConfigured && (
                    <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                      <AlertCircle size={14} />
                      ⚠️ Please configure Telegram settings above
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;