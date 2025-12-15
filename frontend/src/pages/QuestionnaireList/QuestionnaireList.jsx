import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Search, Filter, FileText, CheckCircle, Clock, Eye } from 'lucide-react';
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
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-secondary-500 via-accent-500 to-primary-500 rounded-3xl p-10 text-white shadow-large animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-r from-black/15 via-transparent to-black/15"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-white/10 rounded-full blur-2xl animate-bounce-subtle"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div>
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-secondary-100 bg-clip-text text-transparent">
                Your Questionnaires 📋
              </h1>
              <p className="text-xl text-white/90 leading-relaxed">
                Create, manage, and analyze all your forms in one beautiful place.
              </p>
            </div>
            <Link
              to="/app/questionnaires/new"
              className="inline-flex items-center px-10 py-5 border-2 border-white/30 text-lg font-bold rounded-2xl text-white bg-white/20 backdrop-blur-sm hover:bg-white/30 hover:border-white/50 shadow-large hover:shadow-glow transition-all duration-300 group transform hover:scale-105 active:scale-95"
            >
              <PlusCircle className="mr-3 h-7 w-7 group-hover:rotate-90 transition-transform duration-300" />
              Create New Questionnaire
            </Link>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-10 rounded-3xl shadow-large border border-neutral-200 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-50/60 via-secondary-50/40 to-accent-50/60"></div>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-primary-200/30 to-secondary-200/30 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-accent-200/30 to-primary-200/30 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row space-y-8 lg:space-y-0 lg:space-x-8">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-5 top-5 h-7 w-7 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search your questionnaires..."
                  className="w-full pl-16 pr-8 py-5 text-xl border-2 border-neutral-300 rounded-2xl placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 shadow-soft focus:shadow-medium bg-white/90 backdrop-blur-sm"
                />
              </div>
            </div>
            <button className="inline-flex items-center px-10 py-5 border-2 border-neutral-300 rounded-2xl text-lg font-semibold text-neutral-700 bg-white hover:bg-neutral-50 shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-105 active:scale-95 group">
              <Filter className="mr-3 h-7 w-7 group-hover:rotate-12 transition-transform duration-300" />
              Advanced Filters
            </button>
          </div>
        </div>
      </div>

      {/* Questionnaire List */}
      <div className="bg-white shadow-large rounded-2xl border border-neutral-200 overflow-hidden">
        {questionnaires.length > 0 ? (
          <div className="divide-y divide-neutral-100">
            {questionnaires.map((questionnaire, index) => (
              <div key={questionnaire._id} className="group p-8 hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-secondary-50/50 transition-all duration-300 animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className={`p-4 rounded-xl shadow-soft group-hover:scale-110 transition-transform duration-300 ${
                        questionnaire.status === 'published'
                          ? 'bg-gradient-to-br from-secondary-100 to-secondary-200'
                          : questionnaire.status === 'draft'
                          ? 'bg-gradient-to-br from-accent-100 to-accent-200'
                          : 'bg-gradient-to-br from-neutral-100 to-neutral-200'
                      }`}>
                        <FileText className={`h-8 w-8 ${
                          questionnaire.status === 'published'
                            ? 'text-secondary-600'
                            : questionnaire.status === 'draft'
                            ? 'text-accent-600'
                            : 'text-neutral-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-neutral-900 group-hover:text-primary-700 transition-colors">
                          {questionnaire.title}
                        </h3>
                        <p className="mt-2 text-neutral-600 text-lg">
                          {questionnaire.description || 'No description provided'}
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-4">
                          <span className={`inline-flex items-center px-4 py-2 text-sm font-semibold rounded-full shadow-soft ${
                            questionnaire.status === 'published'
                              ? 'bg-secondary-100 text-secondary-800 border border-secondary-200'
                              : questionnaire.status === 'draft'
                              ? 'bg-accent-100 text-accent-800 border border-accent-200'
                              : 'bg-neutral-100 text-neutral-800 border border-neutral-200'
                          }`}>
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              questionnaire.status === 'published'
                                ? 'bg-secondary-500'
                                : questionnaire.status === 'draft'
                                ? 'bg-accent-500'
                                : 'bg-neutral-500'
                            }`}></div>
                            {questionnaire.status}
                          </span>
                          <div className="flex items-center text-neutral-500">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="font-medium">{questionnaire.stats?.totalResponses || 0} responses</span>
                          </div>
                          <div className="flex items-center text-neutral-500">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>Created {new Date(questionnaire.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Link
                      to={`/app/questionnaires/${questionnaire._id}`}
                      className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-soft hover:shadow-medium transition-all duration-300 group/btn transform hover:scale-105 active:scale-95"
                    >
                      <Eye className="mr-2 h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                      View Results
                    </Link>
                    <Link
                      to={`/app/questionnaires/${questionnaire._id}/edit`}
                      className="inline-flex items-center px-6 py-3 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-semibold rounded-xl shadow-soft hover:shadow-medium transition-all duration-300 transform hover:scale-105 active:scale-95"
                    >
                      Edit Form
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-secondary-50/30 to-accent-50/30 rounded-2xl"></div>
            <div className="relative z-10">
              <div className="mx-auto w-32 h-32 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center mb-8 shadow-large">
                <PlusCircle className="h-16 w-16 text-primary-600" />
              </div>
              <h3 className="text-3xl font-bold text-neutral-900 mb-4">Ready to create your first questionnaire?</h3>
              <p className="text-neutral-600 text-xl mb-10 max-w-lg mx-auto leading-relaxed">
                Start building beautiful forms and collecting valuable insights from your audience. It's quick, easy, and powerful.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  to="/app/questionnaires/new"
                  className="inline-flex items-center px-10 py-5 border border-transparent shadow-large text-lg font-bold rounded-2xl text-white bg-gradient-to-r from-primary-600 via-primary-700 to-secondary-600 hover:from-primary-700 hover:via-primary-800 hover:to-secondary-700 hover:shadow-glow transition-all duration-300 group transform hover:scale-105 active:scale-95"
                >
                  <PlusCircle className="mr-3 h-7 w-7 group-hover:rotate-90 transition-transform duration-300" />
                  Create Your First Questionnaire
                </Link>
                <span className="text-neutral-500 text-sm">No credit card required • Free forever</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionnaireList;