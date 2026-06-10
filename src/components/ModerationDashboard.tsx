import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getProfiles, getReports, updateReportStatus, moderateProfile, getAllUserRoles, getQuestions, deleteQuestion } from '../lib/storage';
import { isFirebaseAvailable } from '../lib/firebase';
import { HumanProfile, ContentReport, UserRole, Question } from '../types';
import { ShieldCheck, UserCheck, XCircle, AlertTriangle, Check, Edit3, Trash2, Mail, Users, ArrowLeft, RefreshCw, Eye, AlertCircle, Sparkles } from 'lucide-react';

export const ModerationDashboard: React.FC = () => {
  const { user, userRole, navigateTo, notifications, sendNotif, changeUserRole } = useApp();
  
  // Tab States
  const [activeTab, setActiveTab] = useState<'profiles' | 'reports' | 'roles' | 'questions'>('profiles');
  
  // Data States
  const [profiles, setProfiles] = useState<HumanProfile[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection and Action States
  const [selectedProfile, setSelectedProfile] = useState<HumanProfile | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load Mod Queue data
  const loadData = async () => {
    setLoading(true);
    try {
      const allProfiles = await getProfiles();
      const allReports = await getReports();
      const allRoles = await getAllUserRoles();
      
      // Fetch questions for active profiles to list in question queue
      const allQuestions: Question[] = [];
      for (const p of allProfiles) {
        const qList = await getQuestions(p.uid);
        allQuestions.push(...qList);
      }
      
      setProfiles(allProfiles);
      setReports(allReports);
      setRoles(allRoles);
      setQuestions(allQuestions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === 'user' && user) {
      // Re-route normal users out of moderation area
      navigateTo('dashboard');
    } else {
      loadData();
    }
  }, [userRole]);

  const handleApproveProfile = async (p: HumanProfile) => {
    try {
      await moderateProfile(p.uid, 'approved');
      // Notify user
      await sendNotif(
        p.uid,
        "Profile Approved",
        "Congratulations! Your human profile has been approved and is now live in the professional catalog database.",
        "approved"
      );
      
      setSuccessMessage(`Approved profile for ${p.name}`);
      loadData();
      
      // Unselect if opened
      if (selectedProfile?.uid === p.uid) {
        setSelectedProfile(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenRejectModal = (p: HumanProfile) => {
    setSelectedProfile(p);
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedProfile) return;
    try {
      await moderateProfile(selectedProfile.uid, 'rejected');
      await sendNotif(
        selectedProfile.uid,
        "Profile Revision Needed",
        `Your human profile requires revisions before publication. Feedback from curator: "${rejectReason}"`,
        "rejected"
      );
      
      setSuccessMessage(`Rejected and flagged profile for ${selectedProfile.name}`);
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedProfile(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveReport = async (rep: ContentReport) => {
    try {
      await updateReportStatus(rep.id, 'resolved');
      setSuccessMessage(`Resolved report ${rep.id}`);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDismissReport = async (rep: ContentReport) => {
    try {
      await updateReportStatus(rep.id, 'dismissed');
      setSuccessMessage(`Dismissed report ${rep.id}`);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRoleChange = async (targetUid: string, targetEmail: string, newRole: 'admin' | 'moderator' | 'user') => {
    try {
      await changeUserRole(targetUid, targetEmail, newRole);
      // Notify user of role assignment
      await sendNotif(
        targetUid,
        "Staff Role Updated",
        `Your Human Library access privilege has been updated to "${newRole.toUpperCase()}".`,
        "role_assigned"
      );
      setSuccessMessage(`Successfully updated ${targetEmail} status to ${newRole}`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubmittedQuestion = async (qId: string) => {
    try {
      await deleteQuestion(qId);
      setSuccessMessage("Inappropriate advisory question deleted successfully.");
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Quick auto-clear success banner alert
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  if (userRole === 'user' || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-cream-bg dark:bg-cream-dark-bg transition-colors duration-200">
        <div className="text-center max-w-sm bg-white dark:bg-cream-dark-card p-8 rounded-2xl border border-cream-border dark:border-cream-dark-border shadow-paper">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="font-serif font-bold text-xl text-warm-text dark:text-cream-bg">Access Unauthorized</h2>
          <p className="text-sm text-warm-muted dark:text-warm-light-muted mt-2">
            You must be assigned moderator or admin status to access this area.
          </p>
          <button 
            onClick={() => navigateTo('home')}
            className="mt-6 px-5 py-2.5 bg-olive hover:bg-olive-dark text-white rounded-xl text-sm font-medium transition-all"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  // Filter lists based on status
  const pendingProfiles = profiles.filter(p => p.moderationStatus === 'pending');
  const otherProfiles = profiles.filter(p => !p.isDraft && (p.moderationStatus === 'approved' || p.moderationStatus === 'rejected' || !p.moderationStatus));

  return (
    <div className="min-h-screen bg-cream-bg dark:bg-cream-dark-bg text-warm-text dark:text-cream-bg transition-colors duration-200 py-10 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Masthead Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-cream-border dark:border-cream-dark-border pb-6 mb-8 gap-4">
          <div>
            <button 
              onClick={() => navigateTo('dashboard')}
              className="flex items-center space-x-1 text-xs text-olive dark:text-olive-light mb-3 hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Workspace</span>
            </button>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-8 h-8 text-olive" />
              <h1 className="font-serif font-bold text-2xl sm:text-3xl tracking-tight text-warm-text dark:text-cream-bg">
                Moderation System
              </h1>
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded border border-olive text-olive bg-olive-muted dark:bg-cream-dark-card font-semibold">
                {userRole.toUpperCase()} PORTAL
              </span>
            </div>
            <p className="text-sm text-warm-muted dark:text-warm-light-muted mt-2 max-w-2xl">
              Curation tools for maintaining biographical integrity, reviewing community inquiries, assessing abuse reports, and auditing staff privileges.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={loadData}
              className="flex items-center space-x-1.5 px-4 py-2 border border-cream-border dark:border-cream-dark-border rounded-xl text-xs font-medium hover:bg-olive-light dark:hover:bg-cream-dark-border transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-xl text-sm flex items-center space-x-2 animate-fade-in shadow-inner">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Curation Area Tabs */}
        <div className="flex space-x-1 p-1 bg-cream-border/40 dark:bg-cream-dark-border/40 rounded-xl max-w-lg mb-8 border border-cream-border/50 dark:border-cream-dark-border/50">
          <button 
            onClick={() => setActiveTab('profiles')}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'profiles' 
                ? 'bg-white dark:bg-cream-dark-border text-warm-text dark:text-cream-bg shadow-sm' 
                : 'text-warm-muted dark:text-warm-light-muted hover:text-warm-text'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Profiles Queue ({pendingProfiles.length})</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('reports')}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'reports' 
                ? 'bg-white dark:bg-cream-dark-border text-warm-text dark:text-cream-bg shadow-sm' 
                : 'text-warm-muted dark:text-warm-light-muted hover:text-warm-text'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Reports ({reports.filter(r => r.status === 'pending').length})</span>
          </button>

          <button 
            onClick={() => setActiveTab('questions')}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'questions' 
                ? 'bg-white dark:bg-cream-dark-border text-warm-text dark:text-cream-bg shadow-sm' 
                : 'text-warm-muted dark:text-warm-light-muted hover:text-warm-text'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Community Q&A</span>
          </button>

          {userRole === 'admin' && (
            <button 
              onClick={() => setActiveTab('roles')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'roles' 
                  ? 'bg-white dark:bg-cream-dark-border text-warm-text dark:text-cream-bg shadow-sm' 
                  : 'text-warm-muted dark:text-warm-light-muted hover:text-warm-text'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Roles Panel</span>
            </button>
          )}
        </div>

        {/* LOADING INDICATOR */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-cream-dark-card rounded-2xl border border-cream-border dark:border-cream-dark-border shadow-paper">
            <RefreshCw className="w-8 h-8 text-olive animate-spin" />
            <p className="font-mono text-xs text-warm-muted mt-3">Synthesizing database buffers...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT / MAIN MODULE (COL-SPAN 2) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* ------------ TAB 1: PROFILES PIPELINE ------------ */}
              {activeTab === 'profiles' && (
                <div className="space-y-6">
                  {/* Pending Queue section */}
                  <div>
                    <h3 className="font-serif font-bold text-lg text-warm-text dark:text-cream-bg mb-4 flex items-center justify-between">
                      <span>Pending Publications</span>
                      <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 font-mono text-[10px] px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900">
                        {pendingProfiles.length} reviews required
                      </span>
                    </h3>
                    
                    {pendingProfiles.length === 0 ? (
                      <div className="p-8 text-center bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border rounded-2xl shadow-paper">
                        <Sparkles className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                        <h4 className="font-medium text-sm text-warm-text dark:text-cream-bg">Inbox Clean!</h4>
                        <p className="text-xs text-warm-muted dark:text-warm-light-muted mt-1 max-w-sm mx-auto">
                          There are currently no new biographical human documents waiting in the moderation review queue. Excellent work!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingProfiles.map(p => (
                          <div 
                            key={p.uid} 
                            onClick={() => setSelectedProfile(p)}
                            className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all ${
                              selectedProfile?.uid === p.uid 
                                ? 'bg-olive-muted/30 dark:bg-cream-dark-border border-olive shadow-sm' 
                                : 'bg-white dark:bg-cream-dark-card border-cream-border dark:border-cream-dark-border hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3.5">
                                <img src={p.photoURL} alt={p.name} className="w-11 h-11 rounded-full object-cover border" />
                                <div>
                                  <h4 className="font-serif font-bold text-sm sm:text-base text-warm-text dark:text-cream-bg">
                                    {p.name}
                                  </h4>
                                  <p className="text-xs font-mono text-warm-muted dark:text-warm-light-muted">
                                    {p.profession} &bull; {p.location}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono border border-amber-300 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded uppercase">
                                Pending
                              </span>
                            </div>
                            
                            <p className="text-xs text-warm-muted dark:text-warm-light-muted mt-3 line-clamp-2">
                              {p.bio || "No summary biography provided."}
                            </p>

                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-cream-border/50 dark:border-cream-dark-border">
                              <span className="text-[10px] font-mono text-warm-light-muted">
                                Created: {new Date(p.createdAt).toLocaleDateString()}
                              </span>
                              
                              <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={() => handleApproveProfile(p)}
                                  className="flex items-center space-x-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium cursor-pointer transition-all"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleOpenRejectModal(p)}
                                  className="flex items-center space-x-1 px-3 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-xs font-medium cursor-pointer transition-all"
                                >
                                  <XCircle className="w-3 h-3" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Rest of Catalog Profiles */}
                  <div className="pt-6 border-t border-cream-border dark:border-cream-dark-border">
                    <h3 className="font-serif font-bold text-lg text-warm-text dark:text-cream-bg mb-4">
                      Catalog Directory Status Archive
                    </h3>
                    <div className="space-y-3">
                      {otherProfiles.map(p => (
                        <div 
                          key={p.uid}
                          onClick={() => setSelectedProfile(p)}
                          className="flex items-center justify-between p-3.5 bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border rounded-xl cursor-pointer hover:shadow-sm"
                        >
                          <div className="flex items-center space-x-3">
                            <img src={p.photoURL} alt={p.name} className="w-8 h-8 rounded-full object-cover border" />
                            <div>
                              <h4 className="font-serif font-semibold text-xs sm:text-sm text-warm-text dark:text-cream-bg">{p.name}</h4>
                              <p className="text-[10px] font-mono text-warm-muted">{p.profession || 'No profession specified'}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3" onClick={e => e.stopPropagation()}>
                            <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase ${
                              p.moderationStatus === 'rejected' 
                                ? 'border border-rose-300 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400' 
                                : 'border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                            }`}>
                              {p.moderationStatus || 'approved'}
                            </span>
                            
                            {p.moderationStatus === 'rejected' && (
                              <button
                                onClick={() => handleApproveProfile(p)}
                                className="text-xs text-emerald-600 hover:underline font-medium cursor-pointer"
                              >
                                Approve
                              </button>
                            )}
                            {p.moderationStatus !== 'rejected' && (
                              <button
                                onClick={() => handleOpenRejectModal(p)}
                                className="text-xs text-rose-600 hover:underline font-medium cursor-pointer"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ------------ TAB 2: REPORTS LIST ------------ */}
              {activeTab === 'reports' && (
                <div className="space-y-6">
                  <h3 className="font-serif font-bold text-lg text-warm-text dark:text-cream-bg mb-4 flex items-center justify-between">
                    <span>Incidents Queue</span>
                    <span className="text-xs bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400 font-mono text-[10px] px-2.5 py-1 rounded-full border border-red-200 dark:border-red-900">
                      {reports.filter(r => r.status === 'pending').length} unhandled reports
                    </span>
                  </h3>

                  {reports.length === 0 ? (
                    <div className="p-8 text-center bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border rounded-2xl shadow-paper">
                      <Sparkles className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                      <h4 className="font-medium text-sm text-warm-text dark:text-cream-bg">Inbox Unblemished!</h4>
                      <p className="text-xs text-warm-muted dark:text-warm-light-muted mt-1 max-w-sm mx-auto">
                        No user abuse reports or inappropriate flags have been registered. The community space is perfectly secure.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reports.map(rep => (
                        <div 
                          key={rep.id}
                          className="bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border rounded-2xl p-4 sm:p-5 shadow-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              <AlertCircle className={`w-4 h-4 ${rep.status === 'pending' ? 'text-rose-500' : 'text-warm-light-muted'}`} />
                              <span className="text-[10px] font-mono uppercase tracking-wider text-warm-muted">
                                REPORT ID &bull; {rep.id} &bull; target {rep.itemType}
                              </span>
                            </div>
                            
                            <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase ${
                              rep.status === 'pending' 
                                ? 'border border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/20' 
                                : rep.status === 'resolved'
                                  ? 'border border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20'
                                  : 'border border-cream-border text-warm-light-muted bg-cream-border/20'
                            }`}>
                              {rep.status}
                            </span>
                          </div>

                          <h4 className="font-serif font-bold text-base text-rose-700 dark:text-rose-400 mt-2">
                            Flagged "{rep.itemTitle}"
                          </h4>

                          <div className="mt-2.5 p-3.5 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-xl">
                            <p className="text-xs text-warm-text dark:text-warm-light-muted leading-relaxed">
                              <span className="font-semibold text-rose-800 dark:text-rose-300">Reason Filed:</span> "{rep.reason}"
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-cream-border/50 dark:border-cream-dark-border">
                            <span className="text-[10px] font-mono text-warm-light-muted">
                              Submitted: {new Date(rep.createdAt).toLocaleDateString()}
                            </span>

                            {rep.status === 'pending' && (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleResolveReport(rep)}
                                  className="flex items-center space-x-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Resolve (De-list / Mark Flagged)</span>
                                </button>
                                <button
                                  onClick={() => handleDismissReport(rep)}
                                  className="flex items-center space-x-1 px-3 py-1 border border-cream-border hover:bg-olive-light dark:hover:bg-cream-dark-border rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                                >
                                  <span>Dismiss Report</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ------------ TAB 3: COMMUNITY QUESTIONS ------------ */}
              {activeTab === 'questions' && (
                <div className="space-y-6">
                  <h3 className="font-serif font-bold text-lg text-warm-text dark:text-cream-bg mb-4">
                    Inbound Advisory Questions Queue
                  </h3>
                  
                  {questions.length === 0 ? (
                    <div className="p-8 text-center bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border rounded-2xl shadow-paper">
                      <Sparkles className="w-10 h-10 text-olive mx-auto mb-3" />
                      <h4 className="font-medium text-sm text-warm-text dark:text-cream-bg">Queue Empty</h4>
                      <p className="text-xs text-warm-muted dark:text-warm-light-muted mt-1 max-w-sm mx-auto">
                        There are currently no community questions filed under any of our live profiles.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {questions.map(q => (
                        <div 
                          key={q.id}
                          className="bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border rounded-xl p-4 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-mono text-warm-muted">
                                Question ID: {q.id} &bull; To profile {q.profileOwnerId}
                              </span>
                              <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase border ${
                                q.visibility === 'public' 
                                  ? 'border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20' 
                                  : 'border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-950/20'
                              }`}>
                                {q.visibility}
                              </span>
                            </div>
                            <h4 className="font-serif font-semibold text-sm text-warm-text dark:text-cream-bg">
                              Query from: <span className="text-olive">{q.askerName}</span>
                            </h4>
                            <p className="text-xs text-warm-muted dark:text-warm-light-muted mt-1.5 italic bg-cream-bg dark:bg-cream-dark-bg p-3 rounded-lg border">
                              "{q.question}"
                            </p>
                            {q.answer && (
                              <p className="text-xs text-olive dark:text-olive-light mt-2 bg-olive-muted/10 p-2 rounded border border-olive-muted/20">
                                <strong>Answer:</strong> "{q.answer}"
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-cream-border/50 dark:border-cream-dark-border">
                            <span className="text-[10px] font-mono text-warm-light-muted">
                              Submitted {new Date(q.createdAt).toLocaleDateString()}
                            </span>
                            
                            <button
                              onClick={() => handleDeleteSubmittedQuestion(q.id)}
                              className="flex items-center space-x-1 px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>De-List Question</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ------------ TAB 4: ROLES PANEL ------------ */}
              {activeTab === 'roles' && userRole === 'admin' && (
                <div className="space-y-6">
                  <h3 className="font-serif font-bold text-lg text-warm-text dark:text-cream-bg mb-4">
                    Staff & User Access Directory
                  </h3>
                  
                  <div className="bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border rounded-xl overflow-hidden shadow-paper">
                    <div className="p-4 bg-olive-muted/20 border-b border-cream-border dark:border-cream-dark-border font-mono text-[10px] text-warm-muted font-bold tracking-wider grid grid-cols-3 gap-2">
                      <div>EMAIL ACCREDITATION</div>
                      <div>ASSIGNED PRIVILEGE</div>
                      <div className="text-right">OPERATION ACTION</div>
                    </div>
                    
                    <div className="divide-y divide-cream-border dark:divide-cream-dark-border">
                      {/* Let's list roles */}
                      {roles.length === 0 ? (
                        <div className="p-6 text-center text-warm-muted font-mono text-xs">
                          No customized roles registry created in cloud database. System-defined user cards default to "user".
                        </div>
                      ) : (
                        roles.map(r => (
                          <div key={r.userId} className="p-4 grid grid-cols-3 gap-2 items-center text-xs sm:text-sm">
                            <div className="font-medium text-warm-text dark:text-cream-bg truncate font-mono">
                              {r.email}
                            </div>
                            <div>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold border ${
                                r.role === 'admin' 
                                  ? 'bg-rose-50 border-rose-200 text-rose-700' 
                                  : r.role === 'moderator'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-cool-gray-100 border-gray-200 text-gray-700'
                              }`}>
                                {r.role}
                              </span>
                            </div>
                            <div className="text-right flex items-center justify-end space-x-1">
                              {r.email !== user?.email && (
                                <>
                                  <button
                                    onClick={() => handleRoleChange(r.userId, r.email, 'admin')}
                                    className={`px-2 py-1 text-[10px] font-semibold rounded ${r.role === 'admin' ? 'bg-cream-border dark:bg-cream-dark-border text-warm-muted' : 'border border-rose-300 text-rose-700 hover:bg-rose-50'}`}
                                    disabled={r.role === 'admin'}
                                  >
                                    Promote Admin
                                  </button>
                                  <button
                                    onClick={() => handleRoleChange(r.userId, r.email, 'moderator')}
                                    className={`px-2 py-1 text-[10px] font-semibold rounded ${r.role === 'moderator' ? 'bg-cream-border dark:bg-cream-dark-border text-warm-muted' : 'border border-emerald-300 text-emerald-700 hover:bg-emerald-50'}`}
                                    disabled={r.role === 'moderator'}
                                  >
                                    Promote Mod
                                  </button>
                                  <button
                                    onClick={() => handleRoleChange(r.userId, r.email, 'user')}
                                    className="px-2 py-1 border border-cream-border text-warm-muted hover:bg-cream-border/30 rounded text-[10px] font-semibold"
                                  >
                                    Revoke
                                  </button>
                                </>
                              )}
                              {r.email === user?.email && (
                                <span className="text-[10px] text-warm-light-muted italic uppercase font-mono">Self (Locked)</span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Add New Staff Interface */}
                  <div className="bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border rounded-xl p-5 shadow-sm mt-6">
                    <h4 className="font-serif font-bold text-sm text-warm-text dark:text-cream-bg mb-2">
                      Assign Staff Access Manually
                    </h4>
                    <p className="text-xs text-warm-muted dark:text-warm-light-muted mb-4 font-sans">
                      Need to add a staff volunteer? In local/sandbox mode or Cloud Fire, you can set permission tokens immediately here.
                    </p>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const emailInput = form.elements.namedItem('staffEmail') as HTMLInputElement;
                      const uidInput = form.elements.namedItem('staffUid') as HTMLInputElement;
                      const roleInput = form.elements.namedItem('staffRole') as HTMLSelectElement;
                      if (emailInput.value && uidInput.value && roleInput.value) {
                        await handleRoleChange(uidInput.value, emailInput.value, roleInput.value as any);
                        emailInput.value = '';
                        uidInput.value = '';
                      }
                    }} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-mono text-warm-muted mb-1">User Email</label>
                          <input type="email" name="staffEmail" required placeholder="e.g. volunteer@domain.com" className="w-full px-3 py-2 border rounded-xl text-xs bg-transparent" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-mono text-warm-muted mb-1">User UID</label>
                          <input type="text" name="staffUid" required placeholder="e.g. user_123 or demo-XYZ" className="w-full px-3 py-2 border rounded-xl text-xs bg-transparent" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-mono text-warm-muted mb-1">Target Privilege</label>
                          <select name="staffRole" className="w-full px-3 py-2 border rounded-xl text-xs bg-transparent dark:bg-cream-dark-card">
                            <option value="moderator">Moderator (Curate Profiles & Questions)</option>
                            <option value="admin">Administrator (Full Access)</option>
                          </select>
                        </div>
                      </div>
                      <button type="submit" className="px-4 py-2 bg-olive hover:bg-olive-dark text-white rounded-xl text-xs font-semibold cursor-pointer">
                        Bootstrap Staff Member Card
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>

            {/* ------------ RIGHT PANEL: DETAILED AUDIT / PREVIEW (COL-SPAN 1) ------------ */}
            <div className="space-y-6">
              
              {/* Profile Preview Block */}
              <div className="bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border rounded-2xl p-5 shadow-paper sticky top-24">
                <h3 className="font-serif font-bold text-base text-warm-text dark:text-cream-bg mb-4 pb-3 border-b">
                  Review & Audit Preview
                </h3>
                
                {selectedProfile ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <img src={selectedProfile.photoURL} alt={selectedProfile.name} className="w-14 h-14 rounded-full object-cover border-2 border-olive/30" />
                      <div>
                        <h4 className="font-serif font-bold text-sm sm:text-base text-warm-text dark:text-cream-bg">{selectedProfile.name}</h4>
                        <p className="text-xs text-olive font-mono">{selectedProfile.profession}</p>
                        <p className="text-[10px] text-warm-muted font-sans mt-0.5">{selectedProfile.location} &bull; {selectedProfile.yearsOfExperience} yrs exp</p>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-2">
                      <div>
                        <span className="text-[10px] font-mono text-warm-muted uppercase">Short Story Synopsis</span>
                        <p className="text-xs text-warm-text bg-cream-bg/60 dark:bg-cream-dark-bg/40 p-3 rounded-lg border">{selectedProfile.bio}</p>
                      </div>
                      
                      {selectedProfile.story && (
                        <div>
                          <span className="text-[10px] font-mono text-warm-muted uppercase">Core Biography Narration</span>
                          <div className="max-h-40 overflow-y-auto text-xs text-warm-muted bg-cream-bg/40 dark:bg-[#151c2a] p-3 rounded-lg border leading-relaxed font-sans scrollbar-thin">
                            {selectedProfile.story}
                          </div>
                        </div>
                      )}

                      {selectedProfile.lessonsLearned && (
                        <div>
                          <span className="text-[10px] font-mono text-warm-muted uppercase">Retrospective Wisdom</span>
                          <p className="text-xs text-warm-muted italic">"{selectedProfile.lessonsLearned}"</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {selectedProfile.expertiseTags?.map(tag => (
                        <span key={tag} className="text-[9px] font-mono bg-olive-muted text-olive dark:bg-cream-dark-bg px-2 py-0.5 rounded border">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Operational Action Row */}
                    <div className="grid grid-cols-2 gap-2 pt-4 border-t">
                      <button
                        onClick={() => handleApproveProfile(selectedProfile)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center space-x-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve Publication</span>
                      </button>
                      
                      <button
                        onClick={() => handleOpenRejectModal(selectedProfile)}
                        className="w-full py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center space-x-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Flag Revisions</span>
                      </button>
                    </div>

                    <div className="pt-2 text-center">
                      <button
                        onClick={() => navigateTo('human', { uid: selectedProfile.uid })}
                        className="text-xs text-olive hover:underline font-medium inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Full Reader Mockup</span>
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="text-center py-12 text-warm-light-muted font-sans">
                    <Eye className="w-10 h-10 mx-auto mb-3 text-cream-border dark:text-cream-dark-border" />
                    <p className="text-xs">Click any profile from the list to preview details and execute moderation approvals.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Reject/Revisions Form Modal */}
      {showRejectModal && selectedProfile && (
        <div className="fixed inset-0 z-50 bg-olive-dark/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-cream-dark-card rounded-2xl w-full max-w-md p-6 shadow-paper border border-cream-border dark:border-cream-dark-border">
            <h3 className="font-serif font-bold text-lg text-warm-text dark:text-cream-bg mb-2">
              Biographical Page Rejection
            </h3>
            <p className="text-xs text-warm-muted dark:text-warm-light-muted mb-4 font-sans">
              Provide feedback for <span className="font-semibold">{selectedProfile.name}</span>. This message will be delivered via alert logs regarding revision needs.
            </p>
            
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Please outline your retrospect in 'Lessons Learned' sections more clearly, and upload a professional portrait matching our curated guidelines."
              required
              className="w-full px-4 py-2.5 rounded-xl border border-cream-border dark:border-cream-dark-border bg-transparent text-warm-text dark:text-cream-bg text-xs focus:outline-none focus:ring-2 focus:ring-olive mb-4"
            />

            <div className="flex space-x-2.5">
              <button
                onClick={handleConfirmReject}
                disabled={!rejectReason}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-medium py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Reject & Send Revision Notice
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="flex-1 border text-warm-muted font-medium py-2.5 rounded-xl text-xs hover:bg-olive-light dark:hover:bg-cream-dark-bg cursor-pointer transition-colors"
              >
                Cancel Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
