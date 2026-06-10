import React from 'react';
import { useApp, RouteType } from '../context/AppContext';
import { BookOpen, Search, Bookmark, UserCircle } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { route, navigateTo, user } = useApp();

  const tabs: { target: RouteType; label: string; icon: React.FC<any> }[] = [
    { target: 'home', label: 'Catalog', icon: BookOpen },
    { target: 'search', label: 'Search', icon: Search },
    { target: 'dashboard', label: 'My Library', icon: Bookmark },
    { target: 'dashboard', label: 'Dashboard', icon: UserCircle },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0F172A]/95 border-t border-cream-border dark:border-cream-dark-border backdrop-blur-md px-4 py-2 flex justify-around items-center shadow-lg safe-bottom">
      {tabs.map((tab, idx) => {
        const IconComponent = tab.icon;
        const isActive = route === tab.target || (tab.label === 'My Library' && route === 'dashboard');
        
        return (
          <button
            key={idx}
            onClick={() => navigateTo(tab.target)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
              isActive 
                ? 'text-[#8C6A5C] dark:text-violet-400 font-semibold' 
                : 'text-gray-400 dark:text-slate-500 hover:text-gray-500'
            }`}
            id={`mobile-tab-${tab.label.toLowerCase().replace(' ', '-')}`}
          >
            <IconComponent className="w-5 h-5 mb-1" />
            <span className="text-[10px] tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
