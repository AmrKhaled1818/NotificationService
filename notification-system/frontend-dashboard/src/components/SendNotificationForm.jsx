// src/components/SendNotificationForm.jsx
import React, { useState } from 'react';
import axios from 'axios';

const SendNotificationForm = () => {
  const [type, setType] = useState('info');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Sending...');

    try {
      const res = await axios.post('http://localhost:5000/api/notifications', {
        type,
        message,
      });
      if (res.status === 201) {
        setStatus('✅ Notification sent successfully!');
        setMessage('');
      } else {
        setStatus('❌ Failed to send notification.');
      }
    } catch (err) {
      console.error(err);
      setStatus('❌ Error occurred while sending.');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📨 Send a Notification</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Notification Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border p-2 rounded"
            placeholder="Enter your notification message"
            rows={3}
            required
          ></textarea>
        </div>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Send
        </button>

        {status && <p className="mt-2 text-sm">{status}</p>}
      </form>
    </div>
  );
};

export default SendNotificationForm;
