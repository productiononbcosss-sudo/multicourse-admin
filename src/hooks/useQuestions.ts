import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  Timestamp,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { Question } from '../types';

export const useQuestions = (userCourses: string[] | null) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-create course if it doesn't exist
  const ensureCourseExists = async (courseId: string) => {
    try {
      const courseRef = doc(db, 'courses', courseId);
      const courseDoc = await getDoc(courseRef);
      
      if (!courseDoc.exists()) {
        // Create course automatically
        await setDoc(courseRef, {
          courseId: courseId,
          courseName: `${courseId.toUpperCase()} Course`,
          courseStructure: {},
          instructorIds: [],
          telegramBotToken: '',
          telegramChannelId: '',
          active: true,
          autoCreated: true,
          createdAt: new Date()
        });
        console.log(`Auto-created course: ${courseId}`);
      }
    } catch (err) {
      console.error('Error ensuring course exists:', err);
    }
  };

  useEffect(() => {
    if (!userCourses) {
      setLoading(false);
      return;
    }

    let q;
    
    if (userCourses.length === 0) {
      // Client support - see all questions
      q = query(
        collection(db, 'questions'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
    } else {
      // Instructor - see only assigned courses
      q = query(
        collection(db, 'questions'),
        where('courseId', 'in', userCourses),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
    }

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const questionsData = snapshot.docs.map(doc => ({
          firestoreDocId: doc.id,
          ...doc.data()
        } as Question));
        
        // Auto-create courses for any new courseIds
       const uniqueCourseIds = Array.from(new Set(questionsData.map(q => q.courseId)));
        for (const courseId of uniqueCourseIds) {
          await ensureCourseExists(courseId);
        }
        
        setQuestions(questionsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching questions:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userCourses]);

 const approveQuestion = async (questionId: string, userId: string) => {
  try {
    // First try to find by custom id field
    let querySnapshot = await getDocs(
      query(collection(db, 'questions'), where('id', '==', questionId), limit(1))
    );

    // If not found, assume questionId is the Firestore document ID
    if (querySnapshot.empty) {
      const docRef = doc(db, 'questions', questionId);
      await updateDoc(docRef, {
        status: 'approved',
        approvedAt: Timestamp.now(),
        approvedBy: userId
      });
      console.log('Approved question by document ID');
      return;
    }

    // Found by custom id field
    const docRef = doc(db, 'questions', querySnapshot.docs[0].id);
    const questionData = querySnapshot.docs[0].data() as Question;
    
    // Ensure course exists before approving
    await ensureCourseExists(questionData.courseId);
    
    await updateDoc(docRef, {
      status: 'approved',
      approvedAt: Timestamp.now(),
      approvedBy: userId
    });
    console.log('Approved question by custom id');
  } catch (err: any) {
    console.error('Error approving question:', err);
    throw new Error(err.message || 'Failed to approve question');
  }
};

  const deleteQuestion = async (questionId: string) => {
  try {
    let querySnapshot = await getDocs(
      query(collection(db, 'questions'), where('id', '==', questionId), limit(1))
    );

    if (querySnapshot.empty) {
      // Try as document ID
      await deleteDoc(doc(db, 'questions', questionId));
      console.log('Deleted question by document ID');
      return;
    }

    await deleteDoc(doc(db, 'questions', querySnapshot.docs[0].id));
    console.log('Deleted question by custom id');
  } catch (err: any) {
    console.error('Error deleting question:', err);
    throw new Error(err.message || 'Failed to delete question');
  }
};

  const answerQuestion = async (
  questionId: string,
  answer: string,
  userId: string,
  telegramMessageId?: number
) => {
  try {
    let querySnapshot = await getDocs(
      query(collection(db, 'questions'), where('id', '==', questionId), limit(1))
    );

    const updateData: any = {
      status: 'answered',
      answer,
      answeredAt: Timestamp.now(),
      answeredBy: userId
    };

    if (telegramMessageId) {
      updateData.telegramMessageId = telegramMessageId;
    }

    if (querySnapshot.empty) {
      // Try as document ID
      await updateDoc(doc(db, 'questions', questionId), updateData);
      console.log('Answered question by document ID');
      return;
    }

    await updateDoc(doc(db, 'questions', querySnapshot.docs[0].id), updateData);
    console.log('Answered question by custom id');
  } catch (err: any) {
    console.error('Error answering question:', err);
    throw new Error(err.message || 'Failed to answer question');
  }
};

  return {
    questions,
    loading,
    error,
    approveQuestion,
    deleteQuestion,
    answerQuestion
  };
};