import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { QuestionnaireProvider } from './contexts/QuestionnaireContext';

// Layout Components
import Layout from './components/Layout/Layout';

// Page Components
import Dashboard from './pages/Dashboard/Dashboard';
import QuestionnaireBuilder from './pages/QuestionnaireBuilder/QuestionnaireBuilder';
import QuestionnaireList from './pages/QuestionnaireList/QuestionnaireList';
import QuestionnaireView from './pages/QuestionnaireView/QuestionnaireView';
import ResponseView from './pages/ResponseView/ResponseView';
import Analytics from './pages/Analytics/Analytics';
import Workspaces from './pages/Workspaces/Workspaces';
import Profile from './pages/Profile/Profile';

// Auth Components
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import PrivateRoute from './components/Auth/PrivateRoute';

// Public Components
// In App.jsx
import PublicQuestionnaire from './pages/public/PublicQuestionnaire';



function App() {
  return (
    <AuthProvider>
      <QuestionnaireProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public Routes */}
              <Route path="/questionnaire/:id" element={<PublicQuestionnaire />} />

              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route path="/" element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="questionnaires" element={<QuestionnaireList />} />
                <Route path="questionnaires/new" element={<QuestionnaireBuilder />} />
                <Route path="questionnaires/:id/edit" element={<QuestionnaireBuilder />} />
                <Route path="questionnaires/:id" element={<QuestionnaireView />} />
                <Route path="questionnaires/:id/responses" element={<ResponseView />} />
                <Route path="questionnaires/:id/analytics" element={<Analytics />} />
                <Route path="workspaces" element={<Workspaces />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>

            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </QuestionnaireProvider>
    </AuthProvider>
  );
}

export default App;
