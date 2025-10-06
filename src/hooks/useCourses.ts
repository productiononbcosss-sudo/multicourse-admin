import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Course } from '../types';

export const useCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

    const unsubscribe = onSnapshot(
      collection(db, 'courses'),
      (snapshot) => {
        const coursesData: Course[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        } as Course));
        
        setCourses(coursesData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error loading courses:', err);
        setError('Failed to load courses: ' + err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Create course
  const createCourse = async (courseData: Omit<Course, 'id'>) => {
    try {
      await addDoc(collection(db, 'courses'), courseData);
      setError(null);
    } catch (err: any) {
      console.error('Error creating course:', err);
      setError('Failed to create course: ' + err.message);
      throw err;
    }
  };

  // Update course
  const updateCourse = async (courseId: string, updates: Partial<Course>) => {
    try {
      await updateDoc(doc(db, 'courses', courseId), updates);
      setError(null);
    } catch (err: any) {
      console.error('Error updating course:', err);
      setError('Failed to update course: ' + err.message);
      throw err;
    }
  };

  // Delete course
  const deleteCourse = async (courseId: string) => {
    try {
      await deleteDoc(doc(db, 'courses', courseId));
      setError(null);
    } catch (err: any) {
      console.error('Error deleting course:', err);
      setError('Failed to delete course: ' + err.message);
      throw err;
    }
  };

  return {
    courses,
    loading,
    error,
    createCourse,
    updateCourse,
    deleteCourse,
    clearError: () => setError(null)
  };
};