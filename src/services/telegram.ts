import { Question, LessonInfo } from '../types';

// Escape HTML special characters for Telegram
const escapeHtml = (text: string | undefined | null): string => {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Get lesson info from course structure
export const getLessonInfo = (
  courseStructure: any,
  chapterNumber: number,
  lessonNumber: number
): LessonInfo => {
  const chapterKey = `cH${chapterNumber}`;
  const lessonKey = `L${lessonNumber}`;
  
  const chapter = courseStructure?.[chapterKey];
  const chapterTitle = chapter?.title || `Chapter ${chapterNumber}`;
  const lessonTitle = chapter?.lessons?.[lessonKey] || `Lesson ${lessonNumber}`;
  
  return { 
    chapterTitle, 
    lessonTitle,
    fullTitle: `${chapterTitle} - ${lessonTitle}`  // ADD THIS
  };
};

// Format message for Telegram (All in Arabic)
const formatTelegramMessage = (
  question: Question,
  answer: string,
  lessonInfo: LessonInfo
): string => {
  const { chapterTitle, lessonTitle } = lessonInfo;
  
  // Validate required fields
  if (!question.questionText) {
    throw new Error('Question text is missing');
  }
  if (!answer) {
    throw new Error('Answer text is missing');
  }
  
  return `
📚 <b>${escapeHtml(chapterTitle)}</b>
📖 ${escapeHtml(lessonTitle)}

❓ <b>السؤال:</b>
${escapeHtml(question.questionText)}

✅ <b>الإجابة:</b>
${escapeHtml(answer)}

⏰ ${escapeHtml(question.dateSubmitted)} - ${escapeHtml(question.timeSubmitted)}
`.trim();
};

// Post message to Telegram channel
export const postToTelegram = async (
  botToken: string,
  channelId: string,
  question: Question,
  answer: string,
  lessonInfo: LessonInfo
): Promise<number> => {
  const message = formatTelegramMessage(question, answer, lessonInfo);
  
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: channelId,
        text: message,
        parse_mode: 'HTML'
      })
    }
  );
  
  const data = await response.json();
  
  if (!data.ok) {
    throw new Error(data.description || 'Failed to post to Telegram');
  }
  
  return data.result.message_id;
};

// Test Telegram connection
export const testTelegramConnection = async (
  botToken: string,
  channelId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const testMessage = '✅ تم الاتصال بنجاح!';
    
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: channelId,
          text: testMessage
        })
      }
    );
    
    const data = await response.json();
    
    if (!data.ok) {
      return {
        success: false,
        error: data.description || 'Connection failed'
      };
    }
    
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
};