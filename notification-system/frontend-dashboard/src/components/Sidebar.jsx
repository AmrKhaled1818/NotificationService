// src/components/Sidebar.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="w-64 h-screen bg-gray-800 text-white p-4">
      <h2 className="text-xl font-bold mb-6">📊 Dashboard</h2>
      <nav className="flex flex-col gap-3">
        <Link to="/" className="hover:text-teal-300">🏠 Home</Link>
        <Link to="/notification-types" className="hover:text-teal-300">🔔 Notification Types</Link>
        <Link to="/sent-notifications" className="hover:text-teal-300">🔔 Sent Notifications</Link>
        <Link to="/send-notification" className="hover:text-teal-300">🔔 Send Notification Form</Link>
        {/* Add more links as needed */}
      </nav>
    </div>
  );
};

export default Sidebar;
