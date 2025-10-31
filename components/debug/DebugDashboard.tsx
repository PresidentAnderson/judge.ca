import React, { useState, useEffect } from 'react';
import { frontendDebuggingAgent } from '../../src/frontend/services/debugging-agent.service';

interface DebugDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

export const DebugDashboard: React.FC<DebugDashboardProps> = ({ isVisible, onClose }) => {
  const [activeTab, setActiveTab] = useState<'errors' | 'performance' | 'network' | 'console' | 'actions'>('errors');
  const [statistics, setStatistics] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!isVisible) return;

    const updateStatistics = () => {
      setStatistics(frontendDebuggingAgent.getStatistics());
    };

    updateStatistics();

    if (autoRefresh) {
      const interval = setInterval(updateStatistics, 1000);
      return () => clearInterval(interval);
    }
  }, [isVisible, autoRefresh]);

  const handleExportSession = () => {
    const sessionData = frontendDebuggingAgent.exportSession();
    const blob = new Blob([sessionData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearSession = () => {
    if (confirm('Are you sure you want to clear all debug data?')) {
      frontendDebuggingAgent.clearSession();
      setStatistics(frontendDebuggingAgent.getStatistics());
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-11/12 h-5/6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Debug Dashboard</h2>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Auto Refresh</span>
            </label>
            <button
              onClick={handleExportSession}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Export
            </button>
            <button
              onClick={handleClearSession}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              Clear
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>

        {/* Statistics Overview */}
        {statistics && (
          <div className="p-4 bg-gray-50 border-b">
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{statistics.errorsCount}</div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{statistics.performanceScore}</div>
                <div className="text-sm text-gray-600">Performance Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{statistics.networkRequestsCount}</div>
                <div className="text-sm text-gray-600">Network Requests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{statistics.userActionsCount}</div>
                <div className="text-sm text-gray-600">User Actions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {Math.round(statistics.sessionDuration / 1000)}s
                </div>
                <div className="text-sm text-gray-600">Session Duration</div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b">
          {['errors', 'performance', 'network', 'console', 'actions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'errors' && <ErrorsTab />}
          {activeTab === 'performance' && <PerformanceTab />}
          {activeTab === 'network' && <NetworkTab />}
          {activeTab === 'console' && <ConsoleTab />}
          {activeTab === 'actions' && <ActionsTab />}
        </div>
      </div>
    </div>
  );
};

const ErrorsTab: React.FC = () => {
  const [errors, setErrors] = useState<any[]>([]);

  useEffect(() => {
    // Access errors from debugging agent
    setErrors((frontendDebuggingAgent as any).debugSession.errors);
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">JavaScript Errors</h3>
      {errors.length === 0 ? (
        <p className="text-gray-600">No errors recorded</p>
      ) : (
        <div className="space-y-2">
          {errors.map((error) => (
            <div key={error.id} className="border rounded p-3 bg-red-50">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded text-xs ${
                  error.severity === 'critical' ? 'bg-red-600 text-white' :
                  error.severity === 'high' ? 'bg-red-500 text-white' :
                  error.severity === 'medium' ? 'bg-yellow-500 text-white' :
                  'bg-gray-500 text-white'
                }`}>
                  {error.severity}
                </span>
                <span className="text-sm text-gray-600">
                  {new Date(error.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="mt-2">
                <div className="font-medium">{error.message}</div>
                <div className="text-sm text-gray-600">{error.url}</div>
                {error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-blue-600">Stack Trace</summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PerformanceTab: React.FC = () => {
  const [performance, setPerformance] = useState<any>(null);

  useEffect(() => {
    setPerformance((frontendDebuggingAgent as any).debugSession.performance);
  }, []);

  if (!performance) return <div>Loading performance data...</div>;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Performance Metrics</h3>
      
      {/* Core Web Vitals */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <h4 className="font-medium mb-2">Core Web Vitals</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>First Contentful Paint:</span>
              <span className={performance.firstContentfulPaint > 2000 ? 'text-red-600' : 'text-green-600'}>
                {Math.round(performance.firstContentfulPaint)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span>Largest Contentful Paint:</span>
              <span className={performance.largestContentfulPaint > 4000 ? 'text-red-600' : 'text-green-600'}>
                {Math.round(performance.largestContentfulPaint)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span>First Input Delay:</span>
              <span className={performance.firstInputDelay > 100 ? 'text-red-600' : 'text-green-600'}>
                {Math.round(performance.firstInputDelay)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span>Cumulative Layout Shift:</span>
              <span className={performance.cumulativeLayoutShift > 0.1 ? 'text-red-600' : 'text-green-600'}>
                {performance.cumulativeLayoutShift.toFixed(3)}
              </span>
            </div>
          </div>
        </div>

        <div className="border rounded p-4">
          <h4 className="font-medium mb-2">Page Metrics</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Page Load Time:</span>
              <span>{Math.round(performance.pageLoadTime)}ms</span>
            </div>
            <div className="flex justify-between">
              <span>Time to Interactive:</span>
              <span>{Math.round(performance.timeToInteractive)}ms</span>
            </div>
            {performance.memoryUsage && (
              <>
                <div className="flex justify-between">
                  <span>Memory Used:</span>
                  <span>{Math.round(performance.memoryUsage.used / 1024 / 1024)}MB</span>
                </div>
                <div className="flex justify-between">
                  <span>Memory Total:</span>
                  <span>{Math.round(performance.memoryUsage.total / 1024 / 1024)}MB</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Resource Timings */}
      <div>
        <h4 className="font-medium mb-2">Resource Timings</h4>
        <div className="max-h-64 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left">Resource</th>
                <th className="text-left">Type</th>
                <th className="text-right">Duration</th>
                <th className="text-right">Size</th>
              </tr>
            </thead>
            <tbody>
              {performance.resourceTimings.map((resource: any, index: number) => (
                <tr key={index} className="border-b">
                  <td className="truncate max-w-xs">{resource.name}</td>
                  <td>{resource.type}</td>
                  <td className="text-right">{Math.round(resource.duration)}ms</td>
                  <td className="text-right">{Math.round(resource.size / 1024)}KB</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const NetworkTab: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    setRequests((frontendDebuggingAgent as any).debugSession.network);
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Network Requests</h3>
      <div className="max-h-96 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left">Method</th>
              <th className="text-left">URL</th>
              <th className="text-left">Status</th>
              <th className="text-right">Duration</th>
              <th className="text-right">Size</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id} className="border-b">
                <td className="font-medium">{request.method}</td>
                <td className="truncate max-w-xs">{request.url}</td>
                <td>
                  <span className={`px-2 py-1 rounded text-xs ${
                    request.status >= 200 && request.status < 300 ? 'bg-green-100 text-green-800' :
                    request.status >= 400 ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {request.status || 'Error'}
                  </span>
                </td>
                <td className="text-right">{request.duration}ms</td>
                <td className="text-right">{Math.round(request.responseSize / 1024)}KB</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ConsoleTab: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    setLogs((frontendDebuggingAgent as any).debugSession.console);
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Console Logs</h3>
      <div className="max-h-96 overflow-auto space-y-1">
        {logs.map((log, index) => (
          <div key={index} className={`p-2 rounded text-sm ${
            log.level === 'error' ? 'bg-red-50 text-red-800' :
            log.level === 'warn' ? 'bg-yellow-50 text-yellow-800' :
            log.level === 'info' ? 'bg-blue-50 text-blue-800' :
            'bg-gray-50 text-gray-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-medium uppercase">{log.level}</span>
              <span className="text-xs opacity-60">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="mt-1">{log.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ActionsTab: React.FC = () => {
  const [actions, setActions] = useState<any[]>([]);

  useEffect(() => {
    setActions((frontendDebuggingAgent as any).debugSession.userActions);
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">User Actions</h3>
      <div className="max-h-96 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left">Time</th>
              <th className="text-left">Type</th>
              <th className="text-left">Element</th>
              <th className="text-left">Details</th>
            </tr>
          </thead>
          <tbody>
            {actions.map((action) => (
              <tr key={action.id} className="border-b">
                <td>{new Date(action.timestamp).toLocaleTimeString()}</td>
                <td>
                  <span className={`px-2 py-1 rounded text-xs ${
                    action.type === 'click' ? 'bg-blue-100 text-blue-800' :
                    action.type === 'scroll' ? 'bg-green-100 text-green-800' :
                    action.type === 'form_submit' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {action.type}
                  </span>
                </td>
                <td className="truncate max-w-xs">{action.element}</td>
                <td className="truncate max-w-xs">
                  {action.coordinates && `(${action.coordinates.x}, ${action.coordinates.y})`}
                  {action.value && action.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};