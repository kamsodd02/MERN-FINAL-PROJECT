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
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-secondary-500 animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
        </div>
      </div>
    );
  }

  const stats = analytics?.overview || {};
  const recentQuestionnaires = questionnaires.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Dashboard</h1>
          <p className="text-neutral-600 text-lg">Welcome back! Here's what's happening with your questionnaires.</p>
        </div>
        <Link
          to="/questionnaires/new"
          className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-soft hover:shadow-medium transition-all duration-300"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          New Questionnaire
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-soft border border-neutral-200 hover:shadow-medium transition-all duration-300 animate-fade-in">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl shadow-soft">
              <FileText className="h-7 w-7 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Total Questionnaires</p>
              <p className="text-3xl font-bold text-neutral-900">{stats.totalQuestionnaires || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-soft border border-neutral-200 hover:shadow-medium transition-all duration-300 animate-fade-in" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-xl shadow-soft">
              <CheckCircle className="h-7 w-7 text-secondary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Total Responses</p>
              <p className="text-3xl font-bold text-neutral-900">{stats.totalResponses || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-soft border border-neutral-200 hover:shadow-medium transition-all duration-300 animate-fade-in" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-accent-100 to-accent-200 rounded-xl shadow-soft">
              <TrendingUp className="h-7 w-7 text-accent-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Completion Rate</p>
              <p className="text-3xl font-bold text-neutral-900">
                {stats.completionRate ? `${stats.completionRate.toFixed(1)}%` : '0%'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-soft border border-neutral-200 hover:shadow-medium transition-all duration-300 animate-fade-in" style={{animationDelay: '0.3s'}}>
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl shadow-soft">
              <Clock className="h-7 w-7 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-600">Recent Activity</p>
              <p className="text-3xl font-bold text-neutral-900">{analytics?.recentActivity?.responses || 0}</p>
              <p className="text-xs text-neutral-500">last 7 days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Questionnaires */}
      <div className="bg-white shadow-soft rounded-xl border border-neutral-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-white">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-neutral-900">Recent Questionnaires</h2>
            <Link
              to="/questionnaires"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              View all →
            </Link>
          </div>
        </div>
        <div className="divide-y divide-neutral-100">
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
            <div className="px-6 py-12 text-center">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-12 w-12 text-neutral-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No questionnaires yet</h3>
              <p className="text-neutral-600 mb-6 max-w-sm mx-auto">
                Get started by creating your first questionnaire. It's easy and takes just a few minutes.
              </p>
              <Link
                to="/questionnaires/new"
                className="inline-flex items-center px-6 py-3 border border-transparent shadow-soft text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 hover:shadow-medium transition-all duration-300"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Create Your First Questionnaire
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-soft rounded-xl border border-neutral-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-white">
          <h2 className="text-xl font-semibold text-neutral-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/questionnaires/new"
              className="group flex items-center p-5 border border-neutral-200 rounded-xl hover:border-primary-300 hover:bg-gradient-to-br hover:from-primary-50 hover:to-primary-100 transition-all duration-300 shadow-soft hover:shadow-medium"
            >
              <div className="p-3 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl mr-4 group-hover:scale-110 transition-transform duration-300">
                <PlusCircle className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-neutral-900">Create Questionnaire</h3>
                <p className="text-sm text-neutral-600">Start building a new form</p>
              </div>
            </Link>

            <Link
              to="/workspaces"
              className="group flex items-center p-5 border border-neutral-200 rounded-xl hover:border-secondary-300 hover:bg-gradient-to-br hover:from-secondary-50 hover:to-secondary-100 transition-all duration-300 shadow-soft hover:shadow-medium"
            >
              <div className="p-3 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-xl mr-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6 text-secondary-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-neutral-900">Manage Workspaces</h3>
                <p className="text-sm text-neutral-600">Collaborate with your team</p>
              </div>
            </Link>

            <Link
              to="/analytics"
              className="group flex items-center p-5 border border-neutral-200 rounded-xl hover:border-accent-300 hover:bg-gradient-to-br hover:from-accent-50 hover:to-accent-100 transition-all duration-300 shadow-soft hover:shadow-medium"
            >
              <div className="p-3 bg-gradient-to-br from-accent-100 to-accent-200 rounded-xl mr-4 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-6 w-6 text-accent-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-neutral-900">View Analytics</h3>
                <p className="text-sm text-neutral-600">Analyze your responses</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;