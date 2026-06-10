import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { HumanProfile, Question } from '../types';
import { 
  getQuestions, 
  askQuestion, 
  recordProfileView,
  getProfileByUid
} from '../lib/storage';
import { 
  Bookmark, MapPin, Calendar, ExternalLink, Globe, 
  Github, Linkedin, Youtube, HelpCircle, Send, Check, 
  Clock, Award, Milestone, CornerDownRight, ArrowLeft, ArrowUpRight,
  BookOpen, Edit3
} from 'lucide-react';

export const PublicProfilePage: React.FC = () => {
  const { 
    routeParams, 
    navigateTo, 
    prevPage, 
    profiles, 
    user, 
    isBookmarked, 
    toggleBookmark,
    submitReport
  } = useApp();

  const [profile, setProfile] = useState<HumanProfile | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Ask Question form state
  const [askerName, setAskerName] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [questionSent, setQuestionSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Curation reporting state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const handleReportQuestion = async (qId: string, qText: string) => {
    const reason = prompt("Describe why this advisory question or answer is inappropriate (spam, harassment, etc.):");
    if (reason && reason.trim()) {
      await submitReport('question', qId, `Q: "${qText.substring(0, 30)}..."`, reason.trim());
      alert("Inappropriate content report filed. Curation staff will audit this thread shortly.");
    }
  };

  const handleReportProfile = async () => {
    if (!profile || !reportReason.trim()) return;
    await submitReport('profile', profile.uid, profile.name, reportReason.trim());
    setReportSubmitted(true);
    setReportReason('');
    setTimeout(() => {
      setShowReportModal(false);
      setReportSubmitted(false);
    }, 3500);
  };

  const profileUid = routeParams.uid;

  // Load profile details and questions
  const loadProfileDetails = async () => {
    if (!profileUid) return;
    
    // Find active profile in pre-loaded context cache
    let foundProfile = profiles.find(p => p.uid === profileUid);
    
    // Fallback: Fetch directly from database/localstorage
    if (!foundProfile) {
      const dbProfile = await getProfileByUid(profileUid);
      if (dbProfile) {
        foundProfile = dbProfile;
      }
    }
    
    if (foundProfile) {
      setProfile(foundProfile);
      
      // Load questions
      const qList = await getQuestions(profileUid);
      setQuestions(qList);
    }
  };

  useEffect(() => {
    loadProfileDetails();
  }, [profileUid, profiles]);

  // Handle Question Submission
  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !questionText.trim()) return;

    setIsSubmitting(true);
    try {
      const activeAskerId = user?.uid || 'anonymous';
      const activeAskerName = askerName.trim() || (user?.name) || 'Anonymous Visitor';
      const visibility = isPrivate ? 'private' : 'public';
      
      await askQuestion(
        profile.uid,
        activeAskerId,
        activeAskerName,
        questionText,
        visibility
      );

      setQuestionSent(true);
      setQuestionText('');
      setAskerName('');
      
      // Reload matching questions list after short pause
      setTimeout(() => {
        loadProfileDetails();
        setQuestionSent(false);
      }, 3000);
      
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-cream-bg dark:bg-[#121620] pb-24 text-warm-text dark:text-cream-bg transition-colors duration-200">
        
        {/* Floating Actions Skeleton Header */}
        <div className="bg-[#FDFBF7]/85 dark:bg-cream-dark-card/90 border-b border-cream-border dark:border-cream-dark-border sticky top-16 md:top-20 z-30 backdrop-blur-md">
          <div className="max-w-4xl mx-auto px-4 py-3.5 flex justify-between items-center">
            <div className="h-4 w-32 bg-cream-border dark:bg-cream-dark-border animate-pulse rounded" />
            <div className="flex space-x-3">
              <div className="h-6 w-20 bg-cream-border dark:bg-cream-dark-border animate-pulse rounded" />
              <div className="h-6 w-24 bg-cream-border dark:bg-cream-dark-border animate-pulse rounded-xl" />
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* LEFT PROFILE CARD SKELETON */}
            <div className="md:col-span-1">
              <div className="bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border p-6 rounded-2xl shadow-cozy text-center space-y-4">
                
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-cream-border dark:bg-cream-dark-border animate-pulse mx-auto" />
                
                <div className="space-y-2">
                  <div className="h-5 w-36 bg-cream-border dark:bg-cream-dark-border animate-pulse rounded mx-auto" />
                  <div className="h-3 w-20 bg-cream-border dark:bg-cream-dark-border animate-pulse rounded mx-auto" />
                </div>

                <div className="h-6 w-28 bg-cream-border/70 dark:bg-cream-dark-border/70 animate-pulse rounded-lg mx-auto" />

                {/* Stats divider skeleton */}
                <div className="grid grid-cols-2 gap-4 border-y border-cream-border dark:border-cream-dark-border py-4 my-5">
                  <div className="space-y-1">
                    <div className="h-4 w-10 bg-cream-border dark:bg-cream-dark-border animate-pulse rounded mx-auto" />
                    <div className="h-2.5 w-12 bg-cream-border/60 dark:bg-cream-dark-border/60 animate-pulse rounded mx-auto" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-4 w-10 bg-cream-border dark:bg-cream-dark-border animate-pulse rounded mx-auto" />
                    <div className="h-2.5 w-12 bg-cream-border/60 dark:bg-cream-dark-border/60 animate-pulse rounded mx-auto" />
                  </div>
                </div>

                {/* Status indicator list skeleton */}
                <div className="space-y-3 pt-2 text-left">
                  <div className="h-3 w-24 bg-cream-border dark:bg-cream-dark-border animate-pulse rounded mb-3" />
                  <div className="flex justify-between">
                    <div className="h-3 w-16 bg-cream-border/60 dark:bg-cream-dark-border/60 animate-pulse rounded" />
                    <div className="h-4 w-12 bg-cream-border/70 dark:bg-cream-dark-border/70 animate-pulse rounded" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-3 w-16 bg-cream-border/60 dark:bg-cream-dark-border/60 animate-pulse rounded" />
                    <div className="h-4 w-12 bg-cream-border/70 dark:bg-cream-dark-border/70 animate-pulse rounded" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-3 w-16 bg-cream-border/60 dark:bg-cream-dark-border/60 animate-pulse rounded" />
                    <div className="h-4 w-12 bg-cream-border/70 dark:bg-cream-dark-border/70 animate-pulse rounded" />
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT BIOGRAPHY SKELETON */}
            <div className="md:col-span-2 space-y-10">
              
              {/* Card info pitch */}
              <div className="bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border p-8 rounded-2xl shadow-paper space-y-4">
                <div className="h-3.5 w-24 bg-cream-border/60 dark:bg-cream-dark-border/60 animate-pulse rounded ml-auto" />
                <div className="h-7 w-48 bg-cream-border dark:bg-cream-dark-border animate-pulse rounded" />
                <div className="h-4 w-36 bg-cream-border/80 dark:bg-cream-dark-border/80 animate-pulse rounded" />
                <div className="h-1 w-full bg-cream-border/40 dark:bg-cream-dark-border/40 my-2 shadow-sm" />
                
                <div className="space-y-2 border-l-2 border-cream-border dark:border-cream-dark-border pl-4">
                  <div className="h-4 w-full bg-cream-border/70 dark:bg-cream-dark-border/70 animate-pulse rounded" />
                  <div className="h-4 w-11/12 bg-cream-border/70 dark:bg-cream-dark-border/70 animate-pulse rounded" />
                </div>
              </div>

              {/* Story Chapters reflection */}
              <div className="space-y-4">
                <div className="h-5 w-48 bg-cream-border dark:bg-cream-dark-border animate-pulse rounded mb-3" />
                <div className="h-px bg-cream-border dark:bg-cream-dark-border w-full mb-4" />
                <div className="space-y-3 font-serif">
                  <div className="h-4 w-full bg-cream-border/60 dark:bg-cream-dark-border/60 animate-pulse rounded" />
                  <div className="h-4 w-full bg-cream-border/60 dark:bg-cream-dark-border/60 animate-pulse rounded" />
                  <div className="h-4 w-11/12 bg-cream-border/60 dark:bg-cream-dark-border/60 animate-pulse rounded" />
                  <div className="h-4 w-10/12 bg-cream-border/60 dark:bg-cream-dark-border/60 animate-pulse rounded" />
                  <div className="h-4 w-4/5 bg-cream-border/60 dark:bg-cream-dark-border/60 animate-pulse rounded" />
                </div>
              </div>

              {/* Story Chapters II reflection */}
              <div className="space-y-4">
                <div className="h-5 w-40 bg-cream-border dark:bg-cream-dark-border animate-pulse rounded mb-3" />
                <div className="h-px bg-cream-border dark:bg-cream-dark-border w-full mb-4" />
                <div className="bg-cream-border/10 dark:bg-cream-dark-card/30 p-6 rounded-2xl border border-cream-border dark:border-cream-dark-border space-y-3">
                  <div className="h-4 w-full bg-cream-border/60 dark:bg-cream-dark-border/60 animate-pulse rounded" />
                  <div className="h-4 w-11/12 bg-cream-border/60 dark:bg-cream-dark-border/60 animate-pulse rounded" />
                  <div className="h-4 w-5/6 bg-cream-border/60 dark:bg-cream-dark-border/60 animate-pulse rounded" />
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    );
  }

  // Filter public questions with verified answers for display
  const answeredQuestions = questions.filter(q => q.visibility === 'public' && q.answer);

  // Derive related profiles (same industry or close profession, exclude current profile)
  const relatedProfiles = profiles
    .filter(p => !p.isDraft && p.uid !== profile.uid && (p.industry === profile.industry || p.profession === profile.profession))
    .slice(0, 2);

  // Fallback to any other random featured profiles if none match same industry
  if (relatedProfiles.length < 2) {
    const backup = profiles
      .filter(p => !p.isDraft && p.uid !== profile.uid && !relatedProfiles.some(rp => rp.uid === p.uid))
      .slice(0, 2 - relatedProfiles.length);
    relatedProfiles.push(...backup);
  }

  const bookmarked = isBookmarked(profile.uid);

  // Calculate reading stats (word count and estimated minutes)
  const calculateReadingStats = (p: HumanProfile) => {
    const storyText = p.story || '';
    const dailyText = p.dailyLife || '';
    const lessonsText = p.lessonsLearned || '';
    const combinedText = `${storyText} ${dailyText} ${lessonsText}`.trim();
    
    if (!combinedText) {
      return { words: 0, minutes: 0 };
    }
    
    const words = combinedText.split(/\s+/).filter(Boolean).length;
    // Standard reading speed is ~200 WPM
    const minutes = Math.max(1, Math.ceil(words / 200));
    return { words, minutes };
  };

  const readingStats = calculateReadingStats(profile);

  return (
    <div className="min-h-screen bg-cream-bg dark:bg-cream-dark-bg pb-24 text-warm-text dark:text-cream-bg transition-colors duration-200">
      
      {/* 1. BACK CONTROLLER & ACTION HEADER */}
      <div className="bg-[#FDFBF7]/85 dark:bg-cream-dark-card/90 border-b border-cream-border dark:border-cream-dark-border sticky top-16 md:top-20 z-30 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <button 
            onClick={prevPage}
            className="flex items-center space-x-1.5 text-xs font-mono text-warm-muted hover:text-warm-text dark:hover:text-cream-bg cursor-pointer"
            id="profile-back-btn"
          >
            <ArrowLeft className="w-4 h-4 text-olive" />
            <span>Return to Catalog</span>
          </button>

          <div className="flex items-center space-x-3">
            {user && user.uid === profile.uid && (
              <button 
                onClick={() => navigateTo('editor')}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-olive text-white dark:bg-olive-light dark:text-cream-dark-bg cursor-pointer hover:bg-olive-dark rounded-xl text-xs font-mono transition-all duration-200 shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Biography</span>
              </button>
            )}
            <span className="text-[10px] font-mono px-2 py-0.5 bg-olive-accent/25 dark:bg-cream-dark-bg border border-cream-border/30 text-olive dark:text-olive-light rounded">
              Book ID: {profile.uid.substring(0, 6)}
            </span>
            <button 
              onClick={() => toggleBookmark(profile.uid)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono cursor-pointer transition-all ${
                bookmarked 
                  ? 'bg-amber-50/20 border-amber-200 text-amber-600' 
                  : 'bg-white dark:bg-cream-dark-card border-cream-border dark:border-cream-dark-border text-warm-muted dark:text-warm-light-muted hover:bg-olive-light'
              }`}
              id="profile-bookmark-trigger"
            >
              <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
              <span>{bookmarked ? 'Saved in Library' : 'Save Book'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-12">
        {/* PREMIUM HERO PANEL HEADER */}
        <div className="text-center pb-12 border-b border-cream-border dark:border-cream-dark-border">
          
          <div className="relative inline-block mb-6">
            <img 
              src={profile.photoURL} 
              alt={profile.name} 
              className="w-32 h-32 md:w-36 md:h-36 rounded-full mx-auto object-cover border-4 border-white dark:border-cream-dark-card shadow-lg hover:scale-105 transition-all duration-300"
            />
          </div>

          <h1 className="font-serif font-bold text-3xl sm:text-5xl text-warm-text dark:text-cream-bg tracking-tight">
            {profile.name}
          </h1>
          
          <p className="text-lg md:text-xl font-serif font-medium text-olive dark:text-olive-light mt-2">
            {profile.profession}
          </p>

          <p className="text-xs md:text-sm text-warm-muted dark:text-warm-light-muted mt-2.5 font-mono uppercase tracking-wider flex flex-wrap justify-center items-center gap-x-4 gap-y-1.5">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-olive shrink-0" />
              <span>{profile.location}</span>
            </span>
            <span className="hidden sm:inline h-3 w-px bg-cream-border dark:bg-cream-dark-border" />
            <span className="flex items-center gap-1.5 text-olive dark:text-olive-light font-medium">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{readingStats.minutes} {readingStats.minutes === 1 ? 'min' : 'mins'} read ({readingStats.words} words)</span>
            </span>
          </p>

          {profile.bio && (
            <div className="max-w-2xl mx-auto italic text-base sm:text-lg text-neutral-600 dark:text-[#E8DDCB] leading-relaxed font-serif text-center mt-6 py-4 px-6 bg-olive/5 dark:bg-olive/10 rounded-2xl border-l-4 border-olive">
              "{profile.bio}"
            </div>
          )}

          {/* Social connections - only displayed if populated */}
          {profile.socialLinks && Object.values(profile.socialLinks).some(Boolean) && (
            <div className="flex flex-wrap justify-center gap-3.5 mt-8">
              {profile.socialLinks.website && (
                <a href={profile.socialLinks.website} target="_blank" rel="noreferrer" className="flex items-center space-x-1.5 px-3.5 py-2 bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border rounded-full text-xs font-mono text-warm-muted hover:text-olive transition-colors shadow-sm">
                  <Globe className="w-4 h-4 text-olive" />
                  <span>Website</span>
                </a>
              )}
              {profile.socialLinks.github && (
                <a href={profile.socialLinks.github} target="_blank" rel="noreferrer" className="flex items-center space-x-1.5 px-3.5 py-2 bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border rounded-full text-xs font-mono text-warm-muted hover:text-warm-text transition-colors shadow-sm">
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
              )}
              {profile.socialLinks.linkedin && (
                <a href={profile.socialLinks.linkedin} target="_blank" rel="noreferrer" className="flex items-center space-x-1.5 px-3.5 py-2 bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border rounded-full text-xs font-mono text-warm-muted hover:text-olive transition-colors shadow-sm">
                  <Linkedin className="w-4 h-4 text-olive" />
                  <span>LinkedIn</span>
                </a>
              )}
              {profile.socialLinks.youtube && (
                <a href={profile.socialLinks.youtube} target="_blank" rel="noreferrer" className="flex items-center space-x-1.5 px-3.5 py-2 bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border rounded-full text-xs font-mono text-warm-muted hover:text-rose-600 transition-colors shadow-sm">
                  <Youtube className="w-4 h-4 text-rose-500" />
                  <span>YouTube</span>
                </a>
              )}
            </div>
          )}

          {/* Stats Bar */}
          <div className="flex justify-center items-center gap-6 sm:gap-8 mt-6 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-sm font-mono font-bold text-warm-text dark:text-cream-bg">
                {profile.yearsOfExperience}+
              </div>
              <div className="text-[10px] text-warm-light-muted font-mono uppercase tracking-wider">Years Experience</div>
            </div>
            
            <div className="h-6 w-px bg-cream-border dark:bg-cream-dark-border"></div>
            
            <div className="text-center">
              <div className="text-sm font-mono font-bold text-olive dark:text-olive-light">
                {readingStats.minutes} {readingStats.minutes === 1 ? 'Min' : 'Mins'}
              </div>
              <div className="text-[10px] text-warm-light-muted font-mono uppercase tracking-wider">Reading Time</div>
            </div>

            <div className="h-6 w-px bg-cream-border dark:bg-cream-dark-border"></div>
            
            <div className="text-center">
              <div className="text-sm font-mono font-bold text-warm-text dark:text-cream-bg">
                {profile.views || 10}
              </div>
              <div className="text-[10px] text-warm-light-muted font-mono uppercase tracking-wider">Lectures Read</div>
            </div>
          </div>
        </div>

        {/* LITERARY TEXT ENGINE - BIOGRAPHY CHANNELS */}
        <div className="space-y-12 mt-12">
          
          {/* ABOUT ME SECTION (COMFORTABLE TYPOGRAPHY & SPACING) */}
          <section className="lecture-container">
            <div className="flex items-center space-x-2.5 mb-6 border-b border-cream-border dark:border-cream-dark-border pb-2">
              <BookOpen className="w-4 h-4 text-olive shrink-0" />
              <h2 className="font-serif font-semibold text-sm uppercase tracking-wider text-warm-text dark:text-cream-bg">
                About Me
              </h2>
            </div>

            {/* Story text (spacious, styled beautifully for long-form reading) */}
            <div className="text-neutral-800 dark:text-cream-bg font-serif text-lg leading-relaxed whitespace-pre-line space-y-6 max-w-3xl pr-2 select-text antialiased">
              {profile.story || `${profile.name} is preparing to catalog their career reflections in this vault.`}
            </div>

            {/* BEAUTIFUL ROUNDED INTEREST CHIPS */}
            {profile.expertiseTags && profile.expertiseTags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-cream-border/60 dark:border-cream-dark-border/40">
                <h3 className="text-[11px] font-mono uppercase tracking-wider text-warm-muted dark:text-warm-light-muted mb-3.5">
                  Interests & Specialty Tags
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {profile.expertiseTags.map((skill, index) => (
                    <span 
                      key={index} 
                      className="px-4 py-2 bg-olive/10 hover:bg-olive/15 text-olive dark:bg-olive/20 dark:text-olive-light text-xs font-mono rounded-full border border-olive/10 dark:border-olive/20 transition-all cursor-pointer"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Chapter 2: A Day In My Life */}
          {profile.dailyLife && (
            <section className="lecture-container border-t border-cream-border/40 dark:border-cream-dark-border/40 pt-10">
              <div className="flex items-center space-x-2.5 mb-5 border-b border-cream-border dark:border-cream-dark-border pb-2">
                <Clock className="w-4 h-4 text-olive shrink-0" />
                <h4 className="font-serif font-semibold text-sm uppercase tracking-wider text-warm-text dark:text-cream-bg">
                  Chapter II. A Day in My Life
                </h4>
              </div>

              <div className="bg-olive/5 dark:bg-cream-dark-card/30 p-6 sm:p-7 rounded-2xl border border-cream-border dark:border-cream-dark-border">
                <div className="text-neutral-800 dark:text-cream-bg font-sans text-[15px] leading-relaxed whitespace-pre-line space-y-3">
                  {profile.dailyLife}
                </div>
              </div>
            </section>
          )}

          {/* Chapter 3: What I Have Learned */}
          {profile.lessonsLearned && (
            <section className="lecture-container border-t border-cream-border/40 dark:border-cream-dark-border/40 pt-10">
              <div className="flex items-center space-x-2.5 mb-5 border-b border-cream-border dark:border-cream-dark-border pb-2">
                <Award className="w-4 h-4 text-olive shrink-0" />
                <h4 className="font-serif font-semibold text-sm uppercase tracking-wider text-warm-text dark:text-cream-bg">
                  Chapter III. Crucial Lessons Learned
                </h4>
              </div>

              <div className="text-neutral-800 dark:text-cream-bg font-serif text-lg leading-relaxed whitespace-pre-line space-y-4 max-w-3xl">
                {profile.lessonsLearned}
              </div>
            </section>
          )}

          {/* Chapter 4: Key Experience Milestones */}
          {profile.experienceTags && profile.experienceTags.length > 0 && (
            <section className="lecture-container border-t border-cream-border/40 dark:border-cream-dark-border/40 pt-10">
              <div className="flex items-center space-x-2.5 mb-5 border-b border-cream-border dark:border-cream-dark-border pb-2">
                <Milestone className="w-4 h-4 text-olive shrink-0" />
                <h4 className="font-serif font-semibold text-sm uppercase tracking-wider text-warm-text dark:text-cream-bg">
                  Life Experiences & Pivots
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {profile.experienceTags.map((pivot, idx) => (
                  <div 
                    key={idx}
                    className="p-3.5 bg-white dark:bg-cream-dark-card/40 rounded-xl border border-cream-border dark:border-cream-dark-border flex items-center space-x-3 text-xs"
                  >
                    <CornerDownRight className="w-4 h-4 text-olive shrink-0" />
                    <span className="font-mono text-warm-text dark:text-cream-bg">{pivot}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Registered projects */}
          {profile.projects && profile.projects.length > 0 && (
            <section className="lecture-container border-t border-cream-border dark:border-cream-dark-border pt-10">
                <h4 className="font-serif font-bold text-base text-warm-text dark:text-cream-bg mb-4">
                  Curated Initiatives & Projects
                </h4>
                <div className="space-y-4">
                  {profile.projects.map((proj, idx) => (
                    <a 
                      href={proj.url} 
                      target="_blank" 
                      rel="noreferrer"
                      key={idx}
                      className="block p-5 bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border rounded-2xl shadow-cozy hover:border-olive/30 dark:hover:border-cream-dark-border transition-all group"
                    >
                      <div className="flex justify-between items-start">
                        <h5 className="font-serif font-bold text-sm sm:text-base text-warm-text dark:text-cream-bg group-hover:text-olive dark:group-hover:text-olive-light transition-colors">
                          {proj.title}
                        </h5>
                        <ArrowUpRight className="w-4 h-4 text-warm-light-muted group-hover:text-warm-text dark:group-hover:text-cream-bg transition-colors" />
                      </div>
                      <p className="text-xs sm:text-sm text-warm-muted dark:text-warm-light-muted mt-2 font-sans line-clamp-2">
                        {proj.description}
                      </p>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* ASK QUESTION SYSTEM */}
            {profile.availability?.questions && (
              <section className="lecture-container border-t border-cream-border dark:border-cream-dark-border pt-10">
                <div className="bg-olive-accent/30 dark:bg-cream-dark-card p-6 sm:p-8 rounded-2xl border border-cream-border dark:border-cream-dark-border relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-olive-light/20 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="flex items-center space-x-2.5 mb-4">
                    <HelpCircle className="w-5 h-5 text-olive shrink-0" />
                    <h4 className="font-serif font-bold text-base sm:text-lg text-warm-text dark:text-cream-bg">
                      Ask {profile.name.split(' ')[0]} Something
                    </h4>
                  </div>

                  <p className="text-xs text-warm-muted dark:text-warm-light-muted mb-6">
                    Looking for advice on transitioning, tools, or local ecosystems? Inquire privately, or publish standard questions publicly once their response is logged.
                  </p>

                  {questionSent ? (
                    <div className="p-4 bg-olive-accent/50 dark:bg-cream-dark-bg border border-cream-border text-olive dark:text-olive-light rounded-xl flex items-center space-x-3 text-xs sm:text-sm">
                      <Check className="w-5 h-5" />
                      <span>Thank you. Your inquiry has been safely log queued for {profile.name}.</span>
                    </div>
                  ) : (
                    <form onSubmit={handleAskQuestion} className="space-y-4">
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-warm-muted dark:text-warm-light-muted mb-1">
                            Your Name (optional)
                          </label>
                          <input 
                            type="text" 
                            value={askerName}
                            onChange={(e) => setAskerName(e.target.value)}
                            placeholder="Anonymous Visitor"
                            className="w-full text-xs px-3.5 py-2 rounded-xl bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border text-warm-text dark:text-cream-bg placeholder:text-warm-light-muted focus:outline-none focus:ring-1 focus:ring-olive"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-warm-muted dark:text-warm-light-muted mb-1">
                            Visibility
                          </label>
                          <div className="flex space-x-3 pt-1">
                            <label className="flex items-center space-x-2 text-xs text-warm-text dark:text-[#E8DDCB] cursor-pointer">
                              <input 
                                type="radio" 
                                checked={!isPrivate}
                                onChange={() => setIsPrivate(false)}
                                className="accent-olive"
                              />
                              <span>Public Query</span>
                            </label>
                            <label className="flex items-center space-x-2 text-xs text-warm-text dark:text-[#E8DDCB] cursor-pointer">
                              <input 
                                type="radio" 
                                checked={isPrivate}
                                onChange={() => setIsPrivate(true)}
                                className="accent-olive"
                              />
                              <span>Private / Anon</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase text-warm-muted dark:text-warm-light-muted mb-1">
                          Inquiry Reflective Text
                        </label>
                        <textarea 
                          rows={3}
                          value={questionText}
                          onChange={(e) => setQuestionText(e.target.value)}
                          placeholder="Compose a honest question about their techniques, books or transition..."
                          required
                          className="w-full text-xs px-3.5 py-3 rounded-xl bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border text-warm-text dark:text-cream-bg placeholder:text-warm-light-muted focus:outline-none focus:ring-1 focus:ring-olive"
                        ></textarea>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button 
                          type="submit"
                          disabled={isSubmitting}
                          className="px-5 py-2.5 bg-olive hover:bg-olive-dark text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Forward Question</span>
                        </button>
                      </div>

                    </form>
                  )}
                </div>
              </section>
            )}

            {/* PUBLIC QUESTION ANSWERS BOARD */}
            {answeredQuestions.length > 0 && (
              <section className="lecture-container space-y-6">
                <h4 className="font-serif font-bold text-base text-warm-text dark:text-cream-bg border-b border-cream-border dark:border-cream-dark-border pb-2">
                  Answered Public Queries ({answeredQuestions.length})
                </h4>
                
                <div className="space-y-6">
                  {answeredQuestions.map((q) => (
                    <div 
                      key={q.id}
                      className="p-5 bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border rounded-2xl shadow-cozy space-y-4"
                      id={`public-q-${q.id}`}
                    >
                      <div className="flex items-start space-x-3 text-xs">
                        <span className="p-1.5 bg-cream-border dark:bg-cream-dark-bg text-warm-muted rounded-lg font-mono">Q</span>
                        <div>
                          <p className="font-semibold text-warm-text dark:text-cream-bg">
                            Asked by {q.askerName}
                          </p>
                          <p className="text-warm-muted dark:text-warm-light-muted mt-1 leading-relaxed italic">
                            "{q.question}"
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 text-xs border-t border-cream-border dark:border-cream-dark-border pt-4 pl-4 sm:pl-6">
                        <span className="p-1.5 bg-olive-muted dark:bg-cream-dark-bg text-olive dark:text-olive-light rounded-lg shrink-0 font-bold font-mono">A</span>
                        <div>
                          <p className="font-semibold text-warm-text dark:text-cream-bg">
                            {profile.name} responded:
                          </p>
                          <p className="text-warm-muted dark:text-warm-light-muted mt-1 leading-relaxed">
                            {q.answer}
                          </p>
                          <div className="flex justify-between items-center mt-2.5 pt-1.5 border-t border-cream-border/30 animate-fade-in">
                            <span className="block text-[9px] font-mono text-warm-light-muted">
                              Completed: {new Date(q.createdAt).toLocaleDateString()}
                            </span>
                            {user && (
                              <button 
                                onClick={() => handleReportQuestion(q.id, q.question)}
                                className="text-[10px] font-mono text-rose-500 hover:underline hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                Flag Abuse
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* RELATED HUMANS SECTION */}
            <section className="lecture-container border-t border-cream-border dark:border-cream-dark-border pt-10">
              <h4 className="font-serif font-bold text-base text-warm-text dark:text-cream-bg mb-6">
                Explore Alternative Volumes
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedProfiles.map((p) => (
                  <div 
                    key={p.uid}
                    onClick={() => navigateTo('human', { uid: p.uid })}
                    className="p-5 bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border rounded-2xl cursor-pointer hover:border-olive/30 dark:hover:border-cream-dark-border transition-all flex items-center space-x-4 group"
                  >
                    <img 
                      src={p.photoURL} 
                      alt={p.name} 
                      className="w-10 h-10 rounded-full object-cover border border-cream-border/30"
                    />
                    <div>
                      <h5 className="font-serif font-bold text-sm text-warm-text dark:text-cream-bg group-hover:text-olive dark:group-hover:text-olive-light transition-colors">
                        {p.name}
                      </h5>
                      <p className="text-[10px] text-warm-muted dark:text-warm-light-muted">
                        {p.profession}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>

      </div>

      {/* REPORT BIOGRAPHY INPUT MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-olive-dark/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-cream-dark-card rounded-2xl w-full max-w-md p-6 shadow-paper border border-cream-border dark:border-cream-dark-border">
            <h3 className="font-serif font-bold text-lg text-warm-text dark:text-cream-bg mb-2">
              Report Content Infraction
            </h3>
            <p className="text-xs text-warm-muted dark:text-warm-light-muted mb-4 font-sans">
              Help maintain a high standard of professional integrity. File an anonymous review request with the library curators.
            </p>
            
            {reportSubmitted ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center space-x-2 animate-fade-in mb-2">
                <Check className="w-5 h-5 shrink-0" />
                <span>Thank you. Your feedback report has been logged and queued for audit.</span>
              </div>
            ) : (
              <>
                <textarea
                  rows={4}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Describe why this profile contains inappropriate, spam, or misleading biographical material..."
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-border dark:border-cream-dark-border bg-transparent text-warm-text dark:text-cream-bg text-xs focus:outline-none focus:ring-2 focus:ring-olive mb-4"
                />

                <div className="flex space-x-2.5">
                  <button
                    onClick={handleReportProfile}
                    disabled={!reportReason.trim()}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-medium py-2.5 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    Confirm Report
                  </button>
                  <button
                    onClick={() => {
                      setShowReportModal(false);
                      setReportReason('');
                    }}
                    className="flex-1 border text-warm-muted font-medium py-2.5 rounded-xl text-xs hover:bg-olive-light dark:hover:bg-cream-dark-bg cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
