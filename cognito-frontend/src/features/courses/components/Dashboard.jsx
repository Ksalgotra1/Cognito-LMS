import React, { useEffect, useState } from 'react';
import client from '../../../lib/axios'; // Import our Gateway

const Dashboard = () => {
  const [serverMessage, setServerMessage] = useState('Connecting...');

  useEffect(() => {
    // The fetch logic
    const fetchData = async () => {
      try {
        // This uses baseURL: http://127.0.0.1:8000/
        // So we request: http://127.0.0.1:8000/polls/api/health/
        // (Adjust path based on how you included polls URLs)
        const response = await client.get('polls/api/health/');
        setServerMessage(response.data.message);
      } catch (error) {
        console.error("Connection failed:", error);
        setServerMessage('Error connecting to Django');
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-blue-600">Student Dashboard</h1>
      <div className="mt-4 p-4 bg-gray-100 rounded border border-gray-300">
        <p className="font-mono text-sm">Server Status:</p>
        <p className="text-lg font-bold text-green-600">{serverMessage}</p>
      </div>
    </div>
  );
};

export default Dashboard;