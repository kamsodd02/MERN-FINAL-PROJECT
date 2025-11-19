import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, Filter } from 'lucide-react';
import { useQuestionnaire } from '../../contexts/QuestionnaireContext';

const QuestionnaireList = () => {
  const { questionnaires, loading, fetchQuestionnaires } = useQuestionnaire();

  useEffect(() => {
    fetchQuestionnaires();
  }, [fetchQuestionnaires]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Questionnaires</h1>
          <p className="text-gray-600">Manage your questionnaires and forms</p>
        </div>
        <Link
          to="/questionnaires/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          New Questionnaire
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search questionnaires..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Questionnaire List */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        {questionnaires.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {questionnaires.map((questionnaire) => (
              <div key={questionnaire._id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {questionnaire.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {questionnaire.description || 'No description'}
                    </p>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <span>Status: {questionnaire.status}</span>
                      <span>Responses: {questionnaire.stats?.totalResponses || 0}</span>
                      <span>Created: {new Date(questionnaire.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Link
                      to={`/questionnaires/${questionnaire._id}`}
                      className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                    >
                      View
                    </Link>
                    <Link
                      to={`/questionnaires/${questionnaire._id}/edit`}
                      className="text-gray-600 hover:text-gray-500 text-sm font-medium"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <PlusCircle className="mx-auto h-12 w-12 text-gray-400" />
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
  );
};

export default QuestionnaireList;