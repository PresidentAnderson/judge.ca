import React from 'react';
import Head from 'next/head';
import { FiWifiOff, FiRefreshCw } from 'react-icons/fi';

export default function OfflinePage() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <>
      <Head>
        <title>Offline - Judge.ca</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
            <FiWifiOff className="w-10 h-10 text-gray-400" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            You're Offline
          </h1>
          
          <p className="text-gray-600 mb-8">
            It looks like you've lost your internet connection. 
            Please check your connection and try again.
          </p>
          
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <FiRefreshCw className="w-5 h-5 mr-2" />
            Try Again
          </button>
          
          <div className="mt-12 p-6 bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              While you're offline, you can:
            </h2>
            <ul className="text-left text-gray-600 space-y-2">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                View previously cached pages and documents
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                Access your saved attorney contacts
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                Review case information you've accessed before
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}