import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Target,
  PieChart,
  Download,
  Share2,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Analytics = () => {
  const { id } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [questionnaire, setQuestionnaire] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [analyticsResponse, questionnaireResponse] = await Promise.all([
          axios.get(`/questionnaires/${id}/analytics`),
          axios.get(`/questionnaires/${id}`)
        ]);

        setAnalytics(analyticsResponse.data);
        setQuestionnaire(questionnaireResponse.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAnalytics();
    }
  }, [id]);

  const exportData = async (format) => {
    try {
      const response = await axios.post(`/responses/export/${id}`, {
        format,
        includeAnalytics: true
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `questionnaire_${id}_analytics.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics || !questionnaire) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Analytics Available</h3>
        <p className="mt-1 text-sm text-gray-500">
          Analytics data could not be loaded.
        </p>
      </div>
    );
  }

  const { summary, questionAnalytics } = analytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link
            to={`/questionnaires/${id}`}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600">{questionnaire.title}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => exportData('xlsx')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </button>
          <button
            onClick={() => exportData('pdf')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Responses</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalResponses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{summary.completionRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Responses</p>
              <p className="text-2xl font-bold text-gray-900">{summary.completedResponses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Completion Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.averageCompletionTime ? `${Math.round(summary.averageCompletionTime / 60)}m` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Question Analytics */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Question Breakdown</h2>

        {questionAnalytics.map((question) => (
          <div key={question.questionId} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{question.questionTitle}</h3>
                <p className="text-sm text-gray-600 capitalize">{question.questionType.replace('_', ' ')}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{question.totalAnswers}</p>
                <p className="text-sm text-gray-600">responses</p>
              </div>
            </div>

            {/* Rating Visualization */}
            {question.questionType === 'rating' && question.averageRating && (
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-gray-700">Average Rating:</span>
                  <span className="text-lg font-bold text-blue-600">{question.averageRating.toFixed(1)}</span>
                  <div className="flex">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={`text-lg ${i < Math.floor(question.averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                {question.ratingDistribution && (
                  <div className="space-y-1">
                    {Object.entries(question.ratingDistribution).map(([rating, count]) => (
                      <div key={rating} className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 w-6">{rating}★</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(count / question.totalAnswers) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Multiple Choice/Checkbox Visualization */}
            {(question.questionType === 'multiple_choice' || question.questionType === 'checkboxes') && question.optionCounts && (
              <div className="space-y-3">
                {Object.entries(question.optionCounts).map(([option, count]) => (
                  <div key={option} className="flex items-center space-x-3">
                    <span className="text-sm text-gray-700 flex-1">{option}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full"
                        style={{ width: `${(count / question.totalAnswers) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12">{count}</span>
                    <span className="text-sm text-gray-600 w-12">
                      {((count / question.totalAnswers) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Text responses summary */}
            {(question.questionType === 'text_short' || question.questionType === 'text_long') && (
              <div className="text-sm text-gray-600">
                {question.totalAnswers} text responses collected
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Response Timeline */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Response Timeline</h3>
        <div className="text-center py-8 text-gray-500">
          <Clock className="mx-auto h-12 w-12 mb-4" />
          <p>Response timeline visualization coming soon</p>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">AI-Powered Insights</h3>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Response Quality</h4>
            <p className="text-sm text-blue-700">
              {summary.completionRate > 80 ? 'High completion rate indicates engaging questions.' :
               summary.completionRate > 60 ? 'Moderate completion rate - consider simplifying questions.' :
               'Low completion rate - questions may be too complex or lengthy.'}
            </p>
          </div>

          {questionAnalytics.some(q => q.questionType === 'rating' && q.averageRating) && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Satisfaction Analysis</h4>
              <p className="text-sm text-green-700">
                Average rating across all rating questions: {
                  (questionAnalytics
                    .filter(q => q.questionType === 'rating' && q.averageRating)
                    .reduce((sum, q) => sum + q.averageRating, 0) /
                   questionAnalytics.filter(q => q.questionType === 'rating' && q.averageRating).length
                  ).toFixed(1)
                }/5
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;