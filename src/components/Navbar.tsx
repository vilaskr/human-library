import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BookOpen, Sun, Moon, LogIn, LogOut, User, Search, 
  Bookmark, Bell, ShieldCheck, Edit3, Menu, X, Settings, 
  Check, Cloud, ChevronDown, UserCheck, Trash2
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    user, 
    route, 
    navigateTo, 
    signInWithGoogle, 
    signOut, 
    darkMode, 
    setDarkMode, 
    firebaseStatus,
    userRole,
    notifications,
    markRead,
    deleteNotif,
    signInAsDemo,
    changeUserRole
  } = useApp();
  
  // Navigation visibility & scrolling states
  const [scrollY, setScrollY] = useState(0);
  const [visible, setVisible] = useState(true);

  // Search input state
  const [searchValue, setSearchValue] = useState('');

  // Dropdowns and Modals
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Mobile drawer and collapsible tools
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Demo user inputs
  const [demoName, setDemoName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');

  // Sync search input from route parameters
  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get('query') || '';
    setSearchValue(query);
  }, [route]);

  // Handle scroll trigger for reveal/hide sticky effect
  useEffect(() => {
    let lastScrollVal = window.scrollY;
    const handleScroll = () => {
      const currentScrollVal = window.scrollY;
      if (currentScrollVal < 15) {
        setVisible(true);
      } else if (currentScrollVal > lastScrollVal) {
        setVisible(false); // Hide scrolling down
      } else {
        setVisible(true); // Reveal scrolling up
      }
      lastScrollVal = currentScrollVal;
      setScrollY(currentScrollVal);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcut listener to focus search bar (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.getElementById('header-search-bar');
        if (input) {
          input.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (demoName && demoEmail) {
      signInAsDemo(demoName, demoEmail);
      setShowDemoModal(false);
      setDemoName('');
      setDemoEmail('');
    }
  };

  const handleSearchSubmit = (val: string) => {
    navigateTo('search', { query: val });
  };

  const triggerRoleChange = async (newRole: any) => {
    if (user) {
      await changeUserRole(user.uid, user.email, newRole);
    }
  };

  // Setup click out listener helper for drop lists
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeLinkClass = "relative flex items-center space-x-1.5 px-4 py-2 text-sm font-medium transition-all duration-200 select-none bg-olive/10 dark:bg-[#D4AF37]/10 text-olive dark:text-[#D4AF37] rounded-full shadow-sm hover:scale-[1.01]";
  const inactiveLinkClass = "flex items-center space-x-1.5 px-3.5 py-2 text-sm font-medium transition-all duration-200 opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 dark:hover:bg-[rgba(255,255,255,0.06)] hover:text-warm-text dark:hover:text-[#F5F5F5] text-warm-muted dark:text-[#A5A5A5] rounded-full hover:-translate-y-[1px]";

  return (
    <header 
      style={{
        backgroundColor: darkMode ? '#0F1115' : '#FAFAF9',
        borderColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(229,228,216,0.5)'
      }}
      className={`sticky top-0 z-40 w-full transition-all duration-300 transform border-b backdrop-blur-md ${
        visible ? 'translate-y-0' : '-translate-y-full shadow-none border-b-0'
      } ${scrollY > 15 ? 'shadow-md shadow-black/5 bg-opacity-95 dark:backdrop-blur-lg' : 'bg-opacity-90'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* DESKTOP ROW & NAVIGATION MASTERGRID */}
        <div className="flex justify-between items-center h-16 sm:h-20">
          
          {/* LEFT: Branding Layout */}
          <div 
            onClick={() => navigateTo('home')} 
            className="flex items-center space-x-3 cursor-pointer group shrink-0"
            id="nav-logo-btn"
          >
            <div className="p-2 sm:p-2.5 bg-white dark:bg-[#181A20] border border-cream-border dark:border-[rgba(255,255,255,0.08)] rounded-xl text-olive dark:text-[#D4AF37] transition-all duration-300 group-hover:scale-105 group-hover:border-olive/40 dark:group-hover:border-[#D4AF37]/40 shadow-sm">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg sm:text-2xl tracking-tight text-warm-text dark:text-[#F5F5F5] flex items-center gap-2">
                <span>Human Library</span>
                <span className="text-[10px] tracking-wider uppercase font-sans font-semibold text-olive/80 dark:text-[#D4AF37] px-1.5 py-0.5 bg-olive/5 dark:bg-[#D4AF37]/10 rounded border border-olive/15 dark:border-[#D4AF37]/20 leading-none">
                  BETA
                </span>
              </h1>
              <p className="hidden sm:block text-[10px] tracking-wider uppercase text-warm-muted dark:text-[#A5A5A5] font-mono leading-none mt-1">
                "Discover people, not profiles."
              </p>
            </div>
          </div>

          {/* CENTER: visual Search centerpiece */}
          <div className="hidden md:block flex-1 max-w-[420px] lg:max-w-[480px] mx-6">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-muted dark:text-[#A5A5A5]" />
              <input 
                id="header-search-bar"
                type="text" 
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  if (route === 'search') {
                    handleSearchSubmit(e.target.value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchSubmit(searchValue);
                  }
                }}
                placeholder="Search people, professions, interests..." 
                className="w-full text-xs pl-10 pr-16 py-2.5 rounded-full border border-cream-border dark:border-[rgba(255,255,255,0.08)] bg-white/70 dark:bg-[#181A20] text-warm-text dark:text-[#F5F5F5] placeholder:text-warm-light-muted dark:placeholder:text-[#A5A5A5] focus:outline-none focus:ring-2 focus:ring-olive/30 dark:focus:ring-[#D4AF37]/20 focus:border-olive dark:focus:border-[#D4AF37] shadow-inner transition-all duration-200"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center space-x-1 bg-cream-border/45 dark:bg-[rgba(255,255,255,0.06)] px-1.5 py-0.5 rounded text-[9px] font-mono text-warm-muted dark:text-[#A5A5A5] select-none border border-cream-border/10">
                <span>⌘</span>
                <span>K</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Navigation Options */}
          <nav className="hidden xl:flex items-center space-x-1">
            <button 
              onClick={() => navigateTo('search')}
              className={route === 'search' ? activeLinkClass : inactiveLinkClass}
              id="desktop-nav-search"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Catalog Search</span>
            </button>

            {user && (
              <>
                {(userRole === 'admin' || userRole === 'moderator') && (
                  <button 
                    onClick={() => navigateTo('moderation')}
                    className={route === 'moderation' ? activeLinkClass : inactiveLinkClass}
                    id="desktop-nav-moderation"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    <span>Curation Panel</span>
                  </button>
                )}

                <button 
                  onClick={() => navigateTo('dashboard')}
                  className={route === 'dashboard' ? activeLinkClass : inactiveLinkClass}
                  id="desktop-nav-dashboard"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>My Story</span>
                </button>

                <button 
                  onClick={() => navigateTo('editor')}
                  className={route === 'editor' ? activeLinkClass : inactiveLinkClass}
                  id="desktop-nav-editor"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Revise Profile</span>
                </button>
              </>
            )}
          </nav>

          {/* ACTIONS HUB: Buttons, sync status, utility icons & Avatar info */}
          <div className="hidden md:flex items-center space-x-3 ml-4 shrink-0">
            
            {/* Real Firebase status indicator - Small status badge */}
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-black/[0.03] dark:bg-[rgba(255,255,255,0.04)] border border-cream-border/60 dark:border-[rgba(255,255,255,0.08)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${firebaseStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${firebaseStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-warm-muted dark:text-[#A5A5A5]">
                {firebaseStatus === 'connected' ? '🟢 Synced' : '🟡 Sandbox'}
              </span>
            </div>

            {/* Dark Mode switcher */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl border border-cream-border/60 dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#181A20] text-warm-muted dark:text-[#A5A5A5] hover:bg-black/[0.03] dark:hover:bg-[rgba(255,255,255,0.06)] hover:text-[#D4AF37] dark:hover:text-[#D4AF37] transition-all duration-250 cursor-pointer"
              aria-label="Toggle theme"
              id="theme-toggler"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-olive" />}
            </button>

            {/* Notifications panel toggle */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setShowNotifMenu(!showNotifMenu)}
                  className="p-2.5 rounded-xl border border-cream-border/60 dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#181A20] text-warm-muted dark:text-[#A5A5A5] hover:bg-black/[0.03] dark:hover:bg-[rgba(255,255,255,0.06)] hover:text-olive dark:hover:text-[#D4AF37] transition-all duration-250 cursor-pointer relative"
                  aria-label="Notifications"
                  id="notif-bell-tracker"
                >
                  <Bell className="w-4 h-4" />
                  {notifications.some(n => !n.read) && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-600 rounded-full animate-pulse border-2 border-[#FAFAF9] dark:border-[#0F1115]"></span>
                  )}
                </button>

                {showNotifMenu && (
                  <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#181A20] border border-cream-border dark:border-[rgba(255,255,255,0.08)] rounded-2xl shadow-xl z-50 p-4 transition-all duration-200 animate-fade-in text-warm-text dark:text-[#F5F5F5]">
                    <div className="flex items-center justify-between border-b border-cream-border dark:border-[rgba(255,255,255,0.08)] pb-2.5 mb-2.5">
                      <span className="font-serif font-bold text-xs uppercase tracking-wider text-warm-muted dark:text-[#A5A5A5]">Audits & Messages</span>
                      <span className="text-[9px] font-mono bg-cream-border/40 dark:bg-black/20 text-warm-muted dark:text-[#A5A5A5] px-1.5 py-0.5 rounded">
                        {notifications.length} logged
                      </span>
                    </div>

                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-warm-light-muted dark:text-[#A5A5A5]/60 italic font-mono">
                        No messages logged in audit drawer.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {notifications.map(notif => (
                          <div 
                            key={notif.id} 
                            className={`p-2.5 rounded-xl border text-xs relative ${notif.read ? 'bg-cream-bg/40 border-cream-border/20 text-warm-muted dark:bg-black/10 dark:border-white/5 dark:text-[#A5A5A5]' : 'bg-olive/5 border-olive/20 text-warm-text dark:bg-[#D4AF37]/5 dark:border-[#D4AF37]/20 dark:text-[#F5F5F5] font-medium'}`}
                          >
                            <div className="flex justify-between items-start mb-0.5">
                              <span className="font-semibold text-[11px] truncate pr-4 text-warm-text dark:text-[#F5F5F5]">{notif.title}</span>
                              <button 
                                onClick={() => deleteNotif(notif.id)} 
                                className="text-[12px] text-rose-500 hover:text-rose-700 leading-none p-0.5 cursor-pointer font-bold"
                              >
                                &times;
                              </button>
                            </div>
                            <p className="text-[10px] text-warm-muted dark:text-[#A5A5A5] leading-relaxed mb-1.5">{notif.message}</p>
                            <div className="flex justify-between items-center text-[8px] font-mono text-warm-light-muted">
                              <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                              {!notif.read && (
                                <button 
                                  onClick={() => markRead(notif.id)}
                                  className="text-olive dark:text-[#D4AF37] hover:underline font-semibold cursor-pointer text-[9px]"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* AVATAR dropdown / Login buttons */}
            {user ? (
              <div className="flex items-center space-x-2 relative" ref={dropdownRef}>
                {/* Premium larger avatar indicator */}
                <div 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-1.5 p-1 rounded-full border border-cream-border dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#181A20] hover:border-olive dark:hover:border-[#D4AF37] transition-all cursor-pointer select-none"
                  id="nav-user-avatar-selector"
                >
                  <img 
                    src={user.photoURL} 
                    alt={user.name} 
                    className="w-8 h-8 rounded-full object-cover shadow-sm bg-cream-bg"
                    referrerPolicy="no-referrer"
                  />
                  <ChevronDown className={`w-3.5 h-3.5 text-warm-muted dark:text-[#A5A5A5] transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                </div>

                {/* Accent CTA button next to avatar */}
                <button 
                  onClick={() => navigateTo('human', { uid: user.uid })}
                  className="px-4 py-2 bg-olive text-white dark:bg-[#D4AF37] dark:text-[#0F1115] hover:bg-olive-dark dark:hover:bg-[#C29E30] font-sans text-xs font-semibold rounded-full shadow-sm hover:translate-y-[-1px] transition-all cursor-pointer"
                >
                  View Profile
                </button>

                {/* Avatar Dropdown List Sheet */}
                {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#181A20] border border-cream-border dark:border-[rgba(255,255,255,0.08)] rounded-2xl shadow-xl z-50 py-1.5 animate-fade-in text-warm-text dark:text-[#F5F5F5]">
                    
                    {/* User summary panel in dropdown */}
                    <div className="px-4 py-3 border-b border-cream-border dark:border-[rgba(255,255,255,0.08)] text-left mb-1 bg-cream-bg/30 dark:bg-black/10 rounded-t-2xl">
                      <p className="text-xs font-bold truncate text-warm-text dark:text-[#F5F5F5]">{user.name}</p>
                      <p className="text-[10px] text-warm-muted dark:text-[#A5A5A5] truncate font-mono mt-0.5">{user.email}</p>
                    </div>

                    <button 
                      onClick={() => { setShowDropdown(false); navigateTo('human', { uid: user.uid }); }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-xs text-left hover:bg-black/[0.03] dark:hover:bg-[rgba(255,255,255,0.06)] hover:text-olive dark:hover:text-[#D4AF37] transition-all"
                    >
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span>My Profile</span>
                    </button>

                    <button 
                      onClick={() => { setShowDropdown(false); navigateTo('editor'); }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-xs text-left hover:bg-black/[0.03] dark:hover:bg-[rgba(255,255,255,0.06)] hover:text-olive dark:hover:text-[#D4AF37] transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5 shrink-0" />
                      <span>Edit Profile</span>
                    </button>

                    <button 
                      onClick={() => { setShowDropdown(false); navigateTo('search', { saved: 'true' }); }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-xs text-left hover:bg-black/[0.03] dark:hover:bg-[rgba(255,255,255,0.06)] hover:text-olive dark:hover:text-[#D4AF37] transition-all"
                    >
                      <Bookmark className="w-3.5 h-3.5 shrink-0" />
                      <span>Saved Library</span>
                    </button>

                    <button 
                      onClick={() => { setShowDropdown(false); setShowSettingsModal(true); }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-xs text-left hover:bg-black/[0.03] dark:hover:bg-[rgba(255,255,255,0.06)] hover:text-olive dark:hover:text-[#D4AF37] transition-all"
                    >
                      <Settings className="w-3.5 h-3.5 shrink-0" />
                      <span>Settings</span>
                    </button>

                    <hr className="my-1 border-cream-border dark:border-[rgba(255,255,255,0.08)]" />

                    <button 
                      onClick={() => { setShowDropdown(false); signOut(); }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/10 text-left transition-all"
                    >
                      <LogOut className="w-3.5 h-3.5 shrink-0" />
                      <span>Check out (Logout)</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setShowDemoModal(true)}
                className="flex items-center space-x-1.5 bg-olive text-white dark:bg-[#D4AF37] dark:text-[#0F1115] px-5 py-2.5 rounded-full text-xs font-semibold hover:bg-olive-dark dark:hover:bg-[#C29E30] shadow-sm hover:shadow active:scale-95 transition-all duration-200 cursor-pointer"
                id="nav-signin-btn"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Enter Library</span>
              </button>
            )}
          </div>

          {/* MOBILE TOGGLE BLOCK FOR MEDIUM & SMALL DEVCES */}
          <div className="flex md:hidden items-center space-x-1">
            {/* Quick search input icon toggle */}
            <button 
              onClick={() => {
                setIsMobileSearchOpen(!isMobileSearchOpen);
                if (isMobileSearchOpen) {
                  setSearchValue('');
                }
              }}
              className="p-2 text-warm-muted dark:text-[#A5A5A5] hover:bg-black/5 dark:hover:bg-white/5 rounded-lg cursor-pointer"
              aria-label="Toggle mobile search"
            >
              {isMobileSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>

            {/* Quick profile avatar check-in */}
            <button 
              onClick={() => user ? navigateTo('dashboard') : setShowDemoModal(true)}
              className="p-1 rounded-full border border-cream-border dark:border-[rgba(255,255,255,0.08)]"
              aria-label="Toggle user dashboard"
            >
              {user ? (
                <img 
                  src={user.photoURL} 
                  alt={user.name} 
                  className="w-7 h-7 rounded-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-4 h-4 text-warm-muted dark:text-[#A5A5A5] m-1" />
              )}
            </button>

            {/* Main sidebar trigger drawer button */}
            <button 
              onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
              className="p-2 text-warm-muted dark:text-[#A5A5A5] hover:bg-black/5 dark:hover:bg-white/5 rounded-lg cursor-pointer ml-1"
              aria-label="Toggle responsive shelf"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

        </div>
      </div>

      {/* COLLAPSIBLE MOBILE SEARCH EXPANSION */}
      {isMobileSearchOpen && (
        <div className="md:hidden w-full bg-cream-bg/95 dark:bg-[#181A20]/95 px-4 py-3.5 border-t border-cream-border dark:border-[rgba(255,255,255,0.08)] animate-fade-in shadow-inner">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-light-muted dark:text-[#A5A5A5]" />
            <input 
              type="text" 
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                if (route === 'search') {
                  handleSearchSubmit(e.target.value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchSubmit(searchValue);
                  setIsMobileSearchOpen(false);
                }
              }}
              placeholder="Search people, professions, interests..." 
              required
              className="w-full text-xs pl-9 pr-12 py-2.5 rounded-xl border border-cream-border dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#0F1115] text-warm-text dark:text-[#F5F5F5] placeholder:text-warm-light-muted dark:placeholder:text-[#A5A5A5] focus:outline-none focus:ring-1 focus:ring-olive"
            />
            {searchValue && (
              <button 
                onClick={() => setSearchValue('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-muted dark:text-[#A5A5A5] text-xs font-mono font-bold"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* MOBILE SLIDE-OUT DRAWER OVERLAY & SHELF */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden">
          {/* Backdrop */}
          <div 
            onClick={() => setIsMobileDrawerOpen(false)}
            className="fixed inset-0 bg-olive-dark/40 backdrop-blur-sm"
          ></div>
          
          {/* Drawer container */}
          <div className="relative w-72 max-w-sm h-full bg-cream-bg dark:bg-[#0F1115] shadow-2xl p-6 flex flex-col justify-between border-l border-cream-border dark:border-[rgba(255,255,255,0.08)] animate-slide-in text-warm-text dark:text-[#F5F5F5]">
            <div className="space-y-6">
              
              {/* Drawer header */}
              <div className="flex items-center justify-between border-b border-cream-border dark:border-[rgba(255,255,255,0.08)] pb-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-olive dark:text-[#D4AF37]" />
                  <span className="font-serif font-bold text-base text-warm-text dark:text-[#F5F5F5]">Human Library</span>
                </div>
                <button 
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-warm-muted dark:text-[#A5A5A5] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer User block info */}
              {user && (
                <div className="p-3.5 bg-white dark:bg-[#181A20] rounded-xl border border-cream-border dark:border-[rgba(255,255,255,0.08)] shadow-sm">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={user.photoURL} 
                      alt={user.name} 
                      className="w-10 h-10 rounded-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold text-warm-text dark:text-[#F5F5F5]">{user.name}</p>
                      <p className="text-[10px] text-warm-muted dark:text-[#A5A5A5] font-mono truncate">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Drawer Navigation block with large touch targets */}
              <div className="space-y-2 text-left">
                <span className="block text-[10px] uppercase font-mono tracking-wider text-warm-muted dark:text-[#A5A5A5] mb-2 pl-2">Navigation</span>
                
                <button 
                  onClick={() => { setIsMobileDrawerOpen(false); navigateTo('search'); }}
                  className="flex items-center space-x-3 w-full p-3 rounded-xl hover:bg-black/5 dark:hover:bg-[rgba(255,255,255,0.04)] text-sm font-semibold transition-all select-none"
                >
                  <Search className="w-4 h-4 text-olive dark:text-[#D4AF37]" />
                  <span>Catalog Search</span>
                </button>

                {user && (userRole === 'admin' || userRole === 'moderator') && (
                  <button 
                    onClick={() => { setIsMobileDrawerOpen(false); navigateTo('moderation'); }}
                    className="flex items-center space-x-3 w-full p-3 rounded-xl hover:bg-black/5 dark:hover:bg-[rgba(255,255,255,0.04)] text-sm font-semibold transition-all select-none"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    <span>Curation Panel</span>
                  </button>
                )}

                {user && (
                  <>
                    <button 
                      onClick={() => { setIsMobileDrawerOpen(false); navigateTo('dashboard'); }}
                      className="flex items-center space-x-3 w-full p-3 rounded-xl hover:bg-black/5 dark:hover:bg-[rgba(255,255,255,0.04)] text-sm font-semibold transition-all select-none"
                    >
                      <User className="w-4 h-4 text-olive dark:text-[#D4AF37]" />
                      <span>My Story Workspace</span>
                    </button>

                    <button 
                      onClick={() => { setIsMobileDrawerOpen(false); navigateTo('editor'); }}
                      className="flex items-center space-x-3 w-full p-3 rounded-xl hover:bg-black/5 dark:hover:bg-[rgba(255,255,255,0.04)] text-sm font-semibold transition-all select-none"
                    >
                      <Edit3 className="w-4 h-4 text-olive dark:text-[#D4AF37]" />
                      <span>Revise Profile</span>
                    </button>

                    <button 
                      onClick={() => { setIsMobileDrawerOpen(false); navigateTo('search', { saved: 'true' }); }}
                      className="flex items-center space-x-3 w-full p-3 rounded-xl hover:bg-black/5 dark:hover:bg-[rgba(255,255,255,0.04)] text-sm font-semibold transition-all select-none"
                    >
                      <Bookmark className="w-4 h-4 text-olive dark:text-[#D4AF37]" />
                      <span>Saved Library</span>
                    </button>
                  </>
                )}

                {/* Additional simulated options for full-featured feel */}
                <button 
                  onClick={() => { setIsMobileDrawerOpen(false); navigateTo('dashboard'); }}
                  className="flex items-center space-x-3 w-full p-3 rounded-xl hover:bg-black/5 dark:hover:bg-[rgba(255,255,255,0.04)] text-sm font-semibold transition-all select-none"
                >
                  <ChevronDown className="w-4 h-4 rotate-90 text-olive dark:text-[#D4AF37]" />
                  <span>Reader Analytics</span>
                </button>

                <button 
                  onClick={() => { setIsMobileDrawerOpen(false); setShowSettingsModal(true); }}
                  className="flex items-center space-x-3 w-full p-3 rounded-xl hover:bg-black/5 dark:hover:bg-[rgba(255,255,255,0.04)] text-sm font-semibold transition-all select-none"
                >
                  <Settings className="w-4 h-4 text-olive dark:text-[#D4AF37]" />
                  <span>System Settings</span>
                </button>
              </div>

            </div>

            {/* Mobile actions footer */}
            <div className="space-y-4 pt-6 border-t border-cream-border dark:border-[rgba(255,255,255,0.08)]">
              {/* Theme toggle within drawer */}
              <div className="flex items-center justify-between p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl">
                <span className="text-xs font-semibold">Night Theme Mode</span>
                <button 
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 bg-white dark:bg-[#181A20] border border-cream-border dark:border-[rgba(255,255,255,0.08)] rounded-xl"
                >
                  {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-olive" />}
                </button>
              </div>

              {user ? (
                <button 
                  onClick={() => { setIsMobileDrawerOpen(false); signOut(); }}
                  className="flex items-center justify-center space-x-2 w-full p-3 border border-rose-200 dark:border-rose-950/40 hover:bg-rose-50 dark:hover:bg-rose-950/10 text-rose-500 rounded-xl text-xs font-bold font-mono transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button 
                  onClick={() => { setIsMobileDrawerOpen(false); setShowDemoModal(true); }}
                  className="flex items-center justify-center space-x-2 w-full p-3 bg-olive text-white dark:bg-[#D4AF37] dark:text-[#0F1115] hover:bg-olive-dark rounded-xl text-xs font-bold transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Enter Library Card</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* SYSTEMS SETTINGS CONFIG PANEL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-[#0F1115]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181A20] rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-cream-border dark:border-[rgba(255,255,255,0.08)] text-warm-text dark:text-[#F5F5F5] animate-fade-in">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-serif font-bold text-xl flex items-center gap-1.5">
                  <Settings className="w-5 h-5 text-olive dark:text-[#D4AF37]" />
                  <span>Library Configurations</span>
                </h3>
                <p className="text-xs text-warm-muted dark:text-[#A5A5A5] mt-1 font-sans">
                  Manage active user profiles and credential system layers.
                </p>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-cream-dark-bg text-warm-light-muted cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Option 1: Live user mock switcher (Extremely vital helper to inspect admin controls easily) */}
              {user && (
                <div className="p-4 bg-black/[0.02] dark:bg-black/20 rounded-xl border border-cream-border dark:border-[rgba(255,255,255,0.06)] relative overflow-hidden">
                  <div className="absolute top-2 right-2 text-[9px] font-mono tracking-wider bg-olive/10 dark:bg-[#D4AF37]/10 text-olive dark:text-[#D4AF37] px-1.5 py-0.5 rounded uppercase font-semibold">
                    Interactive
                  </div>
                  <h4 className="text-xs font-bold flex items-center gap-1">
                    <UserCheck className="w-4 h-4 text-olive dark:text-[#D4AF37]" />
                    <span>Override Authority Level</span>
                  </h4>
                  <p className="text-[10px] text-warm-muted dark:text-[#A5A5A5] mt-1 leading-relaxed">
                    Test Curation Panel, moderation states, and restricted blocks instantly by overriding your privilege levels.
                  </p>
                  
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {(['user', 'moderator', 'admin'] as const).map((role) => (
                      <button
                        key={role}
                        onClick={() => triggerRoleChange(role)}
                        className={`px-3 py-2 text-[11px] font-mono font-medium rounded-lg text-center border transition-all ${
                          userRole === role 
                            ? 'bg-olive text-white dark:bg-[#D4AF37] dark:text-[#0F1115] border-transparent shadow-sm scale-102' 
                            : 'border-cream-border dark:border-[rgba(255,255,255,0.08)] hover:bg-[#D4AF37]/5 dark:hover:bg-[#D4AF37]/5'
                        }`}
                      >
                        {role === 'user' ? 'Reader' : role === 'moderator' ? 'Curator' : 'Archivist'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Option 2: Synchronization layers */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-warm-muted dark:text-[#A5A5A5] font-mono">Sync Channel</h4>
                <div className="flex items-center justify-between p-3.5 bg-black/[0.02] dark:bg-black/20 border border-cream-border dark:border-[rgba(255,255,255,0.06)] rounded-xl">
                  <div className="flex items-center space-x-2">
                    <Cloud className="w-4 h-4 text-emerald-500" />
                    <div>
                      <p className="text-xs font-semibold">Storage Channel</p>
                      <p className="text-[10px] text-warm-muted dark:text-[#A5A5A5] font-mono">
                        {firebaseStatus === 'connected' ? 'Global Cloud DB' : 'Local Host Sandbox'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 px-2.5 py-1 rounded-full font-semibold font-mono">
                    ONLINE
                  </span>
                </div>
              </div>

              {/* Option 3: Basic profile switch option */}
              <div className="space-y-2 pt-2">
                <span className="block text-xs font-bold uppercase tracking-wider text-warm-muted dark:text-[#A5A5A5] font-mono">Device State</span>
                <div className="flex justify-between items-center text-xs">
                  <span>Toggle Visual Aesthetic Mode</span>
                  <button 
                    onClick={() => setDarkMode(!darkMode)}
                    className="px-4 py-2 bg-cream-border/50 dark:bg-black/30 hover:bg-cream-border dark:hover:bg-black/50 hover:text-[#D4AF37] rounded-xl text-xs font-mono font-bold transition-all"
                  >
                    {darkMode ? '☀️ Switch Day' : '🌙 Switch Night'}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-cream-border dark:border-[rgba(255,255,255,0.08)] flex justify-end">
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2.5 bg-olive text-white dark:bg-[#D4AF37] dark:text-[#0F1115] hover:bg-olive-dark font-semibold rounded-full text-xs transition-all cursor-pointer shadow-sm"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demo Sign In Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 bg-[#0F1115]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181A20] rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-cream-border dark:border-[rgba(255,255,255,0.08)] text-warm-text dark:text-[#F5F5F5]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-serif font-bold text-xl text-warm-text dark:text-[#F5F5F5]">
                  Join the Human Library
                </h3>
                <p className="text-xs text-warm-muted dark:text-[#A5A5A5] mt-1 font-sans">
                  Authenticate your virtual library card in 5 seconds.
                </p>
              </div>
              <button 
                onClick={() => setShowDemoModal(false)}
                className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-cream-dark-bg text-warm-light-muted cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleDemoSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-warm-muted dark:text-[#A5A5A5] mb-1.5">
                  Full Name
                </label>
                <input 
                  type="text" 
                  value={demoName} 
                  onChange={(e) => setDemoName(e.target.value)}
                  placeholder="e.g. Aveline Carter" 
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-border dark:border-[rgba(255,255,255,0.08)] bg-transparent text-warm-text dark:text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-olive/30 focus:border-olive"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-warm-muted dark:text-[#A5A5A5] mb-1.5">
                  Email Address
                </label>
                <input 
                  type="email" 
                  value={demoEmail} 
                  onChange={(e) => setDemoEmail(e.target.value)}
                  placeholder="e.g. carter@domain.com" 
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-border dark:border-[rgba(255,255,255,0.08)] bg-transparent text-warm-text dark:text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-olive/30 focus:border-olive"
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full bg-olive dark:bg-[#D4AF37] dark:text-[#0F1115] hover:bg-olive-dark text-white font-medium py-3 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Create Card & Sign In
                </button>
              </div>
            </form>

            <div className="relative my-6 text-center">
              <span className="absolute inset-x-0 top-1/2 border-t border-cream-border dark:border-[rgba(255,255,255,0.08)]"></span>
              <span className="relative bg-white dark:bg-[#181A20] px-3 font-mono text-[10px] uppercase text-warm-light-muted dark:text-[#A5A5A5]">
                OR ENTER SECURELY VIA CLOUD
              </span>
            </div>

            <button
              onClick={() => {
                signInWithGoogle();
                setShowDemoModal(false);
              }}
              className="w-full flex items-center justify-center space-x-2 border border-cream-border dark:border-[rgba(255,255,255,0.08)] py-3 rounded-xl hover:bg-black/5 dark:hover:bg-cream-dark-bg font-medium text-warm-text dark:text-[#F5F5F5] transition-all cursor-pointer bg-white/40"
            >
              <span>Continue with Google Sign-In</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
