import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 relative overflow-hidden">
      {/* More vibrant and colorful background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large colorful orbs with more vibrant colors */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary-400/25 via-primary-300/20 to-secondary-400/25 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-accent-400/25 via-secondary-300/20 to-primary-400/25 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-secondary-300/30 to-accent-300/30 rounded-full blur-2xl animate-bounce-subtle"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-gradient-to-br from-accent-400/20 via-primary-300/25 to-secondary-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>

        {/* Additional floating colorful elements */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-primary-200/15 via-secondary-200/20 to-accent-200/15 rounded-full blur-2xl"></div>
        <div className="absolute top-1/3 right-1/3 w-48 h-48 bg-gradient-to-br from-secondary-400/25 to-accent-400/25 rounded-full blur-xl animate-bounce-subtle" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-1/3 left-1/3 w-56 h-56 bg-gradient-to-br from-accent-300/20 via-primary-300/25 to-secondary-300/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '3s'}}></div>

        {/* Extra colorful accents */}
        <div className="absolute top-1/6 right-1/6 w-32 h-32 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
        <div className="absolute bottom-1/6 left-1/6 w-40 h-40 bg-gradient-to-br from-accent-500/15 to-primary-500/15 rounded-full blur-2xl animate-bounce-subtle" style={{animationDelay: '1.5s'}}></div>
      </div>

      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onClose={closeMobileSidebar}
      />

      {/* Main content area - full screen width */}
      <div className="flex flex-col h-full relative z-10 md:ml-64">
        <Header onMenuClick={toggleMobileSidebar} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="w-full min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;