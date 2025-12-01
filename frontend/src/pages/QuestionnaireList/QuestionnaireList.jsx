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
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-secondary-500 animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Questionnaires</h1>
          <p className="text-neutral-600 text-lg">Manage your questionnaires and forms</p>
        </div>
        <Link
          to="/questionnaires/new"
          className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-soft hover:shadow-medium transition-all duration-300"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          New Questionnaire
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow-soft border border-neutral-200">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search questionnaires..."
                className="w-full pl-12 pr-4 py-3 border border-neutral-300 rounded-xl placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 shadow-soft focus:shadow-medium"
              />
            </div>
          </div>
          <button className="inline-flex items-center px-6 py-3 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 shadow-soft hover:shadow-medium transition-all duration-200">
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </button>
        </div>
      </div>

      {/* Questionnaire List */}
      <div className="bg-white shadow-soft rounded-xl border border-neutral-200 overflow-hidden">
        {questionnaires.length > 0 ? (
          <div className="divide-y divide-neutral-100">
            {questionnaires.map((questionnaire) => (
              <div key={questionnaire._id} className="p-6 hover:bg-neutral-50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-neutral-900">
                      {questionnaire.title}
                    </h3>
                    <p className="mt-2 text-neutral-600">
                      {questionnaire.description || 'No description'}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        questionnaire.status === 'published'
                          ? 'bg-secondary-100 text-secondary-800'
                          : questionnaire.status === 'draft'
                          ? 'bg-accent-100 text-accent-800'
                          : 'bg-neutral-100 text-neutral-800'
                      }`}>
                        {questionnaire.status}
                      </span>
                      <span>Responses: {questionnaire.stats?.totalResponses || 0}</span>
                      <span>Created: {new Date(questionnaire.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Link
                      to={`/questionnaires/${questionnaire._id}`}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors"
                    >
                      View
                    </Link>
                    <Link
                      to={`/questionnaires/${questionnaire._id}/edit`}
                      className="text-neutral-600 hover:text-neutral-700 text-sm font-medium transition-colors"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-full flex items-center justify-center mb-6">
              <PlusCircle className="h-12 w-12 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No questionnaires yet</h3>
            <p className="text-neutral-600 mb-8 max-w-sm mx-auto">
              Create your first questionnaire to start collecting responses and insights.
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
  );
};

export default QuestionnaireList;