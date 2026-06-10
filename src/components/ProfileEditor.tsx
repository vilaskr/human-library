import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { HumanProfile, Project } from '../types';
import { 
  Check, ArrowRight, ArrowLeft, Save, Plus, Trash, Globe, 
  Github, Linkedin, Youtube, AlertCircle, FileEdit 
} from 'lucide-react';

export const ProfileEditor: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const { userProfile, saveUserProfile, navigateTo, user } = useApp();
  
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<HumanProfile | null>(null);

  // New item inputs
  const [newExpertiseTag, setNewExpertiseTag] = useState('');
  const [newExperienceTag, setNewExperienceTag] = useState('');
  const [newProject, setNewProject] = useState<Project>({ title: '', url: '', description: '' });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Drag & drop photo upload states
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setUploadError(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processImageFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processImageFile(file);
    }
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG/JPG/WEBP).');
      return;
    }

    // 1.5MB restriction is highly optimal for fast local/remote Base64 storage
    if (file.size > 1.5 * 1024 * 1024) {
      setUploadError('Image size is too large. Choose an image under 1.5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        handleUpdateField('photoURL', event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Load profile state into a standalone editable draft on mount or userProfile updates
  useEffect(() => {
    if (userProfile && !draft) {
      // Look for a local intermediate draft first
      const savedDraft = localStorage.getItem(`human_library_draft_${userProfile.uid}`);
      if (savedDraft) {
        try {
          setDraft(JSON.parse(savedDraft));
          return;
        } catch (e) {
          // fallback to userProfile
        }
      }
      setDraft(JSON.parse(JSON.stringify(userProfile))); // deep close
    }
  }, [userProfile]);

  // Auto-save drafts into localStorage on change
  useEffect(() => {
    if (draft && userProfile) {
      localStorage.setItem(`human_library_draft_${userProfile.uid}`, JSON.stringify(draft));
    }
  }, [draft, userProfile]);

  if (!draft) return null;

  // Direct handlers
  const handleUpdateField = (field: keyof HumanProfile, value: any) => {
    setDraft(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleUpdateSocial = (platform: string, value: string) => {
    setDraft(prev => {
      if (!prev) return null;
      return {
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [platform]: value
        }
      };
    });
  };

  const handleUpdateAvailability = (key: string, value: boolean) => {
    setDraft(prev => {
      if (!prev) return null;
      return {
        ...prev,
        availability: {
          ...prev.availability,
          [key]: value
        }
      };
    });
  };

  // Expertise Tags list modifications
  const addExpertiseTag = () => {
    const clean = newExpertiseTag.trim();
    if (clean && !draft.expertiseTags.includes(clean)) {
      handleUpdateField('expertiseTags', [...draft.expertiseTags, clean]);
      setNewExpertiseTag('');
    }
  };

  const removeExpertiseTag = (tag: string) => {
    handleUpdateField('expertiseTags', draft.expertiseTags.filter(t => t !== tag));
  };

  // Experience Tags lists
  const addExperienceTag = () => {
    const clean = newExperienceTag.trim();
    if (clean && !draft.experienceTags.includes(clean)) {
      handleUpdateField('experienceTags', [...draft.experienceTags, clean]);
      setNewExperienceTag('');
    }
  };

  const removeExperienceTag = (tag: string) => {
    handleUpdateField('experienceTags', draft.experienceTags.filter(t => t !== tag));
  };

  // Projects list
  const addProject = () => {
    if (newProject.title.trim() && newProject.url.trim()) {
      handleUpdateField('projects', [...(draft.projects || []), { ...newProject }]);
      setNewProject({ title: '', url: '', description: '' });
    }
  };

  const removeProject = (index: number) => {
    handleUpdateField('projects', (draft.projects || []).filter((_, i) => i !== index));
  };

  // Trigger publication / save profile to Database
  const handleFinalPublish = async () => {
    setSaveStatus('saving');
    try {
      await saveUserProfile(draft);
      setSaveStatus('saved');
      
      // Clear persistent draft on successful publish
      localStorage.removeItem(`human_library_draft_${draft.uid}`);
      
      setTimeout(() => {
        setSaveStatus('idle');
        if (onComplete) {
          onComplete();
        } else {
          navigateTo('human', { uid: draft.uid });
        }
      }, 1500);
    } catch (e) {
      console.error(e);
      setSaveStatus('idle');
    }
  };

  const calculateStepProgress = () => {
    return Math.floor((step / 7) * 100);
  };

  const calculateProfileIntegrityScore = () => {
    let score = 20; // base score signup
    if (draft.profession) score += 10;
    if (draft.location) score += 10;
    if (draft.bio) score += 15;
    if (draft.story && draft.story.length > 200) score += 15;
    if (draft.dailyLife) score += 10;
    if (draft.lessonsLearned) score += 10;
    if (draft.expertiseTags && draft.expertiseTags.length > 0) score += 5;
    if (draft.socialLinks && Object.values(draft.socialLinks).some(Boolean)) score += 5;
    return score;
  };

  const integrityScore = calculateProfileIntegrityScore();

  return (
    <div className="bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border rounded-2xl shadow-cozy overflow-hidden">
      
      {/* 1. PROGRESS BAR MASTER HEADER */}
      <div className="bg-cream-bg dark:bg-cream-dark-card px-6 py-4 border-b border-cream-border dark:border-cream-dark-border flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
        <div>
          <span className="text-[10px] uppercase font-mono font-bold text-warm-muted">
            Biographical Revision
          </span>
          <h3 className="font-serif font-bold text-base text-warm-text dark:text-cream-bg flex items-center space-x-1.5 mt-0.5">
            <FileEdit className="w-4.5 h-4.5 text-olive dark:text-olive-light" />
            <span>Step {step} of 7: {
              step === 1 ? 'Core Registries' :
              step === 2 ? 'The Bio Abstract' :
              step === 3 ? 'Narrative Storytelling' :
              step === 4 ? 'Skills & Fields' :
              step === 5 ? 'Life Milestones' :
              step === 6 ? 'Projects Index' : 'Availability Settings'
            }</span>
          </h3>
        </div>

        {/* Draft Auto-save notice */}
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-mono text-warm-muted">
            Draft Auto-Saved
          </span>
        </div>
      </div>

      <div className="w-full h-1 bg-cream-border dark:bg-cream-dark-border">
        <div 
          className="h-full bg-olive transition-all duration-300"
          style={{ width: `${calculateStepProgress()}%` }}
        ></div>
      </div>

      {/* 2. BODY CONTENT PANEL */}
      <div className="p-6 sm:p-8 min-h-[380px]">
        {/* STEP 1: Basic registries */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-warm-muted dark:text-warm-light-muted mb-1.5">
                  Full Name
                </label>
                <input 
                  type="text" 
                  value={draft.name} 
                  onChange={(e) => handleUpdateField('name', e.target.value)}
                  placeholder="e.g. Aveline Carter" 
                  className="w-full text-xs px-4 py-3 rounded-xl border border-cream-border dark:border-cream-dark-border bg-[#FDFBF7]/40 dark:bg-cream-dark-bg/40 text-warm-text dark:text-cream-bg placeholder:text-warm-light-muted focus:outline-none focus:ring-1 focus:ring-olive"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-warm-muted dark:text-warm-light-muted mb-1.5">
                  Profession
                </label>
                <input 
                  type="text" 
                  value={draft.profession} 
                  onChange={(e) => handleUpdateField('profession', e.target.value)}
                  placeholder="e.g. High School Biology Teacher" 
                  className="w-full text-xs px-4 py-3 rounded-xl border border-cream-border dark:border-cream-dark-border bg-[#FDFBF7]/40 dark:bg-cream-dark-bg/40 text-warm-text dark:text-cream-bg placeholder:text-warm-light-muted focus:outline-none focus:ring-1 focus:ring-olive"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-mono uppercase text-warm-muted dark:text-warm-light-muted mb-1.5">
                  General Industry Sector
                </label>
                <input 
                  type="text" 
                  value={draft.industry} 
                  onChange={(e) => handleUpdateField('industry', e.target.value)}
                  placeholder="e.g. Education, Agriculture" 
                  className="w-full text-xs px-4 py-3 rounded-xl border border-cream-border dark:border-cream-dark-border bg-[#FDFBF7]/40 dark:bg-cream-dark-bg/40 text-warm-text dark:text-cream-bg placeholder:text-warm-light-muted focus:outline-none focus:ring-1 focus:ring-olive"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-mono uppercase text-warm-muted dark:text-warm-light-muted mb-1.5">
                  Location
                </label>
                <input 
                  type="text" 
                  value={draft.location} 
                  onChange={(e) => handleUpdateField('location', e.target.value)}
                  placeholder="e.g. Tolima, Colombia" 
                  className="w-full text-xs px-4 py-3 rounded-xl border border-cream-border dark:border-cream-dark-border bg-[#FDFBF7]/40 dark:bg-cream-dark-bg/40 text-warm-text dark:text-cream-bg placeholder:text-warm-light-muted focus:outline-none focus:ring-1 focus:ring-olive"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-xs font-mono uppercase text-warm-muted dark:text-warm-light-muted mb-1.5">
                  Years of Trade Experience
                </label>
                <input 
                  type="number" 
                  value={draft.yearsOfExperience || 0} 
                  onChange={(e) => handleUpdateField('yearsOfExperience', Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="e.g. 5" 
                  className="w-full text-xs px-4 py-3 rounded-xl border border-cream-border dark:border-cream-dark-border bg-[#FDFBF7]/40 dark:bg-cream-dark-bg/40 text-warm-text dark:text-cream-bg placeholder:text-warm-light-muted focus:outline-none focus:ring-1 focus:ring-olive"
                />
              </div>
            </div>

            {/* DRAG AND DROP PHOTO UPLOAD */}
            <div className="space-y-3">
              <label className="block text-xs font-mono uppercase text-warm-muted dark:text-warm-light-muted">
                Profile Photo (Drag-and-Drop or File Pick)
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                
                {/* PREVIEW CONTAINER */}
                <div className="flex flex-col items-center justify-center space-y-2 p-4 bg-cream-bg/40 dark:bg-cream-dark-bg/25 border border-cream-border dark:border-cream-dark-border rounded-2xl relative">
                  <span className="text-[9px] uppercase font-mono text-warm-muted dark:text-warm-light-muted">Preview Photo</span>
                  {draft.photoURL ? (
                    <img 
                      src={draft.photoURL} 
                      alt="Avatar Preview" 
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-olive/20 shadow-md"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-dashed border-cream-border dark:border-cream-dark-border flex items-center justify-center text-warm-muted uppercase text-xs font-mono">
                      No Photo
                    </div>
                  )}
                  {draft.photoURL && (
                    <button
                      type="button"
                      onClick={() => handleUpdateField('photoURL', '')}
                      className="text-[10px] text-rose-500 hover:underline hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      Clear Image
                    </button>
                  )}
                </div>

                {/* DROP ZONE */}
                <div className="md:col-span-2">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('photo-upload-input')?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      isDragging 
                        ? 'border-olive bg-olive/5 dark:bg-olive/10' 
                        : 'border-cream-border dark:border-cream-dark-border hover:border-olive/30 bg-[#FDFBF7]/10 hover:bg-[#FDFBF7]/35 dark:bg-cream-dark-bg/10 dark:hover:bg-cream-dark-bg/20'
                    }`}
                  >
                    <input 
                      type="file" 
                      id="photo-upload-input" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                    <div className="space-y-2 animate-fade-in">
                      <div className="mx-auto w-10 h-10 rounded-full bg-olive-muted/65 dark:bg-olive/10 flex items-center justify-center text-olive dark:text-olive-light">
                        <Plus className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-warm-text dark:text-cream-bg">
                        Drag & Drop or Click to browse
                      </p>
                      <p className="text-[10px] text-warm-muted dark:text-warm-light-muted leading-relaxed font-mono">
                        Supports PNG, JPG, or WEBP up to 1.5MB. Preview updates instantly.
                      </p>
                    </div>
                  </div>
                  
                  {uploadError && (
                    <p className="text-[11px] text-rose-500 font-mono mt-2 flex items-center space-x-1">
                      <span>•</span> <span>{uploadError}</span>
                    </p>
                  )}

                  {/* FALLBACK INPUT LINK */}
                  <div className="mt-4">
                    <label className="block text-[10px] font-mono uppercase text-warm-muted dark:text-warm-light-muted mb-1">
                      Or paste direct image URL (Optional fallback)
                    </label>
                    <input 
                      type="text" 
                      value={draft.photoURL} 
                      onChange={(e) => handleUpdateField('photoURL', e.target.value)}
                      placeholder="https://images.unsplash.com/..." 
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-cream-border dark:border-cream-dark-border bg-white dark:bg-cream-dark-card text-warm-text dark:text-cream-bg placeholder:text-warm-light-muted focus:outline-none focus:ring-1 focus:ring-olive"
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* STEP 2: The Bio Abstract */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-warm-muted dark:text-warm-light-muted mb-1.5">
                Short Bio (maximum 150 characters)
              </label>
              <textarea 
                rows={4}
                value={draft.bio}
                onChange={(e) => handleUpdateField('bio', e.target.value)}
                maxLength={150}
                placeholder="Compose a compelling short bio (maximum 150 characters) describing who you are..."
                className="w-full text-xs px-4 py-3 rounded-xl border border-cream-border dark:border-cream-dark-border bg-[#FDFBF7]/40 dark:bg-cream-dark-bg/40 text-warm-text dark:text-cream-bg placeholder:text-warm-light-muted focus:outline-none focus:ring-1 focus:ring-olive"
              ></textarea>
              <div className="flex justify-between text-[11px] font-mono text-warm-muted dark:text-warm-light-muted mt-2">
                <span>Keep it direct, humble, and clear. No jargon or corporate sales buzzwords.</span>
                <span className={draft.bio?.length > 150 ? "text-rose-500 font-bold animate-pulse" : ""}>
                  {draft.bio?.length || 0}/150 chars
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: My Story long-form */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-mono uppercase text-warm-muted dark:text-warm-light-muted mb-1.5">
                About Me (large text area)
              </label>
              <textarea 
                rows={10}
                value={draft.story}
                onChange={(e) => handleUpdateField('story', e.target.value)}
                placeholder="Share your raw journey, background, and what you are passionate about..."
                className="w-full text-xs p-4 rounded-xl border border-cream-border dark:border-cream-dark-border bg-[#FDFBF7]/40 dark:bg-cream-dark-bg/40 text-warm-text dark:text-cream-bg placeholder:text-warm-light-muted focus:outline-none focus:ring-1 focus:ring-olive"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-warm-muted dark:text-warm-light-muted mb-1.5">
                Chapter II. Reflective wisdom ( lessons and values)
              </label>
              <textarea 
                rows={4}
                value={draft.lessonsLearned}
                onChange={(e) => handleUpdateField('lessonsLearned', e.target.value)}
                placeholder="1. Mother Nature never rushes, yet everything is accomplished..."
                className="w-full text-xs p-4 rounded-xl border border-cream-border dark:border-cream-dark-border bg-[#FDFBF7]/40 dark:bg-cream-dark-bg/40 text-warm-text dark:text-cream-bg placeholder:text-warm-light-muted focus:outline-none focus:ring-1 focus:ring-olive"
              ></textarea>
            </div>
          </div>
        )}

        {/* STEP 4: Skills & Fields */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-mono uppercase text-warm-muted dark:text-warm-light-muted mb-1.5">
                Interests (display as beautiful tags)
              </label>
              
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  value={newExpertiseTag}
                  onChange={(e) => setNewExpertiseTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertiseTag())}
                  placeholder="e.g. Microbiology, Urban Farming, Classical Music..." 
                  className="flex-1 text-xs px-4 py-2.5 rounded-xl border border-cream-border dark:border-cream-dark-border bg-[#FDFBF7]/40 dark:bg-cream-dark-bg/40 text-warm-text dark:text-cream-bg placeholder:text-warm-light-muted focus:outline-none focus:ring-1 focus:ring-olive"
                />
                <button 
                  type="button"
                  onClick={addExpertiseTag}
                  className="px-4 py-2.5 bg-olive text-white hover:bg-olive-dark transition-all rounded-xl cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Tag pile */}
              <div className="flex flex-wrap gap-2 mt-4">
                {draft.expertiseTags?.length === 0 ? (
                  <span className="text-xs text-warm-muted italic">No interests added yet. Add some topics of interest!</span>
                ) : (
                  draft.expertiseTags?.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-olive/10 text-olive dark:bg-olive/20 dark:text-olive-light border border-olive/15 dark:border-olive/30 rounded-full text-xs font-medium transition-all hover:bg-olive/15"
                    >
                      <span>{tag}</span>
                      <button 
                        type="button" 
                        onClick={() => removeExpertiseTag(tag)}
                        className="text-olive hover:text-rose-600 font-bold cursor-pointer inline-flex items-center justify-center p-0.5"
                      >
                        &times;
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-warm-muted dark:text-warm-light-muted mb-1.5">
                Chapter III. Brief Daily Routine / Schedule Summary
              </label>
              <textarea 
                rows={4}
                value={draft.dailyLife}
                onChange={(e) => handleUpdateField('dailyLife', e.target.value)}
                placeholder="4:30 AM - routine..."
                className="w-full text-xs p-4 rounded-xl border border-cream-border dark:border-cream-dark-border bg-[#FDFBF7]/40 dark:bg-cream-dark-bg/40 text-warm-text dark:text-cream-bg placeholder:text-warm-light-muted focus:outline-none focus:ring-1 focus:ring-olive"
              ></textarea>
            </div>
          </div>
        )}

        {/* STEP 5: Life Milestones */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-mono uppercase text-warm-muted dark:text-warm-light-muted mb-1.5">
                Life Milestones & Pivots (Highlight critical life decisions)
              </label>
              
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  value={newExperienceTag}
                  onChange={(e) => setNewExperienceTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addExperienceTag())}
                  placeholder="e.g. Changed Careers, Failed Crop Reset, Resigned Corporate Life" 
                  className="flex-1 text-xs px-4 py-2.5 rounded-xl border border-cream-border dark:border-cream-dark-border bg-[#FDFBF7]/40 dark:bg-cream-dark-bg/40 text-warm-text dark:text-cream-bg placeholder:text-warm-light-muted focus:outline-none focus:ring-1 focus:ring-olive"
                />
                <button 
                  type="button"
                  onClick={addExperienceTag}
                  className="px-4 py-2.5 bg-olive-muted hover:bg-olive-light dark:bg-cream-dark-bg text-olive dark:text-olive-light border border-cream-border dark:border-cream-dark-border rounded-xl transition-all cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Tag pile */}
              <div className="flex flex-wrap gap-2 mt-4">
                {draft.experienceTags?.length === 0 ? (
                  <span className="text-xs text-warm-muted italic">No milestone elements entered yet.</span>
                ) : (
                  draft.experienceTags?.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-olive-accent/45 dark:bg-cream-dark-bg text-olive dark:text-olive-light rounded-lg text-xs font-mono border border-cream-border/30 dark:border-cream-dark-border/30 font-medium"
                    >
                      <span>{tag}</span>
                      <button 
                        type="button" 
                        onClick={() => removeExperienceTag(tag)}
                        className="text-warm-muted hover:text-rose-600 font-bold cursor-pointer"
                      >
                        &times;
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Projects Index */}
        {step === 6 && (
          <div className="space-y-6">
            <div className="bg-olive-muted/30 dark:bg-cream-dark-bg/60 p-4 rounded-xl border border-cream-border dark:border-cream-dark-border space-y-3">
              <h4 className="font-serif font-bold text-xs text-warm-text dark:text-cream-bg uppercase tracking-wider">
                Add initiative / project
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input 
                  type="text" 
                  value={newProject.title}
                  onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Project Title (e.g. Soil cooperative Map)"
                  className="text-xs p-2.5 rounded-lg border border-cream-border bg-white dark:bg-cream-dark-card text-warm-text dark:text-cream-bg"
                />
                <input 
                  type="text" 
                  value={newProject.url}
                  onChange={(e) => setNewProject(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="Initiative URL (e.g. https://coop.org)"
                  className="text-xs p-2.5 rounded-lg border border-cream-border bg-white dark:bg-cream-dark-card text-warm-text dark:text-cream-bg"
                />
              </div>
              <textarea 
                rows={2}
                value={newProject.description || ''}
                onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Short descriptive abstract..."
                className="w-full text-xs p-2.5 rounded-lg border border-cream-border bg-white dark:bg-cream-dark-card text-warm-text dark:text-cream-bg"
              ></textarea>
              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={addProject}
                  className="px-4 py-2 bg-olive text-white rounded-lg text-xs font-semibold hover:bg-olive-dark font-mono shadow-sm cursor-pointer"
                >
                  Confirm Project
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-mono uppercase text-warm-muted dark:text-warm-light-muted">
                Registered Catalog Projects
              </label>
              {(draft.projects || []).length === 0 ? (
                <span className="block text-xs text-warm-muted italic">No custom projects added to bio sheet.</span>
              ) : (
                (draft.projects || []).map((p, idx) => (
                  <div key={idx} className="p-4 bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <h5 className="font-serif font-bold text-olive dark:text-olive-light">{p.title}</h5>
                      <span className="text-[10px] text-warm-muted dark:text-warm-light-muted font-mono italic">{p.url}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeProject(idx)}
                      className="p-1.5 rounded-lg text-warm-muted hover:text-red-500 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Social Anchors */}
            <div className="pt-6 border-t border-cream-border dark:border-cream-dark-border space-y-4">
              <label className="block text-xs font-mono uppercase text-warm-muted dark:text-warm-light-muted">
                Profile Anchor Links
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center text-xs font-semibold text-warm-text dark:text-cream-bg mb-1.5">
                    <Globe className="w-3.5 h-3.5 mr-1.5 text-olive" />
                    <span>Personal Website</span>
                  </label>
                  <input 
                    type="text" 
                    value={draft.socialLinks?.website || ''} 
                    onChange={(e) => handleUpdateSocial('website', e.target.value)}
                    placeholder="https://mywebsite.com" 
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-cream-border dark:border-cream-dark-border bg-[#FDFBF7]/40 dark:bg-cream-dark-bg/40 text-warm-text dark:text-cream-bg"
                  />
                </div>

                <div>
                  <label className="flex items-center text-xs font-semibold text-warm-text dark:text-cream-bg mb-1.5">
                    <Github className="w-3.5 h-3.5 mr-1.5 text-olive" />
                    <span>GitHub Archive</span>
                  </label>
                  <input 
                    type="text" 
                    value={draft.socialLinks?.github || ''} 
                    onChange={(e) => handleUpdateSocial('github', e.target.value)}
                    placeholder="https://github.com/myuser" 
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-cream-border dark:border-cream-dark-border bg-[#FDFBF7]/40 dark:bg-cream-dark-bg/40 text-warm-text dark:text-cream-bg"
                  />
                </div>

                <div>
                  <label className="flex items-center text-xs font-semibold text-warm-text dark:text-cream-bg mb-1.5">
                    <Linkedin className="w-3.5 h-3.5 mr-1.5 text-olive" />
                    <span>LinkedIn</span>
                  </label>
                  <input 
                    type="text" 
                    value={draft.socialLinks?.linkedin || ''} 
                    onChange={(e) => handleUpdateSocial('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/in/myuser" 
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-cream-border dark:border-cream-dark-border bg-[#FDFBF7]/40 dark:bg-cream-dark-bg/40 text-warm-text dark:text-cream-bg"
                  />
                </div>

                <div>
                  <label className="flex items-center text-xs font-semibold text-warm-text dark:text-cream-bg mb-1.5">
                    <Youtube className="w-3.5 h-3.5 mr-1.5 text-olive" />
                    <span>YouTube channel</span>
                  </label>
                  <input 
                    type="text" 
                    value={draft.socialLinks?.youtube || ''} 
                    onChange={(e) => handleUpdateSocial('youtube', e.target.value)}
                    placeholder="https://youtube.com/@mychannel" 
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-cream-border dark:border-cream-dark-border bg-[#FDFBF7]/40 dark:bg-cream-dark-bg/40 text-warm-text dark:text-cream-bg"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* STEP 7: Availability */}
        {step === 7 && (
          <div className="space-y-6">
            <div className="bg-olive-accent/30 dark:bg-cream-dark-card p-5 rounded-2xl border border-cream-border dark:border-cream-dark-border flex items-start space-x-3 text-xs text-warm-text dark:text-[#E8DDCB] mb-6 animate-fade-in">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 text-olive" />
              <div>
                <p className="font-semibold text-[#5F7161] dark:text-[#E8DDCB]">Review your Archive Page carefully before Publishing.</p>
                <p className="mt-1 font-sans leading-relaxed text-warm-muted dark:text-warm-light-muted">
                  The Human Library encourages unpolished, deeply honest storytelling over marketing and self-promotion. Ensure your content does not contain corporate sales copy or resumes.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-mono uppercase text-warm-muted dark:text-warm-light-muted mb-1.5">
                Availability Preferences
              </label>

              <label className="flex items-start space-x-3.5 p-4 rounded-xl border border-cream-border dark:border-cream-dark-border hover:bg-olive-muted/35 dark:hover:bg-cream-dark-bg cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={draft.availability?.questions}
                  onChange={(e) => handleUpdateAvailability('questions', e.target.checked)}
                  className="rounded text-olive focus:ring-olive accent-olive mt-1 cursor-pointer"
                />
                <div className="text-xs">
                  <p className="font-semibold text-warm-text dark:text-cream-bg">Allow Public Questions</p>
                  <p className="text-warm-muted dark:text-warm-light-muted mt-1 font-sans">Visitors will be able to leave public or private text inquiries directly on your biography sheet.</p>
                </div>
              </label>

              <label className="flex items-start space-x-3.5 p-4 rounded-xl border border-cream-border dark:border-cream-dark-border hover:bg-olive-muted/35 dark:hover:bg-cream-dark-bg cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={draft.availability?.mentorship}
                  onChange={(e) => handleUpdateAvailability('mentorship', e.target.checked)}
                  className="rounded text-olive focus:ring-olive accent-olive mt-1 cursor-pointer"
                />
                <div className="text-xs">
                  <p className="font-semibold text-warm-text dark:text-cream-bg">Open to Mentorship</p>
                  <p className="text-warm-muted dark:text-warm-light-muted mt-1 font-sans">Signal that you have some bandwidth to advise students or junior peers looking to follow your career footprint.</p>
                </div>
              </label>

              <label className="flex items-start space-x-3.5 p-4 rounded-xl border border-cream-border dark:border-cream-dark-border hover:bg-olive-muted/35 dark:hover:bg-cream-dark-bg cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={draft.availability?.collaboration}
                  onChange={(e) => handleUpdateAvailability('collaboration', e.target.checked)}
                  className="rounded text-olive focus:ring-olive accent-olive mt-1 cursor-pointer"
                />
                <div className="text-xs">
                  <p className="font-semibold text-warm-text dark:text-cream-bg">Flexible for Collaborative Initiatives</p>
                  <p className="text-warm-muted dark:text-warm-light-muted mt-1 font-sans">Open to joint cooperatives, research networks, or direct exports matching your background.</p>
                </div>
              </label>
            </div>

            {/* Profile Integrity Indicator */}
            <div className="pt-6 border-t border-cream-border dark:border-cream-dark-border">
              <div className="flex justify-between items-center text-xs font-mono mb-2">
                <span>Profile Completeness Score</span>
                <span className="font-bold text-olive dark:text-olive-light">{integrityScore}%</span>
              </div>
              <div className="w-full bg-cream-border dark:bg-cream-dark-border h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${integrityScore > 75 ? 'bg-[#5F7161]' : 'bg-amber-600'}`}
                  style={{ width: `${integrityScore}%` }}
                ></div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* 3. STEP FOOTER CONTROL ACTIONS */}
      <div className="px-6 py-5 bg-[#FDFBF7]/85 dark:bg-cream-dark-card border-t border-cream-border dark:border-cream-dark-border flex justify-between items-center">
        <button 
          type="button"
          disabled={step === 1}
          onClick={() => setStep(prev => prev - 1)}
          className={`flex items-center space-x-1.5 text-xs font-mono text-warm-muted hover:text-warm-text dark:hover:text-cream-bg ${step === 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <ArrowLeft className="w-4 h-4 text-olive" />
          <span>Back Step</span>
        </button>

        {step < 7 ? (
          <button 
            type="button"
            onClick={() => setStep(prev => prev + 1)}
            className="px-5 py-2.5 bg-olive hover:bg-olive-dark text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
          >
            <span>Proceed</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button 
            type="button"
            disabled={saveStatus === 'saving'}
            onClick={handleFinalPublish}
            className="px-6 py-3 bg-olive hover:bg-olive-dark text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
          >
            {saveStatus === 'saving' ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                <span>Cataloging...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check className="w-4 h-4" />
                <span>Biography Registered!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Publish Bio Sheet</span>
              </>
            )}
          </button>
        )}
      </div>

    </div>
  );
};
