import { HumanProfile, Question, Bookmark, Project, SocialLinks, RoleType, UserRole, ContentReport, UserNotification } from '../types';
import { SEED_PROFILES } from '../data/seed';
import { 
  db, 
  auth, 
  isFirebaseAvailable, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  deleteDoc,
  serverTimestamp,
  increment
} from 'firebase/firestore';

// Keys for localStorage backup
const KEYS = {
  PROFILES: 'human_library_profiles',
  QUESTIONS: 'human_library_questions',
  BOOKMARKS: 'human_library_bookmarks',
  MOCK_USER: 'human_library_mock_user_info',
  ANALYTICS: 'human_library_analytics_history',
  ROLES: 'human_library_user_roles',
  REPORTS: 'human_library_content_reports',
  NOTIFICATIONS: 'human_library_user_notifications'
};

// --- LOCAL STORAGE BACKUP IMPLEMENTATION ---

function loadLocalProfiles(): HumanProfile[] {
  const data = localStorage.getItem(KEYS.PROFILES);
  if (!data) {
    localStorage.setItem(KEYS.PROFILES, JSON.stringify(SEED_PROFILES));
    return SEED_PROFILES;
  }
  try {
    const list = JSON.parse(data) as HumanProfile[];
    const filtered = list.filter(p => p && p.uid && !p.uid.startsWith('seed-'));
    if (filtered.length !== list.length) {
      saveLocalProfiles(filtered);
    }
    return filtered;
  } catch (e) {
    return SEED_PROFILES;
  }
}

function saveLocalProfiles(profiles: HumanProfile[]) {
  localStorage.setItem(KEYS.PROFILES, JSON.stringify(profiles));
}

function loadLocalQuestions(): Question[] {
  const data = localStorage.getItem(KEYS.QUESTIONS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function saveLocalQuestions(questions: Question[]) {
  localStorage.setItem(KEYS.QUESTIONS, JSON.stringify(questions));
}

function loadLocalBookmarks(): Bookmark[] {
  const data = localStorage.getItem(KEYS.BOOKMARKS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function saveLocalBookmarks(bookmarks: Bookmark[]) {
  localStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(bookmarks));
}

// Mock auth data helper for when Real Firebase is not available
export interface AuthUser {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
}

export function getMockUser(): AuthUser | null {
  const data = localStorage.getItem(KEYS.MOCK_USER);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

export function setMockUser(user: AuthUser | null) {
  if (user) {
    localStorage.setItem(KEYS.MOCK_USER, JSON.stringify(user));
    // Synchronize to local profiles list if they don't already exist
    const profiles = loadLocalProfiles();
    if (!profiles.some(p => p.uid === user.uid)) {
      const newProfile: HumanProfile = {
        uid: user.uid,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        profession: "",
        industry: "",
        location: "",
        bio: "",
        story: "",
        dailyLife: "",
        lessonsLearned: "",
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
      };
      profiles.push(newProfile);
      saveLocalProfiles(profiles);
    }
  } else {
    localStorage.removeItem(KEYS.MOCK_USER);
  }
}

// --- UNIFIED API METHODS ---

// 1. Get List of Profiles (with search / filter capabilities)
export async function getProfiles(currentUserUid?: string, isModeratorOrAdmin?: boolean): Promise<HumanProfile[]> {
  if (isFirebaseAvailable && db) {
    const path = 'users';
    try {
      let q;
      if (isModeratorOrAdmin) {
        q = query(collection(db, path));
      } else {
        q = query(
          collection(db, path),
          where('isDraft', '==', false),
          where('moderationStatus', '==', 'approved')
        );
      }
      const querySnapshot = await getDocs(q);
      const profiles: HumanProfile[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as HumanProfile;
        if (data && data.uid && !data.uid.startsWith('seed-')) {
          profiles.push(data);
        }
      });
      
      // Fallback if DB is empty
      if (profiles.length === 0 && !isModeratorOrAdmin && SEED_PROFILES.length > 0) {
        // Seed Firestore so the user has immediate data
        for (const seed of SEED_PROFILES) {
          const initializedSeed: HumanProfile = {
            ...seed,
            isDraft: false,
            moderationStatus: 'approved'
          };
          await setDoc(doc(db, 'users', seed.uid), initializedSeed);
          profiles.push(initializedSeed);
        }
      }

      // Merge current user's profile if authenticated
      if (currentUserUid && !isModeratorOrAdmin) {
        try {
          const myProfileRef = doc(db, 'users', currentUserUid);
          const myProfileSnap = await getDoc(myProfileRef);
          if (myProfileSnap.exists()) {
            const myProfile = myProfileSnap.data() as HumanProfile;
            const idx = profiles.findIndex(p => p.uid === currentUserUid);
            if (idx > -1) {
              profiles[idx] = myProfile;
            } else {
              profiles.push(myProfile);
            }
          }
        } catch (err) {
          console.warn("Could not retrieve current user profile for merging:", err);
        }
      }

      return profiles;
    } catch (error) {
      console.warn("Firestore profiles fetch failed, using local fallback:", error);
      return loadLocalProfiles(); // Soft fallback
    }
  } else {
    return loadLocalProfiles();
  }
}

// 2. Get Single Profile
export async function getProfileByUid(uid: string): Promise<HumanProfile | null> {
  if (uid.startsWith('seed-')) {
    return null;
  }
  if (isFirebaseAvailable && db) {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const profile = docSnap.data() as HumanProfile;
        if (profile.uid && profile.uid.startsWith('seed-')) {
          return null;
        }
        return profile;
      }
      return null;
    } catch (error) {
      const local = loadLocalProfiles();
      return local.find(p => p.uid === uid) || null;
    }
  } else {
    const local = loadLocalProfiles();
    return local.find(p => p.uid === uid) || null;
  }
}

// 3. Save / Complete Profile
export async function saveProfile(profile: HumanProfile): Promise<void> {
  const updatedProfile = { 
    ...profile, 
    isDraft: false,
    moderationStatus: profile.moderationStatus || 'pending',
    updatedAt: new Date().toISOString() 
  };
  
  // Dynamic sync: ALWAYS save to local profiles list as a robust fallback first!
  const local = loadLocalProfiles();
  const idx = local.findIndex(p => p.uid === profile.uid);
  if (idx > -1) {
    local[idx] = updatedProfile;
  } else {
    local.push(updatedProfile);
  }
  saveLocalProfiles(local);

  if (isFirebaseAvailable && db) {
    const path = `users/${profile.uid}`;
    try {
      await setDoc(doc(db, 'users', profile.uid), updatedProfile, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

// 4. Increment Profile Metric (views or searchAppearances)
export async function recordProfileView(profileId: string): Promise<void> {
  if (isFirebaseAvailable && db) {
    const path = `users/${profileId}`;
    try {
      const docRef = doc(db, 'users', profileId);
      // Try to increment, fail softly if not editable
      await updateDoc(docRef, {
        views: increment(1)
      });
    } catch (e) {
      // safe fallback
    }
  } else {
    const local = loadLocalProfiles();
    const idx = local.findIndex(p => p.uid === profileId);
    if (idx > -1) {
      local[idx].views = (local[idx].views || 0) + 1;
      saveLocalProfiles(local);
    }
  }
}

export async function recordSearchAppearance(profileId: string): Promise<void> {
  if (isFirebaseAvailable && db) {
    const path = `users/${profileId}`;
    try {
      const docRef = doc(db, 'users', profileId);
      await updateDoc(docRef, {
        searchAppearances: increment(1)
      });
    } catch (e) {
      // safe fallback
    }
  } else {
    const local = loadLocalProfiles();
    const idx = local.findIndex(p => p.uid === profileId);
    if (idx > -1) {
      local[idx].searchAppearances = (local[idx].searchAppearances || 0) + 1;
      saveLocalProfiles(local);
    }
  }
}

// 5. Ask Questions System
export async function askQuestion(
  profileOwnerId: string, 
  askerId: string, 
  askerName: string, 
  questionText: string, 
  visibility: 'public' | 'private'
): Promise<Question> {
  const newQuestion: Question = {
    id: `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    profileOwnerId,
    askerId: askerId || 'anonymous',
    askerName: askerName || 'Anonymous Visitor',
    question: questionText,
    visibility,
    createdAt: new Date().toISOString()
  };

  if (isFirebaseAvailable && db) {
    const path = `questions/${newQuestion.id}`;
    try {
      await setDoc(doc(db, 'questions', newQuestion.id), newQuestion);
      return newQuestion;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }
  
  // Local fallback
  const localQuestions = loadLocalQuestions();
  localQuestions.push(newQuestion);
  saveLocalQuestions(localQuestions);
  return newQuestion;
}

export async function getQuestions(profileOwnerId: string): Promise<Question[]> {
  if (isFirebaseAvailable && db) {
    const path = 'questions';
    try {
      const isOwner = auth?.currentUser?.uid === profileOwnerId;
      let isModOrAdmin = false;
      if (auth?.currentUser) {
        const role = await getUserRole(auth.currentUser.uid, auth.currentUser.email || undefined);
        isModOrAdmin = role === 'admin' || role === 'moderator';
      }

      let q;
      if (isOwner || isModOrAdmin) {
        q = query(
          collection(db, 'questions'), 
          where('profileOwnerId', '==', profileOwnerId)
        );
      } else {
        q = query(
          collection(db, 'questions'), 
          where('profileOwnerId', '==', profileOwnerId),
          where('visibility', '==', 'public')
        );
      }
      const querySnapshot = await getDocs(q);
      const results: Question[] = [];
      querySnapshot.forEach((docSnap) => {
        results.push(docSnap.data() as Question);
      });
      return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (error) {
      console.warn("Firestore getQuestions failed, using local fallback:", error);
      const local = loadLocalQuestions();
      return local
        .filter(q => q.profileOwnerId === profileOwnerId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  }
  
  const local = loadLocalQuestions();
  return local
    .filter(q => q.profileOwnerId === profileOwnerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAskerQuestions(askerId: string): Promise<Question[]> {
  if (isFirebaseAvailable && db) {
    try {
      const q = query(
        collection(db, 'questions'), 
        where('askerId', '==', askerId)
      );
      const querySnapshot = await getDocs(q);
      const results: Question[] = [];
      querySnapshot.forEach((docSnap) => {
        results.push(docSnap.data() as Question);
      });
      return results;
    } catch (e) {
      console.warn("Firestore getAskerQuestions failed, using local fallback:", e);
      const local = loadLocalQuestions();
      return local.filter(q => q.askerId === askerId);
    }
  }
  const local = loadLocalQuestions();
  return local.filter(q => q.askerId === askerId);
}

export async function answerQuestion(questionId: string, answerText: string): Promise<void> {
  if (isFirebaseAvailable && db) {
    const path = `questions/${questionId}`;
    try {
      const docRef = doc(db, 'questions', questionId);
      await updateDoc(docRef, { answer: answerText });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  } else {
    const local = loadLocalQuestions();
    const idx = local.findIndex(q => q.id === questionId);
    if (idx > -1) {
      local[idx].answer = answerText;
      saveLocalQuestions(local);
    }
  }
}

export async function deleteQuestion(questionId: string): Promise<void> {
  if (isFirebaseAvailable && db) {
    const path = `questions/${questionId}`;
    try {
      await deleteDoc(doc(db, 'questions', questionId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  } else {
    const local = loadLocalQuestions();
    const filtered = local.filter(q => q.id !== questionId);
    saveLocalQuestions(filtered);
  }
}

// 6. Bookmarks / Saved Library
export async function getBookmarks(userId: string): Promise<Bookmark[]> {
  if (isFirebaseAvailable && db) {
    try {
      const q = query(
        collection(db, 'bookmarks'), 
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const results: Bookmark[] = [];
      querySnapshot.forEach((docSnap) => {
        results.push(docSnap.data() as Bookmark);
      });
      return results;
    } catch (e) {
      console.warn("Firestore getBookmarks failed, using local fallback:", e);
      const local = loadLocalBookmarks();
      return local.filter(b => b.userId === userId);
    }
  }
  const local = loadLocalBookmarks();
  return local.filter(b => b.userId === userId);
}

export async function toggleBookmark(userId: string, profileId: string): Promise<boolean> {
  // Returns true if bookmarked, false if unbookmarked
  if (isFirebaseAvailable && db) {
    const bookmarkId = `${userId}_${profileId}`;
    const path = `bookmarks/${bookmarkId}`;
    try {
      const docRef = doc(db, 'bookmarks', bookmarkId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await deleteDoc(docRef);
        return false;
      } else {
        const newBookmark: Bookmark = {
          userId,
          profileId,
          createdAt: new Date().toISOString()
        };
        await setDoc(docRef, newBookmark);
        return true;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  // Local fallback
  const local = loadLocalBookmarks();
  const idx = local.findIndex(b => b.userId === userId && b.profileId === profileId);
  if (idx > -1) {
    local.splice(idx, 1);
    saveLocalBookmarks(local);
    return false;
  } else {
    local.push({
      userId,
      profileId,
      createdAt: new Date().toISOString()
    });
    saveLocalBookmarks(local);
    return true;
  }
}

// --- 7. Role Management ---

export async function getUserRole(userId: string, email?: string): Promise<RoleType> {
  const adminEmail = "vilaskr762@gmail.com";
  // Always bootstrap vilaskr762@gmail.com or designated users as admin
  if (email === adminEmail || (auth?.currentUser?.email === adminEmail && auth?.currentUser?.uid === userId)) {
    return 'admin';
  }

  if (isFirebaseAvailable && db) {
    try {
      const docRef = doc(db, 'roles', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.role || 'user';
      }
    } catch (e) {
      console.warn('Error reading role from Firestore:', e);
    }
  }

  // Local fallback
  const rolesData = localStorage.getItem(KEYS.ROLES);
  if (rolesData) {
    try {
      const roles = JSON.parse(rolesData);
      if (roles[userId]) {
        return roles[userId].role;
      }
    } catch (e) {
      // ignore
    }
  }

  // Handle bootstrap for initial login of admin in local mode as well
  if (email === adminEmail) {
    return 'admin';
  }

  return 'user';
}

export async function setUserRole(userId: string, email: string, role: RoleType): Promise<void> {
  const updatedAt = new Date().toISOString();
  
  if (isFirebaseAvailable && db) {
    const path = `roles/${userId}`;
    try {
      await setDoc(doc(db, 'roles', userId), {
        userId,
        email,
        role,
        updatedAt
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  } else {
    // Local fallback
    const rolesData = localStorage.getItem(KEYS.ROLES);
    let roles: Record<string, any> = {};
    if (rolesData) {
      try {
        roles = JSON.parse(rolesData);
      } catch (e) {}
    }
    roles[userId] = { userId, email, role, updatedAt };
    localStorage.setItem(KEYS.ROLES, JSON.stringify(roles));
  }
}

export async function getAllUserRoles(): Promise<UserRole[]> {
  if (isFirebaseAvailable && db) {
    try {
      const q = query(collection(db, 'roles'));
      const querySnapshot = await getDocs(q);
      const results: UserRole[] = [];
      querySnapshot.forEach((docSnap) => {
        results.push(docSnap.data() as UserRole);
      });
      return results;
    } catch (e) {
      console.warn('Error fetching roles from Firestore, using local fallback:', e);
      const rolesData = localStorage.getItem(KEYS.ROLES);
      if (rolesData) {
        try {
          const rolesMap = JSON.parse(rolesData);
          return Object.values(rolesMap) as UserRole[];
        } catch (err) {}
      }
      return [];
    }
  }

  // Local fallback
  const rolesData = localStorage.getItem(KEYS.ROLES);
  if (rolesData) {
    try {
      const rolesMap = JSON.parse(rolesData);
      return Object.values(rolesMap) as UserRole[];
    } catch (e) {
      return [];
    }
  }
  return [];
}


// --- 8. Content Moderation Reports System ---

export async function createReport(
  reporterId: string,
  itemType: 'profile' | 'question',
  itemId: string,
  itemTitle: string,
  reason: string
): Promise<ContentReport> {
  const newReport: ContentReport = {
    id: `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    reporterId,
    itemType,
    itemId,
    itemTitle,
    reason,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  if (isFirebaseAvailable && db) {
    const path = `reports/${newReport.id}`;
    try {
      await setDoc(doc(db, 'reports', newReport.id), newReport);
      return newReport;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  // Local fallback
  const reportsData = localStorage.getItem(KEYS.REPORTS);
  let reports: ContentReport[] = [];
  if (reportsData) {
    try {
      reports = JSON.parse(reportsData);
    } catch (e) {}
  }
  reports.push(newReport);
  localStorage.setItem(KEYS.REPORTS, JSON.stringify(reports));
  return newReport;
}

export async function getReports(): Promise<ContentReport[]> {
  if (isFirebaseAvailable && db) {
    try {
      const q = query(collection(db, 'reports'));
      const querySnapshot = await getDocs(q);
      const results: ContentReport[] = [];
      querySnapshot.forEach((docSnap) => {
        results.push(docSnap.data() as ContentReport);
      });
      return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (error) {
      console.error('Error fetching reports from Firestore, using local fallback:', error);
      const reportsData = localStorage.getItem(KEYS.REPORTS);
      if (reportsData) {
        try {
          return (JSON.parse(reportsData) as ContentReport[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        } catch (e) {}
      }
      return [];
    }
  }

  const reportsData = localStorage.getItem(KEYS.REPORTS);
  if (reportsData) {
    try {
      return (JSON.parse(reportsData) as ContentReport[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (e) {
      return [];
    }
  }
  return [];
}

export async function updateReportStatus(reportId: string, status: 'resolved' | 'dismissed'): Promise<void> {
  if (isFirebaseAvailable && db) {
    const path = `reports/${reportId}`;
    try {
      const docRef = doc(db, 'reports', reportId);
      await updateDoc(docRef, { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  } else {
    const reportsData = localStorage.getItem(KEYS.REPORTS);
    if (reportsData) {
      try {
        const reports = JSON.parse(reportsData) as ContentReport[];
        const idx = reports.findIndex(r => r.id === reportId);
        if (idx > -1) {
          reports[idx].status = status;
          localStorage.setItem(KEYS.REPORTS, JSON.stringify(reports));
        }
      } catch (e) {}
    }
  }
}


// --- 9. User System Notifications ---

export async function getNotifications(userId: string): Promise<UserNotification[]> {
  if (isFirebaseAvailable && db) {
    try {
      const q = query(collection(db, 'notifications'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const results: UserNotification[] = [];
      querySnapshot.forEach((docSnap) => {
        results.push(docSnap.data() as UserNotification);
      });
      return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (e) {
      console.warn('Error reading notifications from Firestore, using local fallback:', e);
      const notifsData = localStorage.getItem(KEYS.NOTIFICATIONS);
      if (notifsData) {
        try {
          const list = JSON.parse(notifsData) as UserNotification[];
          return list.filter(n => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        } catch (err) {}
      }
      return [];
    }
  }

  const notifsData = localStorage.getItem(KEYS.NOTIFICATIONS);
  if (notifsData) {
    try {
      const list = JSON.parse(notifsData) as UserNotification[];
      return list.filter(n => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (e) {
      return [];
    }
  }
  return [];
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: UserNotification['type']
): Promise<UserNotification> {
  const newNotif: UserNotification = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    title,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString()
  };

  if (isFirebaseAvailable && db) {
    const path = `notifications/${newNotif.id}`;
    try {
      await setDoc(doc(db, 'notifications', newNotif.id), newNotif);
      return newNotif;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  const notifsData = localStorage.getItem(KEYS.NOTIFICATIONS);
  let notifs: UserNotification[] = [];
  if (notifsData) {
    try {
      notifs = JSON.parse(notifsData);
    } catch (e) {}
  }
  notifs.push(newNotif);
  localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  return newNotif;
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  if (isFirebaseAvailable && db) {
    const path = `notifications/${notificationId}`;
    try {
      const docRef = doc(db, 'notifications', notificationId);
      await updateDoc(docRef, { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  } else {
    const notifsData = localStorage.getItem(KEYS.NOTIFICATIONS);
    if (notifsData) {
      try {
        const list = JSON.parse(notifsData) as UserNotification[];
        const idx = list.findIndex(n => n.id === notificationId);
        if (idx > -1) {
          list[idx].read = true;
          localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(list));
        }
      } catch (e) {}
    }
  }
}

export async function deleteNotification(notificationId: string): Promise<void> {
  if (isFirebaseAvailable && db) {
    const path = `notifications/${notificationId}`;
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  } else {
    const notifsData = localStorage.getItem(KEYS.NOTIFICATIONS);
    if (notifsData) {
      try {
        const list = JSON.parse(notifsData) as UserNotification[];
        const filtered = list.filter(n => n.id !== notificationId);
        localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(filtered));
      } catch (e) {}
    }
  }
}

export async function moderateProfile(uid: string, status: 'approved' | 'rejected'): Promise<void> {
  if (isFirebaseAvailable && db) {
    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, { moderationStatus: status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  } else {
    const local = loadLocalProfiles();
    const idx = local.findIndex(p => p.uid === uid);
    if (idx > -1) {
      local[idx].moderationStatus = status;
      saveLocalProfiles(local);
    }
  }
}
