import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  FileText,
  Users,
  BarChart3,
  TrendingUp,
  PlusCircle,
  Eye,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useQuestionnaire } from '../../contexts/QuestionnaireContext';

const Dashboard = () => {
  const { questionnaires, fetchQuestionnaires } = useQuestionnaire();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        await fetchQuestionnaires({ limit: 5 });
        const analyticsResponse = await axios.get('/analytics/dashboard');
        setAnalytics(analyticsResponse.data);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [fetchQuestionnaires]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = analytics?.overview || {};
  const recentQuestionnaires = questionnaires.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your questionnaires.</p>
        </div>
        <Link
          to="/questionnaires/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          New Questionnaire
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Questionnaires</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalQuestionnaires || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Responses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalResponses || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.completionRate ? `${stats.completionRate.toFixed(1)}%` : '0%'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recent Activity</p>
              <p className="text-2xl font-bold text-gray-900">{analytics?.recentActivity?.responses || 0}</p>
              <p className="text-xs text-gray-500">last 7 days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Questionnaires */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Recent Questionnaires</h2>
            <Link
              to="/questionnaires"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              View all
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {recentQuestionnaires.length > 0 ? (
            recentQuestionnaires.map((questionnaire) => (
              <div key={questionnaire._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {questionnaire.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {questionnaire.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      questionnaire.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : questionnaire.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {questionnaire.status}
                    </span>
                    <Link
                      to={`/questionnaires/${questionnaire._id}`}
                      className="text-blue-600 hover:text-blue-500 text-sm"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No questionnaires</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first questionnaire.
              </p>
              <div className="mt-6">
                <Link
                  to="/questionnaires/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Questionnaire
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/questionnaires/new"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <PlusCircle className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">Create Questionnaire</h3>
                <p className="text-sm text-gray-500">Start building a new form</p>
              </div>
            </Link>

            <Link
              to="/workspaces"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <Users className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">Manage Workspaces</h3>
                <p className="text-sm text-gray-500">Collaborate with your team</p>
              </div>
            </Link>

            <Link
              to="/analytics"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <BarChart3 className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">View Analytics</h3>
                <p className="text-sm text-gray-500">Analyze your responses</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;