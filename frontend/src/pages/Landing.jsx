import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FileText,
  Users,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Star,
  Zap,
  Shield,
  Smartphone,
  Monitor,
  ChevronDown
} from 'lucide-react';

const Landing = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    );
  }

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-neutral-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  QuestionnairePro
                </h1>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('features')}
                className="text-neutral-600 hover:text-primary-600 transition-colors font-medium"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-neutral-600 hover:text-primary-600 transition-colors font-medium"
              >
                About
              </button>
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-2 rounded-xl font-medium hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-soft hover:shadow-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-8 animate-fade-in">
              <Star className="w-4 h-4 mr-2" />
              #1 Questionnaire Platform
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-neutral-900 mb-8 animate-fade-in">
              Create Amazing
              <span className="block bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent animate-gradient">
                Questionnaires
              </span>
            </h1>
            <p className="text-xl text-neutral-600 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in" style={{animationDelay: '0.2s'}}>
              Build interactive questionnaires, collect responses, and analyze data with our powerful platform.
              Perfect for surveys, feedback forms, and data collection.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{animationDelay: '0.4s'}}>
              <Link
                to="/register"
                className="group bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-large hover:shadow-glow transform hover:scale-105"
              >
                Start Creating Free
                <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={() => scrollToSection('features')}
                className="group text-neutral-600 hover:text-primary-600 font-semibold text-lg transition-colors flex items-center"
              >
                Learn More
                <ChevronDown className="ml-2 w-5 h-5 group-hover:translate-y-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Hero Image/Dashboard Preview */}
          <div className="mt-16 relative animate-fade-in" style={{animationDelay: '0.6s'}}>
            <div className="relative mx-auto max-w-5xl">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 via-secondary-500/20 to-accent-500/20 rounded-3xl blur-3xl transform rotate-1"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden transform -rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                    <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                    <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                  </div>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-6 rounded-2xl border border-primary-200">
                      <FileText className="w-8 h-8 text-primary-600 mb-4" />
                      <h3 className="font-semibold text-neutral-900 mb-2">Create Forms</h3>
                      <p className="text-neutral-600 text-sm">Drag & drop questions with ease</p>
                    </div>
                    <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 p-6 rounded-2xl border border-secondary-200">
                      <Users className="w-8 h-8 text-secondary-600 mb-4" />
                      <h3 className="font-semibold text-neutral-900 mb-2">Collect Responses</h3>
                      <p className="text-neutral-600 text-sm">Real-time response tracking</p>
                    </div>
                    <div className="bg-gradient-to-br from-accent-50 to-accent-100 p-6 rounded-2xl border border-accent-200">
                      <BarChart3 className="w-8 h-8 text-accent-600 mb-4" />
                      <h3 className="font-semibold text-neutral-900 mb-2">Analyze Data</h3>
                      <p className="text-neutral-600 text-sm">Powerful analytics & insights</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Everything you need to create better questionnaires
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Powerful features designed to make questionnaire creation and data collection effortless
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group p-8 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-3xl border border-neutral-200 hover:border-primary-300 hover:shadow-large transition-all duration-300 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">Drag & Drop Builder</h3>
              <p className="text-neutral-600 leading-relaxed">
                Create professional questionnaires with our intuitive drag-and-drop interface. No coding required.
              </p>
            </div>

            <div className="group p-8 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-3xl border border-neutral-200 hover:border-secondary-300 hover:shadow-large transition-all duration-300 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">Team Collaboration</h3>
              <p className="text-neutral-600 leading-relaxed">
                Work together with your team in workspaces. Share questionnaires and manage permissions easily.
              </p>
            </div>

            <div className="group p-8 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-3xl border border-neutral-200 hover:border-accent-300 hover:shadow-large transition-all duration-300 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-r from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">Advanced Analytics</h3>
              <p className="text-neutral-600 leading-relaxed">
                Get detailed insights with comprehensive analytics, charts, and exportable reports.
              </p>
            </div>

            <div className="group p-8 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-3xl border border-neutral-200 hover:border-primary-300 hover:shadow-large transition-all duration-300 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">Mobile Responsive</h3>
              <p className="text-neutral-600 leading-relaxed">
                Your questionnaires look great on all devices. Mobile-first design ensures perfect user experience.
              </p>
            </div>

            <div className="group p-8 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-3xl border border-neutral-200 hover:border-secondary-300 hover:shadow-large transition-all duration-300 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">Secure & Private</h3>
              <p className="text-neutral-600 leading-relaxed">
                Enterprise-grade security with data encryption, GDPR compliance, and privacy protection.
              </p>
            </div>

            <div className="group p-8 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-3xl border border-neutral-200 hover:border-accent-300 hover:shadow-large transition-all duration-300 cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-r from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-4">Lightning Fast</h3>
              <p className="text-neutral-600 leading-relaxed">
                Optimized performance with fast loading times and real-time updates for the best user experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to create your first questionnaire?
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Join thousands of users who trust QuestionnairePro for their data collection needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-primary-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-neutral-50 transition-colors shadow-large hover:shadow-glow transform hover:scale-105"
            >
              Start Free Trial
            </Link>
            <Link
              to="/login"
              className="border-2 border-white/30 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white/10 hover:border-white/50 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">QuestionnairePro</h3>
            <p className="text-neutral-400 mb-8">
              The modern way to create, share, and analyze questionnaires.
            </p>
            <div className="flex justify-center space-x-6">
              <Link to="/login" className="text-neutral-400 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="text-neutral-400 hover:text-white transition-colors">
                Sign Up
              </Link>
              <button className="text-neutral-400 hover:text-white transition-colors">
                Privacy
              </button>
              <button className="text-neutral-400 hover:text-white transition-colors">
                Terms
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;