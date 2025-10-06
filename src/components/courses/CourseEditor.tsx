import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Save, TestTube, Upload, FileJson, Download } from 'lucide-react';
import { doc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Course, User, CourseStructure } from '../../types';
import { testTelegramConnection } from '../../services/telegram';

interface CourseEditorProps {
  course: Course | null;
  onClose: () => void;
}

const CourseEditor: React.FC<CourseEditorProps> = ({ course, onClose }) => {
  const [courseId, setCourseId] = useState(course?.courseId || '');
  const [courseName, setCourseName] = useState(course?.courseName || '');
  const [active, setActive] = useState(course?.active ?? true);
  const [telegramBotToken, setTelegramBotToken] = useState(course?.telegramBotToken || '');
  const [telegramChannelId, setTelegramChannelId] = useState(course?.telegramChannelId || '');
  const [courseStructure, setCourseStructure] = useState<CourseStructure>(course?.courseStructure || {});
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>(course?.instructorIds || []);
  
  const [instructors, setInstructors] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [importMode, setImportMode] = useState<'manual' | 'json'>('manual');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!course;

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const instructorsList = usersSnapshot.docs
        .map(doc => ({ uid: doc.id, ...doc.data() } as User))
        .filter(user => user.role === 'instructor' && user.active);
      setInstructors(instructorsList);
    } catch (err) {
      console.error('Error fetching instructors:', err);
    }
  };

  const handleTestTelegram = async () => {
    if (!telegramBotToken || !telegramChannelId) {
      setError('Please enter both bot token and channel ID');
      return;
    }

    setTestingTelegram(true);
    setError('');
    setSuccess('');

    try {
      const result = await testTelegramConnection(telegramBotToken, telegramChannelId);
      if (result.success) {
        setSuccess('Telegram connection successful!');
      } else {
        setError(`Telegram test failed: ${result.error}`);
      }
    } catch (err: any) {
      setError(`Test failed: ${err.message}`);
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleSave = async () => {
    if (!courseId || !courseName) {
      setError('Course ID and Name are required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const courseData: Course = {
        courseId: courseId.toLowerCase(),
        courseName,
        courseStructure,
        instructorIds: selectedInstructors,
        telegramBotToken,
        telegramChannelId,
        active,
        autoCreated: false,
        createdAt: course?.createdAt || new Date()
      };

      if (isEditMode) {
        await updateDoc(doc(db, 'courses', course.courseId), courseData as any);
        setSuccess('Course updated successfully!');
      } else {
        await setDoc(doc(db, 'courses', courseId.toLowerCase()), courseData);
        setSuccess('Course created successfully!');
      }

      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      console.error('Error saving course:', err);
      setError(err.message || 'Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  const handleAddChapter = () => {
    const chapterCount = Object.keys(courseStructure).length;
    const newChapterKey = `cH${chapterCount + 1}`;
    setCourseStructure({
      ...courseStructure,
      [newChapterKey]: {
        title: `Chapter ${chapterCount + 1}`,
        lessons: {}
      }
    });
  };

  const handleUpdateChapterTitle = (chapterKey: string, title: string) => {
    setCourseStructure({
      ...courseStructure,
      [chapterKey]: {
        ...courseStructure[chapterKey],
        title
      }
    });
  };

  const handleDeleteChapter = (chapterKey: string) => {
    const newStructure = { ...courseStructure };
    delete newStructure[chapterKey];
    setCourseStructure(newStructure);
  };

  const handleAddLesson = (chapterKey: string) => {
    const lessons = courseStructure[chapterKey]?.lessons || {};
    const lessonCount = Object.keys(lessons).length;
    const newLessonKey = `L${lessonCount + 1}`;
    
    setCourseStructure({
      ...courseStructure,
      [chapterKey]: {
        ...courseStructure[chapterKey],
        lessons: {
          ...lessons,
          [newLessonKey]: `Lesson ${lessonCount + 1}`
        }
      }
    });
  };

  const handleUpdateLessonTitle = (chapterKey: string, lessonKey: string, title: string) => {
    setCourseStructure({
      ...courseStructure,
      [chapterKey]: {
        ...courseStructure[chapterKey],
        lessons: {
          ...courseStructure[chapterKey].lessons,
          [lessonKey]: title
        }
      }
    });
  };

  const handleDeleteLesson = (chapterKey: string, lessonKey: string) => {
    const newLessons = { ...courseStructure[chapterKey].lessons };
    delete newLessons[lessonKey];
    
    setCourseStructure({
      ...courseStructure,
      [chapterKey]: {
        ...courseStructure[chapterKey],
        lessons: newLessons
      }
    });
  };

  const toggleInstructor = (uid: string) => {
    setSelectedInstructors(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const jsonData = JSON.parse(content);
        
        // Validate the JSON structure
        if (typeof jsonData !== 'object' || jsonData === null) {
          throw new Error('Invalid JSON structure');
        }

        // Check if it's a valid course structure
        let isValid = true;
        for (const [key, value] of Object.entries(jsonData)) {
          if (!key.startsWith('cH') || typeof value !== 'object') {
            isValid = false;
            break;
          }
          const chapter = value as any;
          if (!chapter.title || !chapter.lessons || typeof chapter.lessons !== 'object') {
            isValid = false;
            break;
          }
        }

        if (!isValid) {
          throw new Error('Invalid course structure format');
        }

        setCourseStructure(jsonData as CourseStructure);
        setSuccess('Course structure imported successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        setError(`Failed to import JSON: ${err.message}`);
        setTimeout(() => setError(''), 5000);
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportJSON = () => {
    const jsonString = JSON.stringify(courseStructure, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${courseId || 'course'}-structure.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getExampleJSON = () => {
    return {
      "cH1": {
        "title": "Introduction to the Course",
        "lessons": {
          "L1": "Welcome and Overview",
          "L2": "Course Objectives",
          "L3": "Getting Started"
        }
      },
      "cH2": {
        "title": "Core Concepts",
        "lessons": {
          "L1": "Fundamental Principles",
          "L2": "Key Terminology",
          "L3": "Practical Applications"
        }
      }
    };
  };

  const handleDownloadExample = () => {
    const exampleJSON = getExampleJSON();
    const jsonString = JSON.stringify(exampleJSON, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'course-structure-example.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-primary text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {isEditMode ? 'Edit Course' : 'Create New Course'}
          </h2>
          <button onClick={onClose} className="hover:bg-white hover:bg-opacity-20 rounded p-1" aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-danger bg-opacity-10 border border-danger text-danger rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-success bg-opacity-10 border border-success text-success rounded">
              {success}
            </div>
          )}

          {/* Basic Info */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Course ID *</label>
                <input
                  type="text"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value.toLowerCase())}
                  disabled={isEditMode}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-neutral-100"
                  placeholder="lig, fin, hrm"
                />
                <p className="text-xs text-neutral-500 mt-1">Lowercase, no spaces (e.g., lig, fin)</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Course Name *</label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Labor Law Course"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="active" className="text-sm font-medium">Course Active</label>
              </div>
            </div>
          </div>

          {/* Telegram Configuration */}
          <div className="mb-6 p-4 border border-neutral-300 rounded">
            <h3 className="text-lg font-semibold mb-3">Telegram Integration</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Bot Token</label>
                <input
                  type="text"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Channel ID</label>
                <input
                  type="text"
                  value={telegramChannelId}
                  onChange={(e) => setTelegramChannelId(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="@yourchannel or -1001234567890"
                />
              </div>

              <button
                onClick={handleTestTelegram}
                disabled={testingTelegram}
                className="px-4 py-2 bg-neutral-600 text-white rounded hover:bg-neutral-700 flex items-center gap-2 disabled:opacity-50"
              >
                <TestTube size={16} />
                {testingTelegram ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
          </div>

          {/* Assign Instructors */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Assign Instructors</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {instructors.map(instructor => (
                <label
                  key={instructor.uid}
                  className="flex items-center gap-2 p-2 border border-neutral-300 rounded hover:bg-neutral-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedInstructors.includes(instructor.uid)}
                    onChange={() => toggleInstructor(instructor.uid)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{instructor.displayName || instructor.email}</span>
                </label>
              ))}
            </div>
            {instructors.length === 0 && (
              <p className="text-sm text-neutral-500">No instructors available</p>
            )}
          </div>

          {/* Course Structure */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Course Structure</h3>
              <div className="flex gap-2">
                {Object.keys(courseStructure).length > 0 && (
                  <button
                    onClick={handleExportJSON}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1 text-sm"
                    title="Export current structure as JSON"
                  >
                    <Download size={16} />
                    Export JSON
                  </button>
                )}
                <button
                  onClick={handleAddChapter}
                  className="px-3 py-1 bg-primary text-white rounded hover:bg-blue-700 flex items-center gap-1 text-sm"
                >
                  <Plus size={16} />
                  Add Chapter
                </button>
              </div>
            </div>

            {/* Import/Manual Toggle */}
            <div className="mb-4 p-4 bg-neutral-50 border border-neutral-200 rounded">
              <div className="flex items-center gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="structureMode"
                    checked={importMode === 'manual'}
                    onChange={() => setImportMode('manual')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Manual Entry</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="structureMode"
                    checked={importMode === 'json'}
                    onChange={() => setImportMode('json')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Import from JSON</span>
                </label>
              </div>

              {importMode === 'json' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleImportJSON}
                      className="hidden"
                      id="json-upload"
                    />
                    <label
                      htmlFor="json-upload"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Upload size={16} />
                      Upload JSON File
                    </label>
                    <button
                      onClick={handleDownloadExample}
                      className="px-4 py-2 bg-neutral-600 text-white rounded hover:bg-neutral-700 flex items-center gap-2"
                      title="Download example JSON structure"
                    >
                      <FileJson size={16} />
                      Example
                    </button>
                  </div>
                  
                  <div className="text-xs text-neutral-600 bg-white p-3 rounded border border-neutral-300">
                    <p className="font-semibold mb-2">📋 JSON Format Example:</p>
                    <pre className="bg-neutral-50 p-2 rounded overflow-x-auto">
{`{
  "cH1": {
    "title": "Chapter Title",
    "lessons": {
      "L1": "Lesson 1 Title",
      "L2": "Lesson 2 Title"
    }
  },
  "cH2": {
    "title": "Another Chapter",
    "lessons": {
      "L1": "Lesson Title"
    }
  }
}`}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {Object.entries(courseStructure).map(([chapterKey, chapter]) => (
                <div key={chapterKey} className="border border-neutral-300 rounded p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="text"
                      value={chapter.title}
                      onChange={(e) => handleUpdateChapterTitle(chapterKey, e.target.value)}
                      className="flex-1 px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Chapter Title"
                    />
                    <button
                      onClick={() => handleAddLesson(chapterKey)}
                      className="px-3 py-2 bg-neutral-200 text-neutral-700 rounded hover:bg-neutral-300"
                      title="Add Lesson"
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteChapter(chapterKey)}
                      className="px-3 py-2 bg-danger text-white rounded hover:bg-red-700"
                      title="Delete Chapter"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Lessons */}
                  <div className="ml-4 space-y-2">
                    {Object.entries(chapter.lessons || {}).map(([lessonKey, lessonTitle]) => (
                      <div key={lessonKey} className="flex items-center gap-2">
                        <span className="text-sm text-neutral-600 w-12">{lessonKey}:</span>
                        <input
                          type="text"
                          value={lessonTitle}
                          onChange={(e) => handleUpdateLessonTitle(chapterKey, lessonKey, e.target.value)}
                          className="flex-1 px-2 py-1 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Lesson Title"
                        />
                        <button
                          onClick={() => handleDeleteLesson(chapterKey, lessonKey)}
                          className="p-1 text-danger hover:bg-danger hover:bg-opacity-10 rounded"
                          title="Delete Lesson"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {Object.keys(courseStructure).length === 0 && (
              <p className="text-sm text-neutral-500 text-center py-4">
                No chapters yet. Click "Add Chapter" to get started.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-neutral-300">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={16} />
              {loading ? 'Saving...' : isEditMode ? 'Update Course' : 'Create Course'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-300 text-neutral-700 rounded hover:bg-neutral-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseEditor;