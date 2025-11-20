import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuestionnaire } from '../../contexts/QuestionnaireContext';
import {
  Edit,
  Eye,
  Share2,
  BarChart3,
  Users,
  Settings,
  Copy,
  Trash2,
  Play,
  Pause,
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const QuestionnaireView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchQuestionnaire, publishQuestionnaire, deleteQuestionnaire, currentQuestionnaire, loading } = useQuestionnaire();
  const [responses, setResponses] = useState([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  useEffect(() => {
    if (id) {
      fetchQuestionnaire(id);
      fetchResponses();
    }
  }, [id, fetchQuestionnaire]);

  const fetchResponses = async () => {
    if (!id) return;

    setLoadingResponses(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/responses/questionnaires/${id}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setResponses(data.responses || []);
    } catch (error) {
      console.error('Error fetching responses:', error);
    } finally {
      setLoadingResponses(false);
    }
  };

  const handlePublish = async () => {
    if (!currentQuestionnaire) return;

    const result = await publishQuestionnaire(id);
    if (result) {
      toast.success('Questionnaire published successfully!');
    }
  };

  const handleDelete = async () => {
    if (!currentQuestionnaire) return;

    if (window.confirm('Are you sure you want to delete this questionnaire? This action cannot be undone.')) {
      const success = await deleteQuestionnaire(id);
      if (success) {
        navigate('/questionnaires');
      }
    }
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/questionnaire/${id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied to clipboard!');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'draft':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'closed':
        return <Pause className="h-5 w-5 text-gray-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentQuestionnaire) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Questionnaire Not Found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The questionnaire you're looking for doesn't exist.
        </p>
        <Link
          to="/questionnaires"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Back to Questionnaires
        </Link>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/questionnaire/${id}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link
            to="/questionnaires"
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{currentQuestionnaire.title}</h1>
            <p className="text-gray-600">{currentQuestionnaire.description}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link
            to={`/questionnaires/${id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <Link
            to={`/questionnaires/${id}/analytics`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Link>
          <Link
            to={`/questionnaires/${id}/responses`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Users className="h-4 w-4 mr-2" />
            Responses
          </Link>
        </div>
      </div>

      {/* Status and Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {getStatusIcon(currentQuestionnaire.status)}
            <div>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(currentQuestionnaire.status)}`}>
                {currentQuestionnaire.status}
              </span>
              <p className="text-sm text-gray-600 mt-1">
                {currentQuestionnaire.status === 'published'
                  ? `Published ${new Date(currentQuestionnaire.publishedAt).toLocaleDateString()}`
                  : 'Not published yet'
                }
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            {currentQuestionnaire.status === 'draft' && (
              <button
                onClick={handlePublish}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Publish
              </button>
            )}

            <button
              onClick={copyShareLink}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </button>

            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Share Link */}
      {currentQuestionnaire.status === 'published' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Share Questionnaire</h3>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
            <button
              onClick={copyShareLink}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </button>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview
            </a>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Responses</p>
              <p className="text-2xl font-bold text-gray-900">{currentQuestionnaire.stats?.totalResponses || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{currentQuestionnaire.stats?.completedResponses || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {currentQuestionnaire.stats?.completionRate ? `${currentQuestionnaire.stats.completionRate}%` : '0%'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Questions Preview */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Questions ({currentQuestionnaire.questions?.length || 0})</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {currentQuestionnaire.questions?.map((question, index) => (
            <div key={question.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500">{index + 1}.</span>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{question.title}</h3>
                    <p className="text-sm text-gray-600 capitalize">{question.type.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {question.required && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Required
                    </span>
                  )}
                </div>
              </div>
            </div>
          )) || (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500">No questions added yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Responses */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Recent Responses</h2>
          <Link
            to={`/questionnaires/${id}/responses`}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            View all
          </Link>
        </div>
        <div className="divide-y divide-gray-200">
          {loadingResponses ? (
            <div className="px-6 py-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : responses.length > 0 ? (
            responses.slice(0, 5).map((response) => (
              <div key={response._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Response #{response._id.slice(-6)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(response.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    response.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {response.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No responses yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Responses will appear here once people start answering your questionnaire.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionnaireView;