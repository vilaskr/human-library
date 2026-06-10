import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { LandingPage } from './components/LandingPage';
import { SearchPage } from './components/SearchPage';
import { PublicProfilePage } from './components/PublicProfilePage';
import { UserDashboard } from './components/UserDashboard';
import { ProfileEditor } from './components/ProfileEditor';
import { ModerationDashboard } from './components/ModerationDashboard';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

const DynamicViewRouter: React.FC = () => {
  const { route, refreshProfiles, navigateTo, isDbMissing } = useApp();
  const [showBackOption, setShowBackOption] = React.useState(false);

  React.useEffect(() => {
    // Reset back option display on route change
    setShowBackOption(false);
  }, [route]);

  React.useEffect(() => {
    const handleOutsideClick = (e: any) => {
      // If we are on main home or search pages, clicking outside is not applicable
      if (route === 'home' || route === 'search') {
        setShowBackOption(false);
        return;
      }
      
      const target = e.target as HTMLElement;
      if (!target) return;

      // Ignore if clicking clickable / active UI modules
      if (
        target.closest('button') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('header') ||
        target.closest('nav') ||
        target.closest('[role="dialog"]') ||
        target.closest('.z-40') ||
        target.closest('.z-50')
      ) {
        return;
      }

      // Check if clicked element correlates with main layouts background/gutters
      const isOuterBackground = 
        target.classList.contains('min-h-screen') || 
        target.classList.contains('bg-cream-bg') || 
        target.classList.contains('dark:bg-cream-dark-bg') ||
        target.classList.contains('dark:bg-[#121620]') ||
        target.classList.contains('bg-[#FAF8F2]') ||
        target.id === 'main-route-container' ||
        target.tagName === 'MAIN' ||
        target.tagName === 'BODY' ||
        target.classList.contains('max-w-7xl') ||
        target.classList.contains('max-w-5xl') ||
        target.classList.contains('lg:px-8') ||
        target.classList.contains('px-4') ||
        target.classList.contains('py-8') ||
        target.classList.contains('py-10') ||
        target.classList.contains('py-12');

      if (isOuterBackground) {
        setShowBackOption(true);
      }
    };

    window.addEventListener('pointerdown', handleOutsideClick);
    return () => window.removeEventListener('pointerdown', handleOutsideClick);
  }, [route]);

  const renderContent = () => {
    switch (route) {
      case 'home':
        return <LandingPage />;
      case 'search':
        return <SearchPage />;
      case 'human':
        return <PublicProfilePage />;
      case 'dashboard':
        return <UserDashboard />;
      case 'moderation':
        return <ModerationDashboard />;
      case 'editor':
        return (
          <div className="min-h-screen bg-[#FAF8F2] dark:bg-[#121620] py-8 sm:py-12 pb-24 px-4" id="editor-route-outer-div">
            <div className="max-w-3xl mx-auto">
              <ProfileEditor onComplete={() => {
                refreshProfiles();
                navigateTo('dashboard');
              }} />
            </div>
          </div>
        );
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen" id="main-route-container">
      <Navbar />
      {isDbMissing && (
        <div className="bg-amber-500/10 border-y border-amber-500/25 text-amber-800 dark:text-amber-200 px-4 py-3 text-sm" id="firestore-missing-alert-banner">
          <div className="max-w-7xl mx-auto flex items-start gap-3">
            <div className="shrink-0 p-0.5 text-amber-600 dark:text-amber-400">
              <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-amber-950 dark:text-amber-100 flex items-center gap-1.5 leading-snug">
                Cloud Firestore Database is not active in your Firebase project "gen-lang-client-0946504348"
              </h4>
              <p className="mt-1 text-xs opacity-90 leading-relaxed max-w-4xl">
                The application is running in <strong className="font-semibold text-amber-900 dark:text-amber-100">Local Sandbox Mode</strong> using local storage. 
                Your Google Sign-In will work, but you must initialize the database in the Firebase Console to sync real-time Cloud data:
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                <span className="flex items-center gap-1.5"><span className="font-mono bg-amber-500/15 px-1.5 py-0.5 rounded text-[10px]">Step 1</span> Open <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-amber-950 dark:hover:text-amber-50">Firebase Console</a></span>
                <span className="flex items-center gap-1.5"><span className="font-mono bg-amber-500/15 px-1.5 py-0.5 rounded text-[10px]">Step 2</span> Choose <strong className="font-semibold">Gemini Project</strong> (<code>gen-lang-client-0946504348</code>)</span>
                <span className="flex items-center gap-1.5"><span className="font-mono bg-amber-500/15 px-1.5 py-0.5 rounded text-[10px]">Step 3</span> Click <strong className="font-semibold">Build &rarr; Firestore Database</strong></span>
                <span className="flex items-center gap-1.5"><span className="font-mono bg-amber-500/15 px-1.5 py-0.5 rounded text-[10px]">Step 4</span> Click <strong className="font-semibold">Create Database</strong> with ID <code className="bg-amber-500/15 px-1 py-0.5 rounded font-mono">(default)</code></span>
              </div>
            </div>
          </div>
        </div>
      )}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={route}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />

      {/* Floating option when tapping outside the working card */}
      <AnimatePresence>
        {showBackOption && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 280 }}
            className="fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center space-x-3 bg-white/95 dark:bg-[#1E2433]/95 text-warm-text dark:text-cream-bg p-3 px-4 sm:px-5 rounded-2xl shadow-xl border border-cream-border dark:border-cream-dark-border backdrop-blur-md"
          >
            <span className="text-xs text-warm-muted dark:text-warm-light-muted font-mono shrink-0">Tapped outside?</span>
            <div className="h-4 w-px bg-cream-border dark:bg-cream-dark-border" />
            <button
              onClick={() => {
                navigateTo('search');
                setShowBackOption(false);
              }}
              className="flex items-center space-x-1.5 bg-olive hover:bg-olive-dark text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-all cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Catalog</span>
            </button>
            <button
              onClick={() => setShowBackOption(false)}
              className="text-warm-muted hover:text-warm-text dark:text-warm-light-muted dark:hover:text-cream-bg p-1 text-sm font-bold leading-none cursor-pointer transition-colors"
              aria-label="Dismiss"
            >
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <DynamicViewRouter />
    </AppProvider>
  );
}
