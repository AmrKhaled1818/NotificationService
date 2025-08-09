// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import NotificationTypes from './components/NotificationTypes';
import Dashboard from './components/Dashboard'; // create this if you haven't
import SentNotifications from './components/SentNotifications';
import SendNotificationForm from './components/SendNotificationForm';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/notification-types" element={<NotificationTypes />} />
        <Route path="/sent-notifications" element={<SentNotifications />} />
        <Route path="/send-notification" element={<SendNotificationForm />} />
      </Routes>
    </Layout>
  );
}

export default App;
