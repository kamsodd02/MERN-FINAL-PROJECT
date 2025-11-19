import { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const QuestionnaireContext = createContext();

export const useQuestionnaire = () => {
  const context = useContext(QuestionnaireContext);
  if (!context) {
    throw new Error('useQuestionnaire must be used within a QuestionnaireProvider');
  }
  return context;
};

export const QuestionnaireProvider = ({ children }) => {
  const [questionnaires, setQuestionnaires] = useState([]);
  const [currentQuestionnaire, setCurrentQuestionnaire] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch user's questionnaires
  const fetchQuestionnaires = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`/questionnaires?${params}`);
      setQuestionnaires(response.data.questionnaires);
      return response.data;
    } catch (error) {
      console.error('Error fetching questionnaires:', error);
      toast.error('Failed to fetch questionnaires');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new questionnaire
  const createQuestionnaire = useCallback(async (data) => {
    setLoading(true);
    try {
      const response = await axios.post('/questionnaires', data);
      setQuestionnaires(prev => [response.data, ...prev]);
      setCurrentQuestionnaire(response.data);
      toast.success('Questionnaire created successfully');
      return response.data;
    } catch (error) {
      console.error('Error creating questionnaire:', error);
      toast.error('Failed to create questionnaire');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update questionnaire
  const updateQuestionnaire = useCallback(async (id, data) => {
    setLoading(true);
    try {
      const response = await axios.put(`/questionnaires/${id}`, data);
      setQuestionnaires(prev =>
        prev.map(q => q._id === id ? response.data : q)
      );
      setCurrentQuestionnaire(response.data);
      toast.success('Questionnaire updated successfully');
      return response.data;
    } catch (error) {
      console.error('Error updating questionnaire:', error);
      toast.error('Failed to update questionnaire');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete questionnaire
  const deleteQuestionnaire = useCallback(async (id) => {
    try {
      await axios.delete(`/questionnaires/${id}`);
      setQuestionnaires(prev => prev.filter(q => q._id !== id));
      if (currentQuestionnaire?._id === id) {
        setCurrentQuestionnaire(null);
      }
      toast.success('Questionnaire deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting questionnaire:', error);
      toast.error('Failed to delete questionnaire');
      return false;
    }
  }, [currentQuestionnaire]);

  // Fetch single questionnaire
  const fetchQuestionnaire = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await axios.get(`/questionnaires/${id}`);
      setCurrentQuestionnaire(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching questionnaire:', error);
      toast.error('Failed to fetch questionnaire');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Publish questionnaire
  const publishQuestionnaire = useCallback(async (id) => {
    try {
      const response = await axios.post(`/questionnaires/${id}/publish`);
      setQuestionnaires(prev =>
        prev.map(q => q._id === id ? response.data : q)
      );
      setCurrentQuestionnaire(response.data);
      toast.success('Questionnaire published successfully');
      return response.data;
    } catch (error) {
      console.error('Error publishing questionnaire:', error);
      toast.error('Failed to publish questionnaire');
      return null;
    }
  }, []);

  // Clone questionnaire
  const cloneQuestionnaire = useCallback(async (id) => {
    try {
      const response = await axios.post(`/questionnaires/${id}/clone`);
      setQuestionnaires(prev => [response.data, ...prev]);
      toast.success('Questionnaire cloned successfully');
      return response.data;
    } catch (error) {
      console.error('Error cloning questionnaire:', error);
      toast.error('Failed to clone questionnaire');
      return null;
    }
  }, []);

  // Add collaborator
  const addCollaborator = useCallback(async (questionnaireId, userId, role) => {
    try {
      const response = await axios.post(`/questionnaires/${questionnaireId}/collaborators`, {
        userId,
        role
      });
      setCurrentQuestionnaire(prev => ({
        ...prev,
        collaborators: response.data
      }));
      toast.success('Collaborator added successfully');
      return response.data;
    } catch (error) {
      console.error('Error adding collaborator:', error);
      toast.error('Failed to add collaborator');
      return null;
    }
  }, []);

  // Remove collaborator
  const removeCollaborator = useCallback(async (questionnaireId, userId) => {
    try {
      await axios.delete(`/questionnaires/${questionnaireId}/collaborators/${userId}`);
      setCurrentQuestionnaire(prev => ({
        ...prev,
        collaborators: prev.collaborators.filter(c => c.user._id !== userId)
      }));
      toast.success('Collaborator removed successfully');
      return true;
    } catch (error) {
      console.error('Error removing collaborator:', error);
      toast.error('Failed to remove collaborator');
      return false;
    }
  }, []);

  const value = {
    questionnaires,
    currentQuestionnaire,
    loading,
    fetchQuestionnaires,
    createQuestionnaire,
    updateQuestionnaire,
    deleteQuestionnaire,
    fetchQuestionnaire,
    publishQuestionnaire,
    cloneQuestionnaire,
    addCollaborator,
    removeCollaborator,
    setCurrentQuestionnaire
  };

  return (
    <QuestionnaireContext.Provider value={value}>
      {children}
    </QuestionnaireContext.Provider>
  );
};