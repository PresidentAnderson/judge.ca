import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { 
  FiFolder, FiFileText, FiCalendar, FiMessageSquare, 
  FiDollarSign, FiClock, FiCheckCircle, FiAlertCircle,
  FiDownload, FiUpload, FiEdit, FiTrash2, FiEye,
  FiTrendingUp, FiUser, FiBriefcase
} from 'react-icons/fi';

interface Case {
  id: string;
  caseNumber: string;
  title: string;
  type: string;
  status: 'open' | 'in_progress' | 'pending' | 'closed' | 'on_hold';
  attorney: {
    id: string;
    name: string;
    photo?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  nextHearing?: Date;
  courtName?: string;
  judge?: string;
  description: string;
  estimatedCompletion?: Date;
  totalCost: number;
  paidAmount: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface Document {
  id: string;
  caseId: string;
  name: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
  category: 'court_filing' | 'evidence' | 'contract' | 'correspondence' | 'other';
  url: string;
  status: 'pending_review' | 'reviewed' | 'approved' | 'requires_signature';
}

interface Task {
  id: string;
  caseId: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  assignedTo: 'client' | 'attorney';
  priority: 'low' | 'medium' | 'high';
  completedAt?: Date;
}

interface Activity {
  id: string;
  caseId: string;
  type: 'document_uploaded' | 'status_changed' | 'message_sent' | 'payment_made' | 'hearing_scheduled' | 'task_completed';
  description: string;
  timestamp: Date;
  user: string;
  metadata?: any;
}

interface Invoice {
  id: string;
  caseId: string;
  invoiceNumber: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: Date;
  items: {
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];
}

export const ClientPortal: React.FC = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'tasks' | 'billing' | 'activity'>('overview');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<Document['category']>('other');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClientData();
  }, [user]);

  useEffect(() => {
    if (selectedCase) {
      loadCaseDetails(selectedCase.id);
    }
  }, [selectedCase]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/client/cases', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCases(data.cases);
        if (data.cases.length > 0) {
          setSelectedCase(data.cases[0]);
        }
      }
    } catch (error) {
      console.error('Error loading client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCaseDetails = async (caseId: string) => {
    try {
      const [docsRes, tasksRes, activitiesRes, invoicesRes] = await Promise.all([
        fetch(`/api/cases/${caseId}/documents`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`/api/cases/${caseId}/tasks`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`/api/cases/${caseId}/activities`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`/api/cases/${caseId}/invoices`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData.documents);
      }
      
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks);
      }
      
      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        setActivities(activitiesData.activities);
      }
      
      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        setInvoices(invoicesData.invoices);
      }
    } catch (error) {
      console.error('Error loading case details:', error);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile || !selectedCase) {return;}

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('caseId', selectedCase.id);
    formData.append('category', uploadCategory);

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const newDoc = await response.json();
        setDocuments([...documents, newDoc]);
        setShowUploadModal(false);
        setUploadFile(null);
        
        // Add activity
        const activity: Activity = {
          id: Date.now().toString(),
          caseId: selectedCase.id,
          type: 'document_uploaded',
          description: `Uploaded document: ${newDoc.name}`,
          timestamp: new Date(),
          user: user?.name || 'You'
        };
        setActivities([activity, ...activities]);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
    }
  };

  const handleTaskComplete = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setTasks(tasks.map(task => 
          task.id === taskId 
            ? { ...task, status: 'completed', completedAt: new Date() }
            : task
        ));
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const getStatusColor = (status: Case['status']) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'on_hold': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Case['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const CaseOverview = () => {
    if (!selectedCase) {return null;}

    const progress = (selectedCase.paidAmount / selectedCase.totalCost) * 100;
    const pendingTasks = tasks.filter(t => t.status === 'pending' && t.assignedTo === 'client').length;
    const upcomingDeadlines = tasks
      .filter(t => t.status !== 'completed' && new Date(t.dueDate) > new Date())
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 3);

    return (
      <div className="space-y-6">
        {/* Case Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <FiFolder className="w-8 h-8 text-blue-600" />
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedCase.status)}`}>
                {selectedCase.status.replace('_', ' ')}
              </span>
            </div>
            <h3 className="text-lg font-semibold">{selectedCase.caseNumber}</h3>
            <p className="text-sm text-gray-600 mt-1">{selectedCase.type}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <FiClock className="w-8 h-8 text-orange-600" />
              <span className={`font-semibold ${getPriorityColor(selectedCase.priority)}`}>
                {selectedCase.priority}
              </span>
            </div>
            <h3 className="text-lg font-semibold">{pendingTasks}</h3>
            <p className="text-sm text-gray-600 mt-1">Pending Tasks</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <FiCalendar className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold">
              {selectedCase.nextHearing 
                ? format(new Date(selectedCase.nextHearing), 'MMM d')
                : 'No Hearing'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">Next Hearing</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <FiDollarSign className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">
              ${selectedCase.paidAmount.toLocaleString()}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              of ${selectedCase.totalCost.toLocaleString()}
            </p>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Case Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Case Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Case Information</h4>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Case Title:</dt>
                  <dd className="text-sm font-medium">{selectedCase.title}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Filed Date:</dt>
                  <dd className="text-sm font-medium">
                    {format(new Date(selectedCase.createdAt), 'MMM d, yyyy')}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Last Updated:</dt>
                  <dd className="text-sm font-medium">
                    {format(new Date(selectedCase.updatedAt), 'MMM d, yyyy')}
                  </dd>
                </div>
                {selectedCase.estimatedCompletion && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Est. Completion:</dt>
                    <dd className="text-sm font-medium">
                      {format(new Date(selectedCase.estimatedCompletion), 'MMM d, yyyy')}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Court Information</h4>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Court:</dt>
                  <dd className="text-sm font-medium">{selectedCase.courtName || 'Not assigned'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Judge:</dt>
                  <dd className="text-sm font-medium">{selectedCase.judge || 'Not assigned'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Attorney:</dt>
                  <dd className="text-sm font-medium">{selectedCase.attorney.name}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
            <p className="text-sm text-gray-700">{selectedCase.description}</p>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        {upcomingDeadlines.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Upcoming Deadlines</h3>
            <div className="space-y-3">
              {upcomingDeadlines.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-gray-600">
                      Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleTaskComplete(task.id)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Mark Complete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const DocumentsTab = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Case Documents</h3>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FiUpload className="w-4 h-4 mr-2" />
            Upload Document
          </button>
        </div>
      </div>

      <div className="p-6">
        {documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <FiFileText className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-gray-600">
                      {doc.category.replace('_', ' ')} • {(doc.size / 1024).toFixed(2)} KB • 
                      Uploaded {format(new Date(doc.uploadedAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                    doc.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                    doc.status === 'requires_signature' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {doc.status.replace('_', ' ')}
                  </span>
                  <button className="p-2 text-gray-600 hover:text-blue-600">
                    <FiEye className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-blue-600">
                    <FiDownload className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FiFolder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No documents uploaded yet</p>
          </div>
        )}
      </div>
    </div>
  );

  const TasksTab = () => {
    const clientTasks = tasks.filter(t => t.assignedTo === 'client');
    const attorneyTasks = tasks.filter(t => t.assignedTo === 'attorney');

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Your Tasks</h3>
          {clientTasks.length > 0 ? (
            <div className="space-y-3">
              {clientTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      onChange={() => handleTaskComplete(task.id)}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <div>
                      <p className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                        {task.title}
                      </p>
                      <p className="text-sm text-gray-600">{task.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No tasks assigned to you</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Attorney Tasks</h3>
          {attorneyTasks.length > 0 ? (
            <div className="space-y-3">
              {attorneyTasks.map(task => (
                <div key={task.id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-gray-600">{task.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No tasks assigned to attorney</p>
          )}
        </div>
      </div>
    );
  };

  const BillingTab = () => {
    const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaid = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
    const outstanding = totalBilled - totalPaid;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <FiDollarSign className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold">${totalBilled.toLocaleString()}</h3>
            <p className="text-sm text-gray-600">Total Billed</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <FiCheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold">${totalPaid.toLocaleString()}</h3>
            <p className="text-sm text-gray-600">Total Paid</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <FiAlertCircle className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold">${outstanding.toLocaleString()}</h3>
            <p className="text-sm text-gray-600">Outstanding</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-xl font-semibold">Invoices</h3>
          </div>
          <div className="p-6">
            {invoices.length > 0 ? (
              <div className="space-y-3">
                {invoices.map(invoice => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Invoice #{invoice.invoiceNumber}</p>
                      <p className="text-sm text-gray-600">
                        Due: {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-semibold">${invoice.amount.toLocaleString()}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {invoice.status}
                      </span>
                      {invoice.status !== 'paid' && (
                        <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                          Pay Now
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">No invoices yet</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ActivityTab = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h3 className="text-xl font-semibold">Case Activity</h3>
      </div>
      <div className="p-6">
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map(activity => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'status_changed' ? 'bg-blue-600' :
                  activity.type === 'document_uploaded' ? 'bg-green-600' :
                  activity.type === 'message_sent' ? 'bg-purple-600' :
                  activity.type === 'payment_made' ? 'bg-yellow-600' :
                  'bg-gray-600'
                }`} />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">
                    {activity.user} • {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">No activity yet</p>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Client Portal</h1>
          <p className="text-gray-600 mt-2">Manage your cases, documents, and communications</p>
        </div>

        {/* Case Selector */}
        {cases.length > 1 && (
          <div className="mb-6">
            <select
              value={selectedCase?.id || ''}
              onChange={(e) => {
                const case_ = cases.find(c => c.id === e.target.value);
                setSelectedCase(case_ || null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {cases.map(case_ => (
                <option key={case_.id} value={case_.id}>
                  {case_.caseNumber} - {case_.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {(['overview', 'documents', 'tasks', 'billing', 'activity'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <CaseOverview />}
        {activeTab === 'documents' && <DocumentsTab />}
        {activeTab === 'tasks' && <TasksTab />}
        {activeTab === 'billing' && <BillingTab />}
        {activeTab === 'activity' && <ActivityTab />}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Upload Document</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File
                </label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as Document['category'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="court_filing">Court Filing</option>
                  <option value="evidence">Evidence</option>
                  <option value="contract">Contract</option>
                  <option value="correspondence">Correspondence</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFileUpload}
                disabled={!uploadFile}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};