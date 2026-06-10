import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ProfileEditor } from './ProfileEditor';
import { HumanProfile, Question } from '../types';
import { 
  getQuestions, 
  answerQuestion, 
  deleteQuestion, 
  getProfiles,
  getMockUser
} from '../lib/storage';
import { 
  User, FileText, MessageSquare, Bookmark, BarChart3, Settings, 
  Plus, Check, Trash, Eye, Globe, Github, Linkedin, Youtube, 
  Inbox, Trash2, ArrowUpRight, Award, LogOut, CheckCircle, ShieldCheck
} from 'lucide-react';

export const UserDashboard: React.FC = () => {
  const { user, userProfile, bookmarks, refreshProfiles, signOut, profiles, navigateTo } = useApp();
  const [activeTab, setActiveTab] = useState<'profile' | 'edit' | 'questions' | 'saved' | 'analytics' | 'settings'>('profile');
  
  // Dashboard states
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  
  // Direct bookmark items resolved to actual Profiles
  const [savedPeopleProfiles, setSavedPeopleProfiles] = useState<HumanProfile[]>([]);

  // Load user questions
  const loadIncomingQuestions = async () => {
    if (!user) return;
    setLoadingQuestions(true);
    try {
      const qList = await getQuestions(user.uid);
      setQuestions(qList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Resolve bookmark lists to actual Profile sheets
  const resolveBookmarks = () => {
    if (bookmarks.length > 0 && profiles.length > 0) {
      const matched = profiles.filter((p) => 
        bookmarks.some((b) => b.profileId === p.uid)
      );
      setSavedPeopleProfiles(matched);
    } else {
      setSavedPeopleProfiles([]);
    }
  };

  useEffect(() => {
    if (user) {
      loadIncomingQuestions();
      resolveBookmarks();
    }
  }, [user, bookmarks, profiles]);

  if (!user) {
    return (
      <div className="min-h-screen bg-cream-bg dark:bg-cream-dark-bg flex items-center justify-center p-4">
        <div className="bg-white dark:bg-cream-dark-card p-8 rounded-2xl border border-cream-border dark:border-cream-dark-border text-center max-w-sm shadow-paper">
          <ShieldCheck className="w-12 h-12 text-olive dark:text-olive-light mx-auto mb-4" />
          <h3 className="font-serif font-bold text-lg text-warm-text dark:text-cream-bg">Workspace Area Only</h3>
          <p className="text-xs text-warm-muted dark:text-warm-light-muted mt-2">
            Authenticate your library card at the top-navigation bar to view your workspace or register as a human guide.
          </p>
        </div>
      </div>
    );
  }

  // Question Answer actions
  const handleSubmitAnswer = async (qId: string) => {
    if (!responseText.trim()) return;
    try {
      await answerQuestion(qId, responseText);
      setResponseText('');
      setAnsweringId(null);
      await loadIncomingQuestions();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (window.confirm('Delete this question from catalog?')) {
      try {
        await deleteQuestion(qId);
        await loadIncomingQuestions();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Derive completeness percentage
  const calculateCompleteness = () => {
    if (!userProfile) return 0;
    let score = 20;
    if (userProfile.profession) score += 10;
    if (userProfile.location) score += 10;
    if (userProfile.bio) score += 15;
    if (userProfile.story && userProfile.story.length > 200) score += 15;
    if (userProfile.dailyLife) score += 10;
    if (userProfile.lessonsLearned) score += 10;
    if (userProfile.expertiseTags?.length > 0) score += 5;
    if (userProfile.socialLinks && Object.values(userProfile.socialLinks).some(Boolean)) score += 5;
    return score;
  };

  const completeness = calculateCompleteness();

  return (
    <div className="min-h-screen bg-cream-bg dark:bg-cream-dark-bg pb-24 text-warm-text dark:text-cream-bg transition-colors duration-200">
      
      {/* Dynamic Workspace banner */}
      <div className="bg-[#FDFBF7]/85 dark:bg-cream-dark-card/60 border-b border-cream-border dark:border-cream-dark-border py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <img 
                src={user.photoURL} 
                alt={user.name} 
                className="w-14 h-14 rounded-full object-cover border-2 border-olive/15"
              />
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-warm-text dark:text-cream-bg">
                  Curator Workspace
                </h2>
                <p className="text-xs text-warm-muted font-mono">
                  Welcome back, <span className="font-sans font-semibold text-warm-text dark:text-cream-bg">{user.name}</span> · {user.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* SIDEBAR NAVIGATION - DESKTOP */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border p-4 rounded-2xl shadow-cozy space-y-1">
              
              <button 
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'profile' 
                    ? 'bg-olive-muted text-olive dark:bg-olive/10 dark:text-olive-light border-l-2 border-olive' 
                    : 'text-warm-muted dark:text-warm-light-muted hover:bg-olive-light dark:hover:bg-cream-dark-bg'
                }`}
                id="tab-profile-trigger"
              >
                <User className="w-4 h-4" />
                <span>My Profile Entry</span>
              </button>

              <button 
                onClick={() => setActiveTab('edit')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'edit'
                    ? 'bg-olive-muted text-olive dark:bg-olive/10 dark:text-olive-light border-l-2 border-olive' 
                    : 'text-warm-muted dark:text-warm-light-muted hover:bg-olive-light dark:hover:bg-cream-dark-bg'
                }`}
                id="tab-edit-trigger"
              >
                <FileText className="w-4 h-4" />
                <span>Revise Biography</span>
              </button>

              <button 
                onClick={() => setActiveTab('questions')}
                className={`w-full flex justify-between items-center px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'questions'
                    ? 'bg-olive-muted text-olive dark:bg-olive/10 dark:text-olive-light border-l-2 border-olive' 
                    : 'text-warm-muted dark:text-warm-light-muted hover:bg-olive-light dark:hover:bg-cream-dark-bg'
                }`}
                id="tab-questions-trigger"
              >
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-4 h-4" />
                  <span>Queries Received</span>
                </div>
                {questions.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-mono rounded-full font-bold">
                    {questions.filter(q => !q.answer).length}
                  </span>
                )}
              </button>

              <button 
                onClick={() => setActiveTab('saved')}
                className={`w-full flex justify-between items-center px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'saved'
                    ? 'bg-olive-muted text-olive dark:bg-olive/10 dark:text-olive-light border-l-2 border-olive' 
                    : 'text-warm-muted dark:text-warm-light-muted hover:bg-olive-light dark:hover:bg-cream-dark-bg'
                }`}
                id="tab-saved-trigger"
              >
                <div className="flex items-center space-x-3">
                  <Bookmark className="w-4 h-4" />
                  <span>Saved Library</span>
                </div>
                {bookmarks.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-cream-border dark:bg-cream-dark-bg dark:text-warm-light-muted text-warm-muted text-[10px] font-mono rounded">
                    {bookmarks.length}
                  </span>
                )}
              </button>

              <button 
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-olive-muted text-olive dark:bg-olive/10 dark:text-olive-light border-l-2 border-olive' 
                    : 'text-warm-muted dark:text-warm-light-muted hover:bg-olive-light dark:hover:bg-cream-dark-bg'
                }`}
                id="tab-analytics-trigger"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analytics Grid</span>
              </button>
            </div>
          </div>

          {/* DYNAMIC TAB CONTROLLER PANEL */}
          <div className="lg:col-span-3">
            {/* TAB 1: Profile card summary overview */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-fade-in">
                
                {(!userProfile || userProfile.isDraft) ? (
                  <div className="bg-olive-accent/30 dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border rounded-2xl p-6 sm:p-8 flex items-start space-x-4">
                    <Inbox className="w-8 h-8 text-olive shrink-0 mt-1" />
                    <div>
                      <h4 className="font-serif font-bold text-base text-warm-text dark:text-cream-bg">Draft Biographical Entry Only</h4>
                      <p className="text-xs text-warm-muted dark:text-warm-light-muted mt-2 max-w-xl font-sans leading-relaxed">
                        You have registered your card, but your biography is currently empty or in draft status. Tap "Revise Biography" above to compose your life lessons and publish your volume to the catalog search map.
                      </p>
                      <button 
                        onClick={() => setActiveTab('edit')}
                        className="mt-4 px-4 py-2.5 bg-olive text-white rounded-xl text-xs font-mono font-semibold hover:bg-olive-dark transition-all shadow-sm cursor-pointer"
                      >
                        Launch Multi-step Writer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border p-6 sm:p-8 rounded-2xl shadow-cozy space-y-6">
                    
                    {/* General outline */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-cream-border dark:border-cream-dark-border space-y-4 sm:space-y-0">
                      <div>
                        <span className="px-2 py-0.5 bg-olive-accent/50 text-olive dark:text-olive-light dark:bg-olive/15 border border-cream-border/35 dark:border-cream-dark-border/25 text-[10px] font-mono tracking-wider rounded uppercase">
                          Active Index Page
                        </span>
                        <h3 className="font-serif font-bold text-2xl text-warm-text dark:text-cream-bg mt-2">
                          {userProfile.name}
                        </h3>
                        <p className="text-olive dark:text-olive-light text-xs font-mono uppercase mt-0.5">
                          {userProfile.profession} · {userProfile.location}
                        </p>
                      </div>

                      <a 
                        href={`#`} 
                        onClick={(e) => { e.preventDefault(); navigateTo('human', { uid: userProfile.uid }); }}
                        className="flex items-center space-x-1 border border-cream-border dark:border-cream-dark-border px-4 py-2.5 rounded-xl text-xs font-mono text-warm-text dark:text-cream-bg hover:bg-olive-light cursor-pointer"
                      >
                        <span>Open Public Page</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {/* Simple summary cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-olive-muted/60 dark:bg-cream-dark-bg rounded-xl border border-cream-border/30 dark:border-cream-dark-border/30 relative">
                        <span className="text-xs text-warm-muted dark:text-warm-light-muted font-mono uppercase">Views</span>
                        <div className="font-serif text-2xl font-bold text-warm-text dark:text-cream-bg mt-1">
                          {userProfile.views || 0}
                        </div>
                      </div>

                      <div className="p-4 bg-olive-muted/60 dark:bg-cream-dark-bg rounded-xl border border-cream-border/30 dark:border-cream-dark-border/30">
                        <span className="text-xs text-warm-muted dark:text-warm-light-muted font-mono uppercase">Searches matched</span>
                        <div className="font-serif text-2xl font-bold text-warm-text dark:text-cream-bg mt-1">
                          {userProfile.searchAppearances || 0}
                        </div>
                      </div>

                      <div className="p-4 bg-olive-muted/60 dark:bg-cream-dark-bg rounded-xl border border-cream-border/30 dark:border-cream-dark-border/30">
                        <span className="text-xs text-warm-muted dark:text-warm-light-muted font-mono uppercase">Completeness</span>
                        <div className="font-serif text-2xl font-bold text-warm-text dark:text-cream-bg mt-1 flex items-baseline">
                          <span>{completeness}%</span>
                          <span className="text-xs font-sans font-medium text-emerald-650 ml-1.5">Excellent</span>
                        </div>
                      </div>
                    </div>

                    {/* Bio intro excerpt */}
                    <div>
                      <h4 className="font-serif font-bold text-sm text-warm-text dark:text-cream-bg mb-2">Short Abstract preview</h4>
                      <p className="text-xs sm:text-sm text-warm-muted dark:text-warm-light-muted italic pl-3 border-l text-warm-text border-olive/40 leading-relaxed font-sans">
                        "{userProfile.bio}"
                      </p>
                    </div>

                    {/* Direct checklist */}
                    <div className="pt-4 border-t border-cream-border dark:border-cream-dark-border">
                      <h4 className="font-serif font-bold text-sm text-warm-text dark:text-cream-bg mb-3">Directory checklists</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="flex items-center space-x-2 text-xs">
                          <CheckCircle className="w-4 h-4 text-emerald-650" />
                          <span className="text-warm-muted dark:text-warm-light-muted font-mono">Long-form Narrative Registered ({userProfile.story?.split(/\s+/).length || 0} words)</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <CheckCircle className="w-4 h-4 text-emerald-650" />
                          <span className="text-warm-muted dark:text-warm-light-muted font-mono">Structured Expertise Tags verified ({userProfile.expertiseTags?.length || 0} indices)</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <CheckCircle className="w-4 h-4 text-emerald-650" />
                          <span className="text-warm-muted dark:text-warm-light-muted font-mono">Daily Schedule Chronology complete</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <CheckCircle className="w-4 h-4 text-emerald-650" />
                          <span className="text-warm-muted dark:text-warm-light-muted font-mono">Open Preferences set</span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Inline Editor */}
            {activeTab === 'edit' && (
              <div className="animate-fade-in">
                <ProfileEditor onComplete={() => {
                  refreshProfiles();
                  setActiveTab('profile');
                }} />
              </div>
            )}            {/* TAB 3: Questions received list */}
            {activeTab === 'questions' && (
              <div className="bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border p-6 rounded-2xl shadow-cozy space-y-6">
                <div>
                  <h3 className="font-serif font-bold text-lg text-warm-text dark:text-cream-bg">
                    Advisory Inquiries List
                  </h3>
                  <p className="text-xs text-warm-muted dark:text-warm-light-muted mt-1 max-w-sm">
                    Review and write thoughtful text responses below. Unanswered questions remain hidden from the community.
                  </p>
                </div>

                {loadingQuestions ? (
                  <div className="text-center py-10 font-mono text-xs text-warm-muted animate-pulse">Loading inquiries...</div>
                ) : questions.length === 0 ? (
                  <div className="py-14 border border-dashed border-cream-border dark:border-cream-dark-border text-center text-warm-muted rounded-xl">
                    <MessageSquare className="w-8 h-8 text-warm-light-muted mx-auto mb-3" />
                    <h5 className="font-serif font-semibold text-warm-text dark:text-cream-bg">Index is empty</h5>
                    <p className="text-xs text-[11px] text-warm-muted mt-1 font-mono">When visitors ask questions, they will compile in this list.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((q) => (
                      <div key={q.id} className="p-5 border border-cream-border dark:border-cream-dark-border rounded-2xl bg-olive-muted/20 dark:bg-cream-dark-bg/40 space-y-4" id={`dash-q-${q.id}`}>
                        
                        {/* Question details */}
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${q.visibility === 'private' ? 'bg-amber-100/50 dark:bg-amber-955/20 text-amber-700' : 'bg-olive-accent/60 dark:bg-olive/10 text-olive dark:text-olive-light'}`}>
                              {q.visibility === 'private' ? 'Private Anonymous' : 'Public Display'}
                            </span>
                            <div className="text-xs font-semibold text-warm-text dark:text-cream-bg mt-2">
                              Asked by {q.askerName} · <span className="font-normal text-warm-light-muted font-mono text-[9px]">{new Date(q.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-warm-text dark:text-cream-bg mt-1.5 italic font-sans pr-4 leading-relaxed">
                              "{q.question}"
                            </p>
                          </div>

                          <button 
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-1.5 rounded-lg text-warm-muted hover:text-red-500 hover:bg-rose-50/50 dark:hover:bg-red-950/20 cursor-pointer"
                            title="Discard question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Existing Response or Response Form */}
                        {q.answer ? (
                          <div className="pt-3 border-t border-cream-border dark:border-cream-dark-border text-xs">
                            <span className="font-semibold text-olive dark:text-olive-light">Your answer:</span>
                            <p className="text-warm-muted dark:text-warm-light-muted mt-1 pr-4 leading-relaxed">
                              {q.answer}
                            </p>
                            <button 
                              onClick={() => {
                                setAnsweringId(q.id);
                                setResponseText(q.answer || '');
                              }}
                              className="text-[10px] font-mono text-olive hover:underline mt-2 inline-block cursor-pointer"
                            >
                              Revise Answer
                            </button>
                          </div>
                        ) : (
                          <div className="pt-1 select-none">
                            {answeringId === q.id ? (
                              <div className="space-y-2">
                                <textarea 
                                  rows={2}
                                  value={responseText}
                                  onChange={(e) => setResponseText(e.target.value)}
                                  placeholder="Type your authentic advice..."
                                  className="w-full text-xs p-3 rounded-xl border border-cream-border bg-white dark:bg-cream-dark-bg text-warm-text dark:text-cream-bg focus:outline-none focus:ring-1 focus:ring-olive"
                                ></textarea>
                                <div className="flex justify-end space-x-2">
                                  <button 
                                    onClick={() => setAnsweringId(null)}
                                    className="px-3 py-1.5 text-xs text-warm-muted hover:text-warm-text cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button 
                                    onClick={() => handleSubmitAnswer(q.id)}
                                    className="px-4 py-1.5 bg-olive hover:bg-olive-dark text-white rounded-xl text-xs font-semibold cursor-pointer"
                                  >
                                    Submit Answer
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button 
                                onClick={() => {
                                  setAnsweringId(q.id);
                                  setResponseText('');
                                }}
                                className="px-3 py-1.5 bg-olive-muted text-olive hover:bg-olive hover:text-white dark:bg-olive/15 dark:text-olive-light dark:hover:bg-olive dark:hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                              >
                                Answer Inquire
                              </button>
                            )}
                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* TAB 4: Saved Library profiles */}
            {activeTab === 'saved' && (
              <div className="bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border p-6 rounded-2xl shadow-cozy space-y-6">
                <div>
                  <h3 className="font-serif font-bold text-lg text-warm-text dark:text-cream-bg">
                    My Saved Library Map
                  </h3>
                  <p className="text-xs text-warm-muted dark:text-warm-light-muted mt-1">
                    Bookmarked profiles of real humans you save as bookmarks to track and learn from.
                  </p>
                </div>

                {savedPeopleProfiles.length === 0 ? (
                  <div className="py-14 border border-dashed border-cream-border dark:border-cream-dark-border text-center text-warm-muted rounded-xl">
                    <Bookmark className="w-8 h-8 text-warm-light-muted mx-auto mb-3" />
                    <h5 className="font-serif font-semibold text-warm-text dark:text-cream-bg">No saved profiles</h5>
                    <p className="text-xs text-[11px] text-warm-muted mt-1 font-mono">Search the catalog map and bookmark stories to view them here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedPeopleProfiles.map((p) => (
                      <div 
                        key={p.uid}
                        onClick={() => navigateTo('human', { uid: p.uid })}
                        className="p-5 bg-white dark:bg-cream-dark-bg border border-cream-border dark:border-cream-dark-border rounded-2xl cursor-pointer hover:border-olive/30 transition-all flex items-center justify-between group"
                        id={`saved-card-${p.uid}`}
                      >
                        <div className="flex items-center space-x-3.5">
                          <img 
                            src={p.photoURL} 
                            alt={p.name} 
                            className="w-10 h-10 rounded-full object-cover border border-cream-border/30" 
                          />
                          <div>
                            <h4 className="font-serif font-bold text-sm text-warm-text dark:text-cream-bg group-hover:text-olive transition-colors">
                              {p.name}
                            </h4>
                            <p className="text-[11px] text-warm-muted dark:text-warm-light-muted uppercase font-mono">
                              {p.profession}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-olive dark:text-olive-light uppercase font-mono tracking-wider font-bold">
                          Read log
                        </span>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* TAB 5: Analytics metrics */}
            {activeTab === 'analytics' && (
              <div className="bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border p-6 rounded-2xl shadow-cozy space-y-8">
                <div>
                  <h3 className="font-serif font-bold text-lg text-warm-text dark:text-cream-bg">
                    Analytics Dashboard
                  </h3>
                  <p className="text-xs text-warm-muted mt-1">
                    Activity metrics and viewing timelines tracked across your published biographical page.
                  </p>
                </div>

                {/* KPI block stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-olive-muted/40 dark:bg-cream-dark-bg rounded-xl border border-cream-border/30 dark:border-cream-dark-border/30">
                    <span className="text-[10px] text-warm-muted dark:text-warm-light-muted font-mono uppercase">Views</span>
                    <div className="font-serif text-xl sm:text-2xl font-bold text-warm-text dark:text-cream-bg mt-1">
                      {userProfile?.views || 38}
                    </div>
                  </div>

                  <div className="p-4 bg-[#FAF5ED]/50 dark:bg-slate-850 rounded-xl" style={{ display: 'none' }}></div>

                  <div className="p-4 bg-olive-muted/40 dark:bg-cream-dark-bg rounded-xl border border-cream-border/30 dark:border-cream-dark-border/30">
                    <span className="text-[10px] text-warm-muted dark:text-warm-light-muted font-mono uppercase">Searches</span>
                    <div className="font-serif text-xl sm:text-2xl font-bold text-warm-text dark:text-cream-bg mt-1">
                      {userProfile?.searchAppearances || 142}
                    </div>
                  </div>

                  <div className="p-4 bg-[#FAF5ED]/50 dark:bg-slate-850 rounded-xl" style={{ display: 'none' }}></div>

                  <div className="p-4 bg-olive-muted/40 dark:bg-cream-dark-bg rounded-xl border border-cream-border/30 dark:border-cream-dark-border/30">
                    <span className="text-[10px] text-warm-muted dark:text-warm-light-muted font-mono uppercase">Queries</span>
                    <div className="font-serif text-xl sm:text-2xl font-bold text-warm-text dark:text-cream-bg mt-1">
                      {questions.length}
                    </div>
                  </div>

                  <div className="p-4 bg-[#FAF5ED]/50 dark:bg-slate-850 rounded-xl" style={{ display: 'none' }}></div>

                  <div className="p-4 bg-olive-muted/40 dark:bg-cream-dark-bg rounded-xl border border-cream-border/30 dark:border-cream-dark-border/30">
                    <span className="text-[10px] text-warm-muted dark:text-warm-light-muted font-mono uppercase">Bookmarks</span>
                    <div className="font-serif text-xl sm:text-2xl font-bold text-warm-text dark:text-cream-bg mt-1">
                      {bookmarks.length || 2}
                    </div>
                  </div>
                </div>

                {/* GORGEOUS INLINE RESPONSIVE SVG CHARTS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Chart A: Views week-over-week */}
                  <div className="p-5 bg-white dark:bg-cream-dark-bg rounded-xl border border-cream-border dark:border-cream-dark-border">
                    <h4 className="font-serif text-xs font-bold text-warm-text dark:text-cream-bg uppercase tracking-wider mb-4">
                      Weekly Read Volume Views
                    </h4>
                    
                    <div className="relative w-full aspect-video flex items-end">
                      {/* Grid lines */}
                      <div className="absolute inset-x-0 top-0 border-t border-cream-border/40 dark:border-cream-dark-border/40"></div>
                      <div className="absolute inset-x-0 top-1/2 border-t border-cream-border/40 dark:border-cream-dark-border/40"></div>
                      <div className="absolute inset-x-0 bottom-7 border-t border-cream-border/40 dark:border-cream-dark-border/40"></div>

                      <svg className="w-full h-full pb-7" viewBox="0 0 100 50" preserveAspectRatio="none">
                        {/* Smooth Line Graph */}
                        <path 
                          d="M0,45 C20,38 40,42 60,30 C80,18 90,15 100,5" 
                          fill="none" 
                          stroke="#5F7161" 
                          strokeWidth="2" 
                        />
                        <path 
                          d="M0,45 C20,38 40,42 60,30 C80,18 90,15 100,5 L100,50 L0,50 Z" 
                          fill="url(#views-gradient)" 
                        />
                        <defs>
                          <linearGradient id="views-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#5F7161" stopOpacity="0.2"/>
                            <stop offset="100%" stopColor="#5F7161" stopOpacity="0.0"/>
                          </linearGradient>
                        </defs>
                      </svg>

                      {/* X labels */}
                      <div className="absolute bottom-1 px-1 inset-x-0 flex justify-between text-[8px] font-mono text-warm-muted">
                        <span>May 10</span>
                        <span>May 24</span>
                        <span>Jun 08 (Today)</span>
                      </div>
                    </div>
                  </div>

                  {/* Chart B: Search Appearances week-over-week */}
                  <div className="p-5 bg-white dark:bg-cream-dark-bg rounded-xl border border-cream-border dark:border-cream-dark-border">
                    <h4 className="font-serif text-xs font-bold text-warm-text dark:text-cream-bg uppercase tracking-wider mb-4">
                      Search Index Appearances
                    </h4>
                    
                    <div className="relative w-full aspect-video flex items-end">
                      {/* Grid lines */}
                      <div className="absolute inset-x-0 top-0 border-t border-cream-border/40 dark:border-cream-dark-border/40"></div>
                      <div className="absolute inset-x-0 top-1/2 border-t border-cream-border/40 dark:border-cream-dark-border/40"></div>
                      <div className="absolute inset-x-0 bottom-7 border-t border-cream-border/40 dark:border-cream-dark-border/40"></div>

                      {/* Responsive SVG Bars */}
                      <div className="w-full h-full pb-7 flex justify-around items-end px-4">
                        <div className="w-4 bg-olive-accent/40 dark:bg-cream-dark-border/40 rounded-t-sm" style={{ height: '35%' }}></div>
                        <div className="w-4 bg-olive-accent/40 dark:bg-cream-dark-border/40 rounded-t-sm" style={{ height: '55%' }}></div>
                        <div className="w-4 bg-olive-accent/40 dark:bg-cream-dark-border/40 rounded-t-sm" style={{ height: '45%' }}></div>
                        <div className="w-4 bg-olive-accent/40 dark:bg-cream-dark-border/40 rounded-t-sm" style={{ height: '65%' }}></div>
                        <div className="w-4 bg-olive/80 rounded-t-md" style={{ height: '90%' }}></div>
                      </div>

                      {/* X labels */}
                      <div className="absolute bottom-1 px-1 inset-x-0 flex justify-between text-[8px] font-mono text-warm-muted">
                        <span>W1</span>
                        <span>W2</span>
                        <span>W3</span>
                        <span>W4</span>
                        <span>Current</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>

        </div>
      </div>

    </div>
  );
};
