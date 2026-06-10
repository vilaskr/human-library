export interface Project {
  title: string;
  url: string;
  description: string;
}

export interface SocialLinks {
  website?: string;
  github?: string;
  portfolio?: string;
  youtube?: string;
  linkedin?: string;
}

export interface Availability {
  questions: boolean;
  mentorship: boolean;
  collaboration: boolean;
}

export interface HumanProfile {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  profession: string;
  industry: string;
  location: string;
  bio: string; // Short story preview
  story: string; // Long-form storytelling (Markdown-friendly)
  dailyLife: string; // A day in my life routine
  lessonsLearned: string; // Lessons learned and wisdom
  expertiseTags: string[]; // Skill tags
  experienceTags: string[]; // Life experiences tags (e.g. Changed careers, Started a business)
  projects: Project[];
  socialLinks: SocialLinks;
  availability: Availability;
  yearsOfExperience: number;
  featured: boolean;
  views: number;
  searchAppearances: number;
  createdAt: string; // ISO string
  isDraft?: boolean;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
}

export type RoleType = 'admin' | 'moderator' | 'user';

export interface UserRole {
  userId: string;
  email: string;
  role: RoleType;
  updatedAt: string;
}

export interface ContentReport {
  id: string;
  reporterId: string;
  itemType: 'profile' | 'question';
  itemId: string;
  itemTitle: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'approved' | 'rejected' | 'reported' | 'role_assigned';
  read: boolean;
  createdAt: string;
}

export interface Question {
  id: string;
  profileOwnerId: string;
  askerId: string;
  askerName: string;
  question: string;
  visibility: 'public' | 'private';
  answer?: string;
  createdAt: string; // ISO string
}

export interface Bookmark {
  userId: string;
  profileId: string;
  createdAt: string;
}

export interface ProfileView {
  profileId: string;
  viewerId: string; // Optional / anonymous
  timestamp: string;
}
