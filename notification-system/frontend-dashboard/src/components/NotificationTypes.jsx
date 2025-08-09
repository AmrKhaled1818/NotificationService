// src/components/NotificationTypes.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const NotificationTypes = () => {
  const [types, setTypes] = useState([]);
  const [newType, setNewType] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTypes = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/notification-types');
      setTypes(res.data);
    } catch (err) {
      console.error('Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleAddType = async () => {
    if (!newType.trim()) return;

    try {
      const res = await axios.post('http://localhost:5000/api/notification-types', {
        type: newType.trim(),
      });
      setTypes([...types, res.data]); // add to UI instantly
      setNewType('');
    } catch (err) {
      console.error('Add type failed:', err);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">🔔 Notification Types</h2>

      <div className="flex mb-4 gap-2">
        <input
          type="text"
          placeholder="Enter new type (e.g., Email, SMS)"
          className="border px-4 py-2 rounded w-full"
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={handleAddType}
        >
          Add
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : types.length === 0 ? (
        <p className="text-gray-400">No notification types found.</p>
      ) : (
        <ul className="space-y-2">
          {types.map((t) => (
            <li
              key={t._id}
              className="bg-white shadow p-4 rounded border border-gray-200"
            >
              {t.type}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationTypes;
