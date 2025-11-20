import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuestionnaire } from '../../contexts/QuestionnaireContext';
import {
  Plus,
  Trash2,
  Save,
  Eye,
  Settings,
  ArrowLeft,
  GripVertical,
  Type,
  List,
  CheckSquare,
  Star,
  MessageSquare,
  Calendar,
  Upload,
  Hash
} from 'lucide-react';
import toast from 'react-hot-toast';

const QUESTION_TYPES = [
  { id: 'text_short', label: 'Short Text', icon: Type, description: 'Single line text input' },
  { id: 'text_long', label: 'Long Text', icon: MessageSquare, description: 'Multi-line text input' },
  { id: 'multiple_choice', label: 'Multiple Choice', icon: List, description: 'Single selection from options' },
  { id: 'checkboxes', label: 'Checkboxes', icon: CheckSquare, description: 'Multiple selections from options' },
  { id: 'rating', label: 'Rating', icon: Star, description: 'Star rating scale' },
  { id: 'scale', label: 'Scale', icon: Hash, description: 'Numeric scale (1-10)' },
  { id: 'date', label: 'Date', icon: Calendar, description: 'Date picker' },
  { id: 'time', label: 'Time', icon: Calendar, description: 'Time picker' }
];

const QuestionnaireBuilder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const { createQuestionnaire, updateQuestionnaire, fetchQuestionnaire, currentQuestionnaire, loading } = useQuestionnaire();

  const [questions, setQuestions] = useState([]);
  const [showQuestionTypeSelector, setShowQuestionTypeSelector] = useState(false);
  const [draggedQuestion, setDraggedQuestion] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      category: 'survey'
    }
  });

  const title = watch('title');

  useEffect(() => {
    if (isEditing && id) {
      fetchQuestionnaire(id);
    }
  }, [isEditing, id, fetchQuestionnaire]);

  useEffect(() => {
    if (currentQuestionnaire && isEditing) {
      setValue('title', currentQuestionnaire.title);
      setValue('description', currentQuestionnaire.description || '');
      setValue('category', currentQuestionnaire.category || 'survey');
      setQuestions(currentQuestionnaire.questions || []);
    }
  }, [currentQuestionnaire, isEditing, setValue]);

  const addQuestion = (type) => {
    const newQuestion = {
      id: `q${Date.now()}`,
      type,
      title: '',
      description: '',
      required: false,
      order: questions.length + 1,
      options: type === 'multiple_choice' || type === 'checkboxes' ? [
        { id: 'opt1', text: 'Option 1' },
        { id: 'opt2', text: 'Option 2' }
      ] : []
    };

    if (type === 'rating') {
      newQuestion.validation = { min: 1, max: 5 };
    } else if (type === 'scale') {
      newQuestion.validation = { min: 1, max: 10 };
    }

    setQuestions([...questions, newQuestion]);
    setShowQuestionTypeSelector(false);
  };

  const updateQuestion = (questionId, updates) => {
    setQuestions(questions.map(q =>
      q.id === questionId ? { ...q, ...updates } : q
    ));
  };

  const deleteQuestion = (questionId) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const addOption = (questionId) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newOption = {
          id: `opt${Date.now()}`,
          text: `Option ${q.options.length + 1}`
        };
        return { ...q, options: [...q.options, newOption] };
      }
      return q;
    }));
  };

  const updateOption = (questionId, optionId, text) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          options: q.options.map(opt =>
            opt.id === optionId ? { ...opt, text } : opt
          )
        };
      }
      return q;
    }));
  };

  const deleteOption = (questionId, optionId) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return { ...q, options: q.options.filter(opt => opt.id !== optionId) };
      }
      return q;
    }));
  };

  const moveQuestion = (fromIndex, toIndex) => {
    const newQuestions = [...questions];
    const [moved] = newQuestions.splice(fromIndex, 1);
    newQuestions.splice(toIndex, 0, moved);

    // Update order
    newQuestions.forEach((q, index) => {
      q.order = index + 1;
    });

    setQuestions(newQuestions);
  };

  const onSubmit = async (data) => {
    if (questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    // Validate questions
    for (const question of questions) {
      if (!question.title.trim()) {
        toast.error('All questions must have a title');
        return;
      }

      if ((question.type === 'multiple_choice' || question.type === 'checkboxes') &&
          question.options.length < 2) {
        toast.error('Multiple choice and checkbox questions must have at least 2 options');
        return;
      }
    }

    const questionnaireData = {
      ...data,
      questions: questions.map((q, index) => ({
        ...q,
        order: index + 1
      }))
    };

    try {
      if (isEditing) {
        await updateQuestionnaire(id, questionnaireData);
        navigate(`/questionnaires/${id}`);
      } else {
        const result = await createQuestionnaire(questionnaireData);
        if (result) {
          navigate(`/questionnaires/${result._id}`);
        }
      }
    } catch (error) {
      console.error('Error saving questionnaire:', error);
    }
  };

  const QuestionTypeIcon = ({ type }) => {
    const questionType = QUESTION_TYPES.find(qt => qt.id === type);
    const Icon = questionType?.icon || Type;
    return <Icon className="h-5 w-5" />;
  };

  if (loading && isEditing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/questionnaires')}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Questionnaire' : 'Create Questionnaire'}
            </h1>
            <p className="text-gray-600">
              {isEditing ? 'Update your questionnaire details and questions' : 'Build your questionnaire with our drag-and-drop editor'}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {settingsOpen && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Questionnaire Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="questionnaire-category"
                {...register('category')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="survey">Survey</option>
                <option value="quiz">Quiz</option>
                <option value="feedback">Feedback</option>
                <option value="registration">Registration</option>
                <option value="assessment">Assessment</option>
                <option value="poll">Poll</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              id="questionnaire-title"
              type="text"
              {...register('title', { required: 'Title is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter questionnaire title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="questionnaire-description"
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter questionnaire description (optional)"
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Questions</h2>
          <span className="text-sm text-gray-500">{questions.length} questions</span>
        </div>

        {/* Question List */}
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="flex items-center space-x-2">
                  <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                  <span className="text-sm font-medium text-gray-500">{index + 1}</span>
                </div>

                <div className="flex-1 space-y-4">
                  {/* Question Header */}
                  <div className="flex items-center space-x-3">
                    <QuestionTypeIcon type={question.type} />
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {QUESTION_TYPES.find(qt => qt.id === question.type)?.label}
                    </span>
                  </div>

                  {/* Question Title */}
                  <input
                    id={`question-title-${question.id}`}
                    type="text"
                    value={question.title}
                    onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter question title"
                  />

                  {/* Question Description */}
                  <input
                    id={`question-description-${question.id}`}
                    type="text"
                    value={question.description || ''}
                    onChange={(e) => updateQuestion(question.id, { description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Question description (optional)"
                  />

                  {/* Options for multiple choice/checkboxes */}
                  {(question.type === 'multiple_choice' || question.type === 'checkboxes') && (
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <input
                            id={`option-${question.id}-${option.id}`}
                            type="text"
                            value={option.text}
                            onChange={(e) => updateOption(question.id, option.id, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Option text"
                          />
                          <button
                            onClick={() => deleteOption(question.id, option.id)}
                            className="p-2 text-red-500 hover:text-red-700"
                            disabled={question.options.length <= 2}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addOption(question.id)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        + Add option
                      </button>
                    </div>
                  )}

                  {/* Validation for rating/scale */}
                  {(question.type === 'rating' || question.type === 'scale') && (
                    <div className="flex space-x-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Min</label>
                        <input
                          id={`question-min-${question.id}`}
                          type="number"
                          value={question.validation?.min || 1}
                          onChange={(e) => updateQuestion(question.id, {
                            validation: { ...question.validation, min: parseInt(e.target.value) }
                          })}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Max</label>
                        <input
                          id={`question-max-${question.id}`}
                          type="number"
                          value={question.validation?.max || (question.type === 'rating' ? 5 : 10)}
                          onChange={(e) => updateQuestion(question.id, {
                            validation: { ...question.validation, max: parseInt(e.target.value) }
                          })}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Question Settings */}
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Required</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={() => deleteQuestion(question.id)}
                  className="p-2 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Question */}
        <div className="relative">
          {showQuestionTypeSelector ? (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Question Type</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {QUESTION_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => addQuestion(type.id)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left"
                    >
                      <Icon className="h-8 w-8 text-blue-600 mb-2" />
                      <div className="font-medium text-gray-900">{type.label}</div>
                      <div className="text-sm text-gray-500">{type.description}</div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowQuestionTypeSelector(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowQuestionTypeSelector(true)}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 flex items-center justify-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Question</span>
            </button>
          )}
        </div>
      </div>

      {/* Preview */}
      {questions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Preview</h3>
            <button
              onClick={() => window.open(`/questionnaire/${id || 'preview'}`, '_blank')}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              <Eye className="h-4 w-4 mr-1" />
              Full Preview
            </button>
          </div>
          <div className="text-sm text-gray-600">
            {title ? `"${title}"` : 'Untitled Questionnaire'} with {questions.length} question{questions.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionnaireBuilder;