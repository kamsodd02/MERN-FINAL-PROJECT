import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { CheckCircle, AlertCircle, Star, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const PublicQuestionnaire = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questionnaire, setQuestionnaire] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState({});

  const { handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    const fetchQuestionnaire = async () => {
      try { 
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/questionnaires/preview/${id}`);
        setQuestionnaire(response.data);
      } catch (error) {
        console.error('Error fetching questionnaire:', error);
        toast.error('Questionnaire not found or not publicly available');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchQuestionnaire();
    }
  }, [id, navigate]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleCheckboxChange = (questionId, optionId, checked) => {
    setAnswers(prev => {
      const currentAnswers = prev[questionId] || [];
      if (checked) {
        return {
          ...prev,
          [questionId]: [...currentAnswers, optionId]
        };
      } else {
        return {
          ...prev,
          [questionId]: currentAnswers.filter(id => id !== optionId)
        };
      }
    });
  };

  const onSubmit = async () => {
    // Validate required questions
    const missingRequired = questionnaire.questions.filter(q =>
      q.required && (!answers[q.id] || answers[q.id] === '' || (Array.isArray(answers[q.id]) && answers[q.id].length === 0))
    );

    if (missingRequired.length > 0) {
      toast.error('Please answer all required questions');
      return;
    }

    setSubmitting(true);

    try {
      const formattedAnswers = questionnaire.questions.map(question => ({
        questionId: question.id,
        answer: answers[question.id] || ''
      }));
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/responses/questionnaires/${id}`, {
        answers: formattedAnswers
      });

      setSubmitted(true);
      toast.success('Response submitted successfully!');
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error('Failed to submit response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question) => {
    const value = answers[question.id];

    switch (question.type) {
      case 'text_short':
        return (
          <input
            id={`answer-${question.id}`}
            type="text"
            value={value || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your answer"
            required={question.required}
          />
        );

      case 'text_long':
        return (
          <textarea
            id={`answer-${question.id}`}
            value={value || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your answer"
            required={question.required}
          />
        );

      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {question.options.map((option) => (
              <label key={option.id} className="flex items-center">
                <input
                  id={`option-${question.id}-${option.id}`}
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.id}
                  checked={value === option.id}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                  required={question.required}
                />
                <span className="text-gray-700">{option.text}</span>
              </label>
            ))}
          </div>
        );

      case 'checkboxes':
        return (
          <div className="space-y-2">
            {question.options.map((option) => (
              <label key={option.id} className="flex items-center">
                <input
                  id={`option-${question.id}-${option.id}`}
                  type="checkbox"
                  value={option.id}
                  checked={(value || []).includes(option.id)}
                  onChange={(e) => handleCheckboxChange(question.id, option.id, e.target.checked)}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">{option.text}</span>
              </label>
            ))}
          </div>
        );

      case 'rating':
        const maxRating = question.validation?.max || 5;
        return (
          <div className="flex space-x-1">
            {Array.from({ length: maxRating }, (_, i) => i + 1).map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => handleAnswerChange(question.id, rating.toString())}
                className={`p-1 ${parseInt(value) >= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
              >
                <Star className="h-8 w-8 fill-current" />
              </button>
            ))}
          </div>
        );

      case 'scale':
        const min = question.validation?.min || 1;
        const max = question.validation?.max || 10;
        return (
          <div className="space-y-2">
            <input
              id={`answer-${question.id}`}
              type="range"
              min={min}
              max={max}
              value={value || min}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>{min}</span>
              <span className="font-medium">{value || min}</span>
              <span>{max}</span>
            </div>
          </div>
        );

      case 'date':
        return (
          <input
            id={`answer-${question.id}`}
            type="date"
            value={value || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={question.required}
          />
        );

      case 'time':
        return (
          <input
            id={`answer-${question.id}`}
            type="time"
            value={value || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={question.required}
          />
        );

      default:
        return (
          <input
            id={`answer-${question.id}`}
            type="text"
            value={value || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your answer"
            required={question.required}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!questionnaire) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Questionnaire Not Found</h1>
            <p className="text-gray-600">
              The questionnaire you're looking for doesn't exist or is not publicly available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h1>
            <p className="text-gray-600 mb-6">
              Your response has been submitted successfully.
            </p>
            <p className="text-sm text-gray-500">
              You can now close this window.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{questionnaire.title}</h1>
          {questionnaire.description && (
            <p className="text-gray-600 text-lg">{questionnaire.description}</p>
          )}
          <div className="mt-4 text-sm text-gray-500">
            {questionnaire.questions.length} question{questionnaire.questions.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Questions */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {questionnaire.questions
            .sort((a, b) => a.order - b.order)
            .map((question, index) => (
            <div key={question.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {question.title}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                  {question.description && (
                    <p className="text-gray-600 mb-4">{question.description}</p>
                  )}
                  <div className="mt-4">
                    {renderQuestion(question)}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Submit Button */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Submit Response
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PublicQuestionnaire;