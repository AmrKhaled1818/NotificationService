// src/components/SentNotifications.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SentNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📬 Sent Notifications</h2>

      {loading ? (
        <p>Loading...</p>
      ) : notifications.length === 0 ? (
        <p className="text-gray-400">No notifications have been sent yet.</p>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li
              key={n._id}
              className="bg-white shadow p-4 rounded border border-gray-200"
            >
              <p><strong>Type:</strong> {n.type}</p>
              <p><strong>Message:</strong> {n.message}</p>
              <p><strong>Timestamp:</strong> {new Date(n.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SentNotifications;
