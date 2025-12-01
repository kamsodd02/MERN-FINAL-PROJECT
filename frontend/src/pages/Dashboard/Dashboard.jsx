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
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 rounded-3xl p-10 text-white shadow-large animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20"></div>
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-white/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-white/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-bounce-subtle"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div>
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-primary-100 bg-clip-text text-transparent">
                Welcome back! 👋
              </h1>
              <p className="text-xl text-white/90 leading-relaxed">
                Here's what's happening with your questionnaires today.
              </p>
            </div>
            <Link
              to="/questionnaires/new"
              className="inline-flex items-center px-10 py-5 border-2 border-white/30 text-lg font-bold rounded-2xl text-white bg-white/20 backdrop-blur-sm hover:bg-white/30 hover:border-white/50 shadow-large hover:shadow-glow transition-all duration-300 group"
            >
              <PlusCircle className="mr-3 h-7 w-7 group-hover:rotate-90 transition-transform duration-300" />
              Create New Questionnaire
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-8 rounded-3xl shadow-large hover:shadow-glow transition-all duration-500 animate-fade-in group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent group-hover:from-white/20 group-hover:to-white/5 transition-all duration-300"></div>
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/25 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 animate-pulse"></div>
          <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-primary-300/30 rounded-full blur-xl animate-bounce-subtle"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-white/25 backdrop-blur-sm rounded-2xl shadow-soft">
                <FileText className="h-8 w-8 text-white drop-shadow-lg" />
              </div>
              <div className="p-2 bg-white/20 rounded-xl">
                <TrendingUp className="h-5 w-5 text-primary-100" />
              </div>
            </div>
            <div>
              <p className="text-primary-100 text-sm font-semibold mb-2 uppercase tracking-wide">Total Questionnaires</p>
              <p className="text-5xl font-black text-white drop-shadow-lg">{stats.totalQuestionnaires || 0}</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-secondary-500 via-secondary-600 to-secondary-700 p-8 rounded-3xl shadow-large hover:shadow-glow transition-all duration-500 animate-fade-in group cursor-pointer" style={{animationDelay: '0.1s'}}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent group-hover:from-white/20 group-hover:to-white/5 transition-all duration-300"></div>
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/25 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-secondary-300/30 rounded-full blur-xl animate-bounce-subtle" style={{animationDelay: '0.5s'}}></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-white/25 backdrop-blur-sm rounded-2xl shadow-soft">
                <CheckCircle className="h-8 w-8 text-white drop-shadow-lg" />
              </div>
              <div className="p-2 bg-white/20 rounded-xl">
                <TrendingUp className="h-5 w-5 text-secondary-100" />
              </div>
            </div>
            <div>
              <p className="text-secondary-100 text-sm font-semibold mb-2 uppercase tracking-wide">Total Responses</p>
              <p className="text-5xl font-black text-white drop-shadow-lg">{stats.totalResponses || 0}</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-accent-500 via-accent-600 to-accent-700 p-8 rounded-3xl shadow-large hover:shadow-glow transition-all duration-500 animate-fade-in group cursor-pointer" style={{animationDelay: '0.2s'}}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent group-hover:from-white/20 group-hover:to-white/5 transition-all duration-300"></div>
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/25 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-accent-300/30 rounded-full blur-xl animate-bounce-subtle" style={{animationDelay: '1s'}}></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-white/25 backdrop-blur-sm rounded-2xl shadow-soft">
                <TrendingUp className="h-8 w-8 text-white drop-shadow-lg" />
              </div>
              <div className="p-2 bg-white/20 rounded-xl">
                <TrendingUp className="h-5 w-5 text-accent-100" />
              </div>
            </div>
            <div>
              <p className="text-accent-100 text-sm font-semibold mb-2 uppercase tracking-wide">Completion Rate</p>
              <p className="text-5xl font-black text-white drop-shadow-lg">
                {stats.completionRate ? `${stats.completionRate.toFixed(1)}%` : '0%'}
              </p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-secondary-600 to-accent-600 p-8 rounded-3xl shadow-large hover:shadow-glow transition-all duration-500 animate-fade-in group cursor-pointer" style={{animationDelay: '0.3s'}}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent group-hover:from-white/20 group-hover:to-white/5 transition-all duration-300"></div>
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/25 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 animate-pulse" style={{animationDelay: '3s'}}></div>
          <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-primary-300/30 rounded-full blur-xl animate-bounce-subtle" style={{animationDelay: '1.5s'}}></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-white/25 backdrop-blur-sm rounded-2xl shadow-soft">
                <Clock className="h-8 w-8 text-white drop-shadow-lg" />
              </div>
              <div className="p-2 bg-white/20 rounded-xl">
                <TrendingUp className="h-5 w-5 text-primary-100" />
              </div>
            </div>
            <div>
              <p className="text-primary-100 text-sm font-semibold mb-2 uppercase tracking-wide">Recent Activity</p>
              <p className="text-5xl font-black text-white drop-shadow-lg">{analytics?.recentActivity?.responses || 0}</p>
              <p className="text-sm text-primary-200 mt-2 font-medium">last 7 days</p>
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