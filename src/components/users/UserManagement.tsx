import React, { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, Edit2 } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { User, UserRole, Course } from '../../types';

interface UserManagementProps {
  courses: Course[];
  onClose: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ courses, onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('instructor');
  const [displayName, setDisplayName] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as User));
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!email || !displayName) {
      setError('Email and display name are required');
      return;
    }

    setError('');
    
    // Show instructions for adding a user
    const instructions = `📋 HOW TO ADD A NEW USER:\n\n` +
      `STEP 1: Ask the user to sign in first\n` +
      `• Send them this link: ${window.location.origin}\n` +
      `• They should click "Sign in with Google"\n` +
      `• They will see "User not authorized" - this is expected!\n\n` +
      
      `STEP 2: Get their Firebase UID\n` +
      `• Go to Firebase Console → Authentication\n` +
      `• Find their email: ${email}\n` +
      `• Copy their UID (long string of characters)\n\n` +
      
      `STEP 3: Create their user document\n` +
      `• Go to Firebase Console → Firestore Database\n` +
      `• Open the "users" collection\n` +
      `• Click "Add document"\n` +
      `• Document ID: [paste the UID from step 2]\n` +
      `• Add these fields:\n` +
      `  ✓ email: "${email}"\n` +
      `  ✓ displayName: "${displayName}"\n` +
      `  ✓ role: "${role}"\n` +
      `  ✓ assignedCourses: ${role === 'instructor' ? `[${selectedCourses.map(c => `"${c}"`).join(', ')}]` : '[]'}\n` +
      `  ✓ active: true\n` +
      `  ✓ createdAt: timestamp (click "timestamp" button)\n\n` +
      
      `STEP 4: User can now sign in!\n` +
      `• The user can refresh the page and sign in successfully\n\n` +
      
      `💡 TIP: Keep this information and share it with the new user.`;
    
    alert(instructions);
    
    // Don't close the form so admin can copy the information
    // setShowAddUser(false);
    // resetForm();
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      setError('');
      await updateDoc(doc(db, 'users', editingUser.uid), {
        displayName,
        role,
        assignedCourses: role === 'instructor' ? selectedCourses : [],
        active: editingUser.active
      });

      resetForm();
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await deleteDoc(doc(db, 'users', userId));
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        active: !user.active
      });
      fetchUsers();
    } catch (err) {
      console.error('Error toggling user status:', err);
      setError('Failed to update user status');
    }
  };

  const startEdit = (user: User) => {
  setEditingUser(user);
  setEmail(user.email);
  setDisplayName(user.displayName || '');  // ADD || ''
  setRole(user.role);
  setSelectedCourses(user.assignedCourses || []);
};

  const resetForm = () => {
    setEmail('');
    setDisplayName('');
    setRole('instructor');
    setSelectedCourses([]);
    setError('');
  };

  const handleCourseToggle = (courseId: string) => {
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-primary text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">User Management</h2>
          <button
            onClick={onClose}
            className="hover:bg-white hover:bg-opacity-20 rounded p-1"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-danger bg-opacity-10 border border-danger text-danger rounded">
              {error}
            </div>
          )}

          {/* Info Banner */}
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">🎉 Automatic User Registration</h4>
            <p className="text-sm text-blue-800">
              New users can now sign in with Google directly! They will appear below as "Inactive" and you can:
            </p>
            <ul className="text-sm text-blue-800 mt-2 ml-4 list-disc">
              <li>Activate their account by clicking the status button</li>
              <li>Edit their role and assign courses</li>
              <li>They will receive access immediately after activation</li>
            </ul>
          </div>

          {/* Pending Users Alert */}
          {users.filter(u => !u.active).length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
              <p className="text-sm text-yellow-800 font-semibold">
                ⚠️ {users.filter(u => !u.active).length} pending user(s) waiting for approval
              </p>
            </div>
          )}

          {/* Add/Edit User Form */}
          {(showAddUser || editingUser) && (
            <div className="mb-6 p-4 border border-neutral-300 rounded bg-neutral-50">
              <h3 className="text-lg font-semibold mb-4">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!!editingUser}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-neutral-100"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Role *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="User role"
                  >
                    <option value="instructor">Instructor</option>
                    <option value="client_support">Client Support</option>
                  </select>
                </div>
              </div>

              {/* Course Assignment (Instructors only) */}
              {role === 'instructor' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">
                    Assigned Courses
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {courses.map(course => (
                      <label
                        key={course.courseId}
                        className="flex items-center gap-2 p-2 border border-neutral-300 rounded hover:bg-neutral-100 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCourses.includes(course.courseId)}
                          onChange={() => handleCourseToggle(course.courseId)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{course.courseName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={editingUser ? handleUpdateUser : handleAddUser}
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-700"
                >
                  {editingUser ? 'Update User' : 'Add User'}
                </button>
                <button
                  onClick={() => {
                    setShowAddUser(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-neutral-300 text-neutral-700 rounded hover:bg-neutral-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Users List */}
          {loading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-neutral-100 border-b border-neutral-300">
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Courses</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.uid} className="border-b border-neutral-200 hover:bg-neutral-50">
                      <td className="px-4 py-3">{user.displayName}</td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-sm ${
                          user.role === 'client_support'
                            ? 'bg-primary bg-opacity-20 text-primary'
                            : 'bg-success bg-opacity-20 text-success'
                        }`}>
                          {user.role === 'client_support' ? 'Client Support' : 'Instructor'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.role === 'instructor' ? (
                          <span className="text-sm text-neutral-600">
                            {user.assignedCourses?.length || 0} courses
                          </span>
                        ) : (
                          <span className="text-sm text-neutral-400">All courses</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`px-2 py-1 rounded text-sm ${
                            user.active
                              ? 'bg-success bg-opacity-20 text-success'
                              : 'bg-danger bg-opacity-20 text-danger'
                          }`}
                        >
                          {user.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(user)}
                            className="p-1 text-primary hover:bg-primary hover:bg-opacity-10 rounded"
                            aria-label="Edit user"
                            title="Edit user"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.uid)}
                            className="p-1 text-danger hover:bg-danger hover:bg-opacity-10 rounded"
                            aria-label="Delete user"
                            title="Delete user"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {users.length === 0 && (
                <div className="text-center py-8 text-neutral-500">
                  No users found. Add your first user to get started.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;