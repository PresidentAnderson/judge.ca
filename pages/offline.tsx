import { useEffect, useState } from 'react'
import Head from 'next/head'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    // Check initial status
    updateOnlineStatus()

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    window.location.reload()
  }

  const goHome = () => {
    window.location.href = '/'
  }

  return (
    <>
      <Head>
        <title>Offline - Judge.ca</title>
        <meta name="description" content="You are currently offline. Please check your internet connection." />
        <meta name="robots" content="noindex" />
      </Head>
      
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md w-full">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                {isOnline ? (
                  <Wifi className="h-8 w-8 text-green-600" />
                ) : (
                  <WifiOff className="h-8 w-8 text-red-600" />
                )}
              </div>
              
              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {isOnline ? 'Connection Restored' : 'You\'re Offline'}
              </h1>
              
              {/* Description */}
              <p className="text-gray-600 mb-6">
                {isOnline 
                  ? 'Your internet connection has been restored. You can now access all features.'
                  : 'It looks like you\'ve lost your internet connection. Some features may not be available while you\'re offline.'
                }
              </p>
              
              {/* Connection Status */}
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-6 ${
                isOnline 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  isOnline ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
                {isOnline ? 'Online' : 'Offline'}
              </div>
              
              {/* Cached Content Info */}
              {!isOnline && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">
                    Limited Offline Access
                  </h3>
                  <p className="text-sm text-blue-700">
                    You can still browse previously visited pages and view cached content. 
                    New searches and form submissions will be saved and processed when you're back online.
                  </p>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="space-y-3">
                {isOnline ? (
                  <button
                    onClick={goHome}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Return to Judge.ca
                  </button>
                ) : (
                  <button
                    onClick={handleRetry}
                    disabled={retryCount >= 3}
                    className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {retryCount >= 3 ? 'Please wait...' : 'Try Again'}
                  </button>
                )}
                
                <button
                  onClick={goHome}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Browse Cached Pages
                </button>
              </div>
              
              {/* Tips */}
              <div className="mt-8 text-left">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Troubleshooting Tips:
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Check your Wi-Fi or mobile data connection</li>
                  <li>• Try switching between Wi-Fi and mobile data</li>
                  <li>• Restart your router if using Wi-Fi</li>
                  <li>• Contact your internet service provider if issues persist</li>
                </ul>
              </div>
              
              {/* Retry Counter */}
              {retryCount > 0 && (
                <div className="mt-4 text-xs text-gray-500">
                  Retry attempts: {retryCount}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// This page should be statically generated
export async function getStaticProps() {
  return {
    props: {}
  }
}