'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Cookies from 'js-cookie';
import { courseAPI, adminAPI } from '@/services/api';

export default function SimpleCourseFormPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id;
  const isEdit = !!courseId;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Basic Course Info
  const [courseInfo, setCourseInfo] = useState({
    title: '',
    description: '',
    category: 'Programming',
    level: 'beginner'
  });

  // Topics List
  const [topics, setTopics] = useState([]);
  
  // Topic Editor (Simple)
  const [currentTopic, setCurrentTopic] = useState({
    title: '',
    content: '',
    codeExample: ''
  });
  
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    const userData = Cookies.get('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
      router.push('/auth/login');
      return;
    }

    setUser(parsedUser);
    
    if (isEdit) {
      loadCourse();
    }
  }, []);

  const loadCourse = async () => {
    try {
      const response = await courseAPI.getCourse(courseId);
      const courseData = response?.data || response?.course || response;
      
      console.log('Loading course for edit:', courseData);
      console.log('Existing topics:', courseData.topics);
      
      setCourseInfo({
        title: courseData.title,
        description: courseData.description,
        category: courseData.category,
        level: courseData.level
      });
      
      // Preserve all topic data including _id for updates
      const existingTopics = (courseData.topics || []).map(topic => ({
        _id: topic._id, // Preserve MongoDB ID
        title: topic.title,
        slug: topic.slug,
        order: topic.order,
        content: topic.content,
        duration: topic.duration || 15,
        codeExamples: topic.codeExamples || [],
        resources: topic.resources || []
      }));
      
      setTopics(existingTopics);
      console.log('Loaded topics for editing:', existingTopics);
    } catch (error) {
      console.error('Error loading course:', error);
      setMessage({ type: 'error', text: 'Failed to load course' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTopic = () => {
    if (!currentTopic.title.trim()) {
      alert('Please enter a topic title');
      return;
    }
    
    if (!currentTopic.content.trim()) {
      alert('Please enter topic content');
      return;
    }

    const newTopic = {
      title: currentTopic.title,
      slug: currentTopic.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      order: topics.length + 1,
      content: currentTopic.content,
      duration: 15,
      codeExamples: currentTopic.codeExample.trim() ? [{
        title: 'Example',
        language: 'javascript',
        code: currentTopic.codeExample,
        output: ''
      }] : [],
      resources: []
    };

    if (editingIndex !== null) {
      // Update existing topic - preserve _id if it exists
      const updatedTopics = [...topics];
      updatedTopics[editingIndex] = { 
        ...updatedTopics[editingIndex], 
        ...newTopic,
        _id: updatedTopics[editingIndex]._id // Keep existing _id if updating
      };
      setTopics(updatedTopics);
      setEditingIndex(null);
    } else {
      // Add new topic
      setTopics([...topics, newTopic]);
    }

    // Reset form
    setCurrentTopic({ title: '', content: '', codeExample: '' });
  };

  const handleEditTopic = (index) => {
    const topic = topics[index];
    console.log('Editing topic:', topic);
    setCurrentTopic({
      title: topic.title || '',
      content: topic.content || '',
      codeExample: topic.codeExamples?.[0]?.code || ''
    });
    setEditingIndex(index);
    window.scrollTo({ top: document.getElementById('topic-editor')?.offsetTop - 100 || 0, behavior: 'smooth' });
  };

  const handleDeleteTopic = (index) => {
    if (confirm('Delete this topic?')) {
      setTopics(topics.filter((_, i) => i !== index));
    }
  };

  const handleCancelEdit = () => {
    setCurrentTopic({ title: '', content: '', codeExample: '' });
    setEditingIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!courseInfo.title.trim() || !courseInfo.description.trim() || !courseInfo.category.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all basic course information' });
      return;
    }

    if (topics.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one topic to the course' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const courseData = {
        title: courseInfo.title,
        description: courseInfo.description,
        category: courseInfo.category,
        level: courseInfo.level,
        topics: topics,
        skillsCovered: [],
        prerequisites: [],
        duration: { value: topics.length, unit: 'hours' },
        pricing: { isFree: true, amount: 0, currency: 'BDT' },
        certificateAvailable: true
      };
      
      // Only generate new slug for new courses, preserve existing slug for updates
      if (!isEdit) {
        courseData.slug = courseInfo.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-6);
        courseData.isPublished = false;
      }

      console.log('Submitting course data:');
      console.log('Is Edit:', isEdit);
      console.log('Topics count:', courseData.topics.length);
      console.log('Topics:', JSON.stringify(courseData.topics.map(t => ({ 
        title: t.title, 
        hasId: !!t._id,
        order: t.order 
      })), null, 2));

      if (isEdit) {
        console.log('Updating course:', courseId);
        await adminAPI.updateCourse(courseId, courseData);
        setMessage({ type: 'success', text: 'Course updated successfully!' });
      } else {
        console.log('Creating new course');
        await adminAPI.createCourse(courseData);
        setMessage({ type: 'success', text: 'Course created successfully!' });
      }

      setTimeout(() => {
        router.push('/admin/courses');
      }, 1500);
    } catch (error) {
      console.error('Error saving course:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to save course. Please try again.' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Cookies.remove('token');
    Cookies.remove('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/courses')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEdit ? 'Edit Course' : '✨ Create Course (Easy Mode)'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button onClick={handleLogout} className="btn btn-outline text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Basic Course Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <div className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">
                1
              </div>
              <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Title *
                </label>
                <input
                  type="text"
                  value={courseInfo.title}
                  onChange={(e) => setCourseInfo({...courseInfo, title: e.target.value})}
                  className="input"
                  placeholder="e.g., JavaScript for Beginners"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={courseInfo.description}
                  onChange={(e) => setCourseInfo({...courseInfo, description: e.target.value})}
                  rows={4}
                  className="input"
                  placeholder="What will students learn in this course?"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={courseInfo.category}
                    onChange={(e) => setCourseInfo({...courseInfo, category: e.target.value})}
                    className="input"
                    required
                  >
                    <option value="Programming">Programming</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Design">Design</option>
                    <option value="Business">Business</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Level *
                  </label>
                  <select
                    value={courseInfo.level}
                    onChange={(e) => setCourseInfo({...courseInfo, level: e.target.value})}
                    className="input"
                    required
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Add Topics */}
          <div className="bg-white rounded-lg shadow p-6" id="topic-editor">
            <div className="flex items-center mb-6">
              <div className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">
                2
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {editingIndex !== null ? 'Edit Topic' : 'Add Topics'}
              </h2>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic Title *
                </label>
                <input
                  type="text"
                  value={currentTopic.title}
                  onChange={(e) => setCurrentTopic({...currentTopic, title: e.target.value})}
                  className="input"
                  placeholder="e.g., Variables in JavaScript"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic Content * (Write your explanation here)
                </label>
                <textarea
                  value={currentTopic.content}
                  onChange={(e) => setCurrentTopic({...currentTopic, content: e.target.value})}
                  rows={8}
                  className="input"
                  placeholder="Explain this topic in detail. You can write multiple paragraphs, add examples, etc."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Write clear explanations. Students will read this to learn.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code Example (Optional)
                </label>
                <textarea
                  value={currentTopic.codeExample}
                  onChange={(e) => setCurrentTopic({...currentTopic, codeExample: e.target.value})}
                  rows={6}
                  className="input font-mono text-sm"
                  placeholder="// Add code example here&#10;let message = 'Hello World';&#10;console.log(message);"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add code examples to help students understand better.
                </p>
              </div>

              <div className="flex gap-3">
                {editingIndex !== null ? (
                  <>
                    <button
                      type="button"
                      onClick={handleAddTopic}
                      className="btn btn-primary"
                    >
                      ✓ Update Topic
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="btn btn-outline"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddTopic}
                    className="btn btn-primary"
                  >
                    + Add Topic
                  </button>
                )}
              </div>
            </div>

            {/* Topics List */}
            {topics.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  📚 Course Topics ({topics.length})
                </h3>
                <div className="space-y-3">
                  {topics.map((topic, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs font-bold">
                              {index + 1}
                            </span>
                            <h4 className="font-semibold text-gray-900">{topic.title}</h4>
                          </div>
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{topic.content}</p>
                          {topic.codeExamples?.length > 0 && (
                            <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              📝 Has code example
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            type="button"
                            onClick={() => handleEditTopic(index)}
                            className="text-primary-600 hover:text-primary-800 text-sm px-3 py-1 border border-primary-300 rounded"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTopic(index)}
                            className="text-red-600 hover:text-red-800 text-sm px-3 py-1 border border-red-300 rounded"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {topics.length === 0 && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                📝 No topics added yet. Add your first topic above.
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                ✓ {topics.length} {topics.length === 1 ? 'topic' : 'topics'} added
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/admin/courses')}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || topics.length === 0}
                  className="btn btn-primary"
                >
                  {saving ? 'Saving...' : isEdit ? '💾 Update Course' : '✨ Create Course'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
