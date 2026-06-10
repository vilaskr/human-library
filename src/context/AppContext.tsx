import React, { createContext, useContext, useState, useEffect } from 'react';
import { HumanProfile, Question, Bookmark, RoleType, UserNotification } from '../types';
import { 
  getProfiles, 
  getProfileByUid, 
  saveProfile, 
  recordProfileView, 
  recordSearchAppearance,
  getMockUser,
  setMockUser as updateLocalMockUser,
  getBookmarks,
  toggleBookmark as storageToggleBookmark,
  getQuestions,
  getUserRole,
  setUserRole,
  createReport,
  getNotifications,
  createNotification,
  markNotificationAsRead,
  deleteNotification
} from '../lib/storage';
import { 
  isFirebaseAvailable, 
  auth as firebaseAuth,
  db as firebaseDb
} from '../lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDocFromServer } from 'firebase/firestore';

export type RouteType = 'home' | 'search' | 'human' | 'dashboard' | 'editor' | 'moderation';

export interface UserSession {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
}

interface AppContextType {
  // Navigation
  route: RouteType;
  routeParams: Record<string, string>;
  navigateTo: (newRoute: RouteType, params?: Record<string, string>) => void;
  prevPage: () => void;
  navHistory: { route: RouteType; params?: Record<string, string> }[];

  // Authentication
  user: UserSession | null;
  loadingAuth: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsDemo: (name: string, email: string) => void;
  signOut: () => Promise<void>;

  // Data State
  profiles: HumanProfile[];
  loadingProfiles: boolean;
  refreshProfiles: () => Promise<void>;
  
  // Active User Profile
  userProfile: HumanProfile | null;
  saveUserProfile: (profile: HumanProfile) => Promise<void>;

  // Theme
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;

  // Bookmarks / Saved Library
  bookmarks: Bookmark[];
  isBookmarked: (profileId: string) => boolean;
  toggleBookmark: (profileId: string) => Promise<void>;

  // Roles, Moderation & Notifications
  userRole: RoleType;
  notifications: UserNotification[];
  refreshNotifications: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  deleteNotif: (id: string) => Promise<void>;
  sendNotif: (targetUserId: string, title: string, msg: string, type: UserNotification['type']) => Promise<void>;
  submitReport: (itemType: 'profile' | 'question', itemId: string, itemTitle: string, reason: string) => Promise<void>;
  changeUserRole: (targetUserId: string, targetEmail: string, newRole: RoleType) => Promise<void>;

  // Notifications or State flags
  firebaseStatus: 'connected' | 'sandbox';
  isDbMissing: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [route, setRoute] = useState<RouteType>('home');
  const [routeParams, setRouteParams] = useState<Record<string, string>>({});
  const [navHistory, setNavHistory] = useState<{ route: RouteType; params?: Record<string, string> }[]>([]);

  // Auth & General Configuration
  const [user, setUser] = useState<UserSession | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [firebaseStatus, setFirebaseStatus] = useState<'connected' | 'sandbox'>('sandbox');
  const [isDbMissing, setIsDbMissing] = useState(false);

  // Core Data
  const [profiles, setProfiles] = useState<HumanProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [userProfile, setUserProfile] = useState<HumanProfile | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  // Roles & Notifications State
  const [userRole, setUserRoleState] = useState<RoleType>('user');
  const [notifications, setNotifications] = useState<UserNotification[]>([]);

  useEffect(() => {
    if (user) {
      getUserRole(user.uid, user.email).then((role) => {
        setUserRoleState(role);
      });
      getNotifications(user.uid).then((notifs) => {
        setNotifications(notifs);
      });
    } else {
      setUserRoleState('user');
      setNotifications([]);
    }
  }, [user]);

  const refreshNotifications = async () => {
    if (user) {
      const list = await getNotifications(user.uid);
      setNotifications(list);
    }
  };

  const markRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotif = async (id: string) => {
    await deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const sendNotif = async (targetUserId: string, title: string, msg: string, type: UserNotification['type']) => {
    await createNotification(targetUserId, title, msg, type);
  };

  const submitReport = async (itemType: 'profile' | 'question', itemId: string, itemTitle: string, reason: string) => {
    if (user) {
      await createReport(user.uid, itemType, itemId, itemTitle, reason);
    }
  };

  const changeUserRole = async (targetUserId: string, targetEmail: string, newRole: RoleType) => {
    await setUserRole(targetUserId, targetEmail, newRole);
    if (targetUserId === user?.uid) {
      setUserRoleState(newRole);
    }
  };

  // Theme
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const local = localStorage.getItem('human_library_dark_mode');
    if (local !== null) return local === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Handle Dynamic Theme Addition
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('human_library_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('human_library_dark_mode', 'false');
    }
  }, [darkMode]);

  // Synchronize dynamic Firebase Auth / Local Auth
  useEffect(() => {
    if (isFirebaseAvailable && firebaseAuth) {
      setFirebaseStatus('connected');

      // Test if database has been created in the custom project
      if (firebaseDb) {
        getDocFromServer(doc(firebaseDb, '_test_connection_', 'ping'))
          .then(() => {
            setIsDbMissing(false);
          })
          .catch((error: any) => {
            const errMsg = error?.message || String(error);
            if (errMsg.toLowerCase().includes('database') && errMsg.toLowerCase().includes('not found')) {
              setIsDbMissing(true);
              console.warn('Firestore database does not exist or has not been initialized yet:', error);
            }
          });
      }

      const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
        if (fbUser) {
          const userSession: UserSession = {
            uid: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            email: fbUser.email || '',
            photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fbUser.displayName || 'U')}`
          };
          setUser(userSession);
        } else {
          setUser(null);
        }
        setLoadingAuth(false);
      });
      return () => unsubscribe();
    } else {
      // Offline fallback Authentication
      setFirebaseStatus('sandbox');
      const mockUser = getMockUser();
      if (mockUser) {
        setUser(mockUser);
      }
      setLoadingAuth(false);
    }
  }, []);

  // Fetch initial profile collection and match active user profile
  const refreshProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const isAdminOrMod = userRole === 'admin' || userRole === 'moderator';
      const data = await getProfiles(user?.uid, isAdminOrMod);
      setProfiles(data);
      
      // Match active user's bio profile
      if (user) {
        const found = data.find(p => p.uid === user.uid);
        if (found) {
          setUserProfile(found);
        } else {
          // Empty dummy profile state to begin onboarding / editor
          setUserProfile({
            uid: user.uid,
            name: user.name,
            email: user.email,
            photoURL: user.photoURL,
            profession: '',
            industry: '',
            location: '',
            bio: '',
            story: '',
            dailyLife: '',
            lessonsLearned: '',
            expertiseTags: [],
            experienceTags: [],
            projects: [],
            socialLinks: {},
            availability: { questions: true, mentorship: false, collaboration: false },
            yearsOfExperience: 0,
            featured: false,
            views: 0,
            searchAppearances: 0,
            createdAt: new Date().toISOString(),
            isDraft: true
          });
        }
        
        // Fetch bookmarks
        const userBookmarks = await getBookmarks(user.uid);
        setBookmarks(userBookmarks);
      } else {
        setUserProfile(null);
        setBookmarks([]);
      }
    } catch (error) {
      console.error('Error refreshing profiles:', error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  useEffect(() => {
    refreshProfiles();
  }, [user, userRole]);

  // Navigate Helper with elegant history stack
  const navigateTo = (newRoute: RouteType, params: Record<string, string> = {}) => {
    setNavHistory(prev => [...prev, { route, params: routeParams }]);
    setRoute(newRoute);
    setRouteParams(params);
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Handle view metrics when visiting a specific profile page
    if (newRoute === 'human' && params.uid) {
      recordProfileView(params.uid).then(() => {
        // Increment locally for instant responsiveness
        setProfiles(prev => 
          prev.map(p => p.uid === params.uid ? { ...p, views: (p.views || 0) + 1 } : p)
        );
      });
    }
  };

  const prevPage = () => {
    if (navHistory.length > 0) {
      const last = navHistory[navHistory.length - 1];
      setRoute(last.route);
      setRouteParams(last.params || {});
      setNavHistory(prev => prev.slice(0, -1));
    } else {
      setRoute('home');
      setRouteParams({});
    }
  };

  // Login Implementations
  const signInWithGoogle = async () => {
    if (isFirebaseAvailable && firebaseAuth) {
      const provider = new GoogleAuthProvider();
      try {
        await signInWithPopup(firebaseAuth, provider);
      } catch (error) {
        console.error('Firebase sign in failed', error);
      }
    } else {
      // In sandbox mode, auto-trigger a quick demo account
      signInAsDemo('Aveline Carter', 'aveline@gmail.com');
    }
  };

  const signInAsDemo = (name: string, email: string) => {
    const fallbackPhoto = `https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&h=128&q=80`;
    const demoUser: UserSession = {
      uid: `demo-${Date.now()}`,
      name,
      email,
      photoURL: fallbackPhoto
    };
    updateLocalMockUser(demoUser);
    setUser(demoUser);
    navigateTo('dashboard');
  };

  const signOut = async () => {
    if (isFirebaseAvailable && firebaseAuth) {
      await firebaseSignOut(firebaseAuth);
    } else {
      updateLocalMockUser(null);
      setUser(null);
    }
    setUserProfile(null);
    setBookmarks([]);
    navigateTo('home');
  };

  // Profile Save
  const saveUserProfile = async (profile: HumanProfile) => {
    await saveProfile(profile);
    setUserProfile(profile);
    // instant UI refresh helper
    setProfiles(prev => {
      const idx = prev.findIndex(p => p.uid === profile.uid);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = profile;
        return copy;
      } else {
        return [...prev, profile];
      }
    });
  };

  // Bookmark toggler
  const toggleBookmark = async (profileId: string) => {
    if (!user) {
      navigateTo('search');
      return;
    }
    const isNowBookmarked = await storageToggleBookmark(user.uid, profileId);
    if (isNowBookmarked) {
      setBookmarks(prev => [...prev, { userId: user.uid, profileId, createdAt: new Date().toISOString() }]);
    } else {
      setBookmarks(prev => prev.filter(b => b.profileId !== profileId));
    }
  };

  const isBookmarked = (profileId: string) => {
    return bookmarks.some(b => b.profileId === profileId);
  };

  return (
    <AppContext.Provider
      value={{
        route,
        routeParams,
        navigateTo,
        prevPage,
        navHistory,
        user,
        loadingAuth,
        signInWithGoogle,
        signInAsDemo,
        signOut,
        profiles,
        loadingProfiles,
        refreshProfiles,
        userProfile,
        saveUserProfile,
        darkMode,
        setDarkMode,
        bookmarks,
        isBookmarked,
        toggleBookmark,
        userRole,
        notifications,
        refreshNotifications,
        markRead,
        deleteNotif,
        sendNotif,
        submitReport,
        changeUserRole,
        firebaseStatus,
        isDbMissing
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
