import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  PlusCircle,
  FolderOpen,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ isMobileOpen, onClose }) => {
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Questionnaires', href: '/questionnaires', icon: FileText },
    { name: 'Workspaces', href: '/workspaces', icon: FolderOpen },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Profile', href: '/profile', icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-large transform transition-transform duration-300 ease-in-out
        md:fixed md:top-0 md:left-0 md:h-full md:border-r md:border-neutral-200
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Close button for mobile */}
        <div className="flex justify-end p-4 md:hidden">
          <button
            onClick={onClose}
            className="p-2 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-gradient-to-b from-primary-50 to-white">
          <div className="flex items-center flex-shrink-0 px-4 mb-8">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-xl font-bold text-gray-900">Questionnaire</p>
              <p className="text-sm text-gray-500">Platform</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex-grow flex flex-col">
          <nav className="flex-1 px-2 pb-4 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon
                  className="mr-3 flex-shrink-0 h-5 w-5"
                  aria-hidden="true"
                />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Quick Actions */}
          <div className="px-2 pb-4">
            <NavLink
              to="/questionnaires/new"
              className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150 ease-in-out"
            >
              <PlusCircle className="mr-3 flex-shrink-0 h-5 w-5" />
              New Questionnaire
            </NavLink>
          </div>
        </div>

        {/* User Info */}
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;