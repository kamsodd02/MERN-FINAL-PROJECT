import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Menu, LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-soft border-b border-neutral-200 backdrop-blur-sm bg-white/95">
      <div className="flex justify-between items-center px-4 md:px-6 py-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-all duration-200 shadow-soft hover:shadow-medium"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-lg mx-4 hidden sm:block">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="text"
              placeholder="Search questionnaires..."
              className="block w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-xl leading-5 bg-neutral-50 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 shadow-soft focus:shadow-medium"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          {/* Search button for mobile */}
          <button className="sm:hidden p-2 rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-all duration-200">
            <Search className="h-5 w-5" />
          </button>

          {/* Notifications */}
          <button className="p-2 text-neutral-400 hover:text-neutral-600 relative rounded-xl hover:bg-neutral-100 transition-all duration-200">
            <Bell className="h-6 w-6" />
            <span className="absolute top-1 right-1 block h-3 w-3 rounded-full bg-gradient-to-r from-red-400 to-red-500 ring-2 ring-white shadow-soft"></span>
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 p-1 hover:bg-neutral-50 transition-all duration-200"
            >
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-soft hover:shadow-medium transition-all duration-200">
                <span className="text-sm font-semibold text-white">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-large py-2 z-10 border border-neutral-200 animate-slide-in">
                <div className="px-4 py-3 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-white rounded-t-xl">
                  <p className="text-sm font-semibold text-neutral-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">{user?.email}</p>
                </div>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/profile');
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
                >
                  <User className="mr-3 h-4 w-4 text-neutral-400" />
                  Profile
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-3 text-sm text-neutral-700 hover:bg-red-50 hover:text-red-700 transition-colors rounded-b-xl"
                >
                  <LogOut className="mr-3 h-4 w-4 text-neutral-400" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;