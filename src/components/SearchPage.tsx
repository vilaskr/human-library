import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { HumanProfile } from '../types';
import { Search, MapPin, Briefcase, Filter, Calendar, BookOpen, Bookmark, X, SlidersHorizontal, Check } from 'lucide-react';
import { recordSearchAppearance } from '../lib/storage';

export const SearchPage: React.FC = () => {
  const { profiles, loadingProfiles, routeParams, navigateTo, isBookmarked, toggleBookmark } = useApp();
  
  // State variables for filter inputs
  const [queryString, setQueryString] = useState(routeParams.query || '');
  const [selectedProfession, setSelectedProfession] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedLifeTag, setSelectedLifeTag] = useState('');
  const [minYears, setMinYears] = useState<number>(0);
  
  // Availability switches
  const [reqQuestions, setReqQuestions] = useState(false);
  const [reqMentorship, setReqMentorship] = useState(false);
  const [reqCollaboration, setReqCollaboration] = useState(false);

  const [showFilters, setShowFilters] = useState(false);

  // Derive unique lists of fields for autocomplete drop-downs
  const availableIndustries = Array.from(new Set(profiles.map(p => p.industry).filter(Boolean)));
  const availableLocations = Array.from(new Set(profiles.map(p => p.location).filter(Boolean)));
  
  // Deduplicate all experience tags across catalog
  const availableLifeTags = Array.from(
    new Set(profiles.flatMap(p => p.experienceTags || []).filter(Boolean))
  );

  // Sync initial query param from Landing Page redirects
  useEffect(() => {
    if (routeParams.query) {
      setQueryString(routeParams.query);
    }
  }, [routeParams.query]);

  // Main matching engine
  const filteredProfiles = profiles.filter((profile) => {
    if (profile.isDraft) return false;

    // Filter only saved bookmarks if route parameter demands it
    if (routeParams.saved === 'true' && !isBookmarked(profile.uid)) {
      return false;
    }

    // 1. Text Search matching name, profession, bio, story, or tags
    if (queryString) {
      const s = queryString.toLowerCase();
      const matchText = [
        profile.name,
        profile.profession,
        profile.industry,
        profile.location,
        profile.bio,
        profile.story,
        ...(profile.expertiseTags || []),
        ...(profile.experienceTags || [])
      ].join(' ').toLowerCase();

      if (!matchText.includes(s)) return false;
    }

    // 2. Profession matching
    if (selectedProfession) {
      const sp = selectedProfession.toLowerCase();
      if (!profile.profession.toLowerCase().includes(sp)) return false;
    }

    // 3. Location matching
    if (selectedLocation && profile.location !== selectedLocation) {
      return false;
    }

    // 4. Industry matching
    if (selectedIndustry && profile.industry !== selectedIndustry) {
      return false;
    }

    // 5. Experience tag matching
    if (selectedLifeTag && !profile.experienceTags.includes(selectedLifeTag)) {
      return false;
    }

    // 6. Years of experience limit
    if (profile.yearsOfExperience < minYears) {
      return false;
    }

    // 7. Availability configurations
    if (reqQuestions && !profile.availability.questions) return false;
    if (reqMentorship && !profile.availability.mentorship) return false;
    if (reqCollaboration && !profile.availability.collaboration) return false;

    return true;
  });

  // Track search appearance analytics when rendering search outputs
  useEffect(() => {
    if (filteredProfiles.length > 0) {
      filteredProfiles.forEach((p) => {
        recordSearchAppearance(p.uid);
      });
    }
  }, [queryString, selectedProfession, selectedLocation, selectedIndustry, selectedLifeTag, minYears, reqQuestions, reqMentorship, reqCollaboration]);

  const clearAllFilters = () => {
    setQueryString('');
    setSelectedProfession('');
    setSelectedLocation('');
    setSelectedIndustry('');
    setSelectedLifeTag('');
    setMinYears(0);
    setReqQuestions(false);
    setReqMentorship(false);
    setReqCollaboration(false);
  };

  return (
    <div className="min-h-screen bg-cream-bg dark:bg-cream-dark-bg pb-24 text-warm-text dark:text-cream-bg transition-colors duration-200">
      
      {/* Intro Masthead */}
      <div className="bg-white/60 dark:bg-cream-dark-card border-b border-cream-border dark:border-cream-dark-border py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-warm-text dark:text-cream-bg">
            {routeParams.saved === 'true' ? 'My Saved Library' : 'Human Archive Catalog'}
          </h2>
          <p className="text-sm text-warm-muted dark:text-warm-light-muted mt-2 max-w-xl">
            {routeParams.saved === 'true' 
              ? 'Browse your hand-picked portfolio of individuals, mentors, and registered bio storytellers.' 
              : 'Read comprehensive, unpolished bios of real individuals around the globe. Filter by experience or trade indices below.'}
          </p>
          {routeParams.saved === 'true' && (
            <button
              onClick={() => navigateTo('search')}
              className="mt-4 px-4 py-2 bg-olive/10 hover:bg-olive/15 text-olive dark:bg-olive/20 dark:text-olive-light border border-olive/10 dark:border-olive/20 rounded-xl text-xs font-mono transition-all cursor-pointer font-semibold"
            >
              ← Back to Full Catalog
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* FILTER DRAWER SIDEBAR */}
          <div className={`lg:block ${showFilters ? 'block' : 'hidden'} lg:col-span-1`}>
            <div className="bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border p-6 rounded-2xl shadow-cozy sticky top-28">
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif font-bold text-lg text-warm-text dark:text-cream-bg flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-olive" />
                  <span>Search Filters</span>
                </h3>
                <button 
                  onClick={clearAllFilters}
                  className="text-xs font-mono text-warm-light-muted hover:text-warm-text dark:hover:text-cream-bg cursor-pointer transition-colors"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-6">
                {/* 1. Profession input */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-warm-muted mb-1.5">
                    Profession Type
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3.5 w-4 h-4 text-warm-light-muted" />
                    <input 
                      type="text" 
                      value={selectedProfession}
                      onChange={(e) => setSelectedProfession(e.target.value)}
                      placeholder="e.g. Farmer, Editor"
                      className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-cream-border dark:border-cream-dark-border bg-transparent text-warm-text dark:text-cream-bg placeholder:text-warm-light-muted focus:outline-none focus:ring-1 focus:ring-olive"
                    />
                  </div>
                </div>

                {/* 2. Industry dropdown */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-warm-muted mb-1.5">
                    Industry Sector
                  </label>
                  <select 
                    value={selectedIndustry}
                    onChange={(e) => setSelectedIndustry(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-cream-border dark:border-cream-dark-border bg-transparent text-warm-text dark:text-cream-bg focus:outline-none focus:ring-1 focus:ring-olive"
                  >
                    <option className="dark:bg-cream-dark-card" value="">All Sectors</option>
                    {availableIndustries.map((ind, i) => (
                      <option className="dark:bg-cream-dark-card" key={i} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Location dropdown */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-warm-muted mb-1.5">
                    Geographic Region
                  </label>
                  <select 
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-cream-border dark:border-cream-dark-border bg-transparent text-warm-text dark:text-cream-bg focus:outline-none focus:ring-1 focus:ring-olive"
                  >
                    <option className="dark:bg-cream-dark-card" value="">All Worldwide</option>
                    {availableLocations.map((loc, i) => (
                      <option className="dark:bg-cream-dark-card" key={i} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Experience Tags */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-warm-muted mb-1.5">
                    Life Experiences
                  </label>
                  <select 
                    value={selectedLifeTag}
                    onChange={(e) => setSelectedLifeTag(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-cream-border dark:border-cream-dark-border bg-transparent text-warm-text dark:text-cream-bg focus:outline-none focus:ring-1 focus:ring-olive"
                  >
                    <option className="dark:bg-cream-dark-card" value="">All Experiences</option>
                    {availableLifeTags.map((tag, i) => (
                      <option className="dark:bg-cream-dark-card" key={i} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>

                {/* 5. Years of experience range */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[11px] font-mono uppercase text-warm-muted">
                      Minimum Experience
                    </label>
                    <span className="text-xs font-mono font-medium text-olive dark:text-olive-light">
                      {minYears}+ years
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="20" 
                    value={minYears}
                    onChange={(e) => setMinYears(Number(e.target.value))}
                    className="w-full accent-olive"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-warm-light-muted mt-1">
                    <span>0 yr</span>
                    <span>10 yr</span>
                    <span>20 yr+</span>
                  </div>
                </div>

                {/* 6. Availability criteria */}
                <div className="pt-2 border-t border-cream-border dark:border-cream-dark-border space-y-3">
                  <label className="block text-[11px] font-mono uppercase text-warm-muted">
                    Open Preferences
                  </label>
                  
                  <label className="flex items-center space-x-3 text-xs text-warm-muted dark:text-warm-light-muted cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={reqQuestions}
                      onChange={(e) => setReqQuestions(e.target.checked)}
                      className="rounded border-cream-border dark:border-cream-dark-border text-olive focus:ring-olive accent-olive"
                    />
                    <span>Accepting Queries</span>
                  </label>

                  <label className="flex items-center space-x-3 text-xs text-warm-muted dark:text-warm-light-muted cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={reqMentorship}
                      onChange={(e) => setReqMentorship(e.target.checked)}
                      className="rounded border-cream-border dark:border-cream-dark-border text-olive focus:ring-olive accent-olive"
                    />
                    <span>Open to Mentorship</span>
                  </label>

                  <label className="flex items-center space-x-3 text-xs text-warm-muted dark:text-warm-light-muted cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={reqCollaboration}
                      onChange={(e) => setReqCollaboration(e.target.checked)}
                      className="rounded border-cream-border dark:border-cream-dark-border text-olive focus:ring-olive accent-olive"
                    />
                    <span>Open to Collaborate</span>
                  </label>
                </div>

              </div>
            </div>
          </div>

          {/* MAIN RESULTS LOG CONTAINER */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Search inputs */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-light-muted" />
                <input 
                  type="text" 
                  value={queryString}
                  onChange={(e) => setQueryString(e.target.value)}
                  placeholder="Query lives: 'foraging', 'burnout', 'heritage', 'Tokyo'..."
                  className="w-full bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border rounded-2xl pl-11 pr-10 py-3 placeholder:text-warm-light-muted text-sm focus:outline-none focus:ring-1 focus:ring-olive text-warm-text dark:text-cream-bg transition-shadow shadow-sm"
                />
                {queryString && (
                  <button 
                    onClick={() => setQueryString('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-olive-light dark:hover:bg-cream-dark-bg text-warm-light-muted hover:text-warm-text cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Mobile Filter toggle */}
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border text-sm text-warm-muted dark:text-warm-light-muted hover:bg-olive-light dark:hover:bg-cream-dark-border cursor-pointer transition-all"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>

            {/* Results metadata */}
            <div className="flex justify-between items-center text-xs font-mono text-warm-muted dark:text-warm-light-muted">
              {loadingProfiles ? (
                <div className="h-4 w-36 bg-cream-border/70 dark:bg-cream-dark-border/80 animate-pulse rounded-lg" />
              ) : (
                <div>
                  Showing <span className="font-bold text-warm-text dark:text-cream-bg">{filteredProfiles.length}</span> registry pages
                </div>
              )}
              <div className="flex items-center space-x-2">
                <span>Ordered: Alphabetical</span>
              </div>
            </div>

            {/* Catalog Grid */}
            {loadingProfiles ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={i} 
                    className="bg-white dark:bg-cream-dark-card rounded-2xl border border-cream-border dark:border-cream-dark-border p-6 shadow-cozy flex flex-col justify-between animate-pulse"
                  >
                    <div>
                      {/* Header details skeleton */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-11 h-11 rounded-full bg-cream-border dark:bg-cream-dark-border" />
                          <div className="space-y-1.5 animate-pulse">
                            <div className="h-4 w-32 bg-cream-border dark:bg-cream-dark-border rounded" />
                            <div className="h-3 w-16 bg-cream-border dark:bg-cream-dark-border rounded" />
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-cream-border dark:bg-cream-dark-border" />
                      </div>

                      {/* Profession pill skeleton */}
                      <div className="h-5 w-24 bg-cream-border/70 dark:bg-cream-dark-border/70 rounded-lg mb-4" />

                      {/* Bio skeleton */}
                      <div className="space-y-2 mb-5">
                        <div className="h-3 w-full bg-cream-border/60 dark:bg-cream-dark-border/60 rounded" />
                        <div className="h-3 w-11/12 bg-cream-border/60 dark:bg-cream-dark-border/60 rounded" />
                        <div className="h-3 w-4/5 bg-cream-border/60 dark:bg-cream-dark-border/60 rounded" />
                      </div>
                    </div>

                    <div>
                      {/* Tags helper skeleton */}
                      <div className="flex space-x-1.5 mb-5">
                        <div className="h-4 w-12 bg-cream-border/50 dark:bg-cream-dark-border/50 rounded" />
                        <div className="h-4 w-16 bg-cream-border/50 dark:bg-cream-dark-border/50 rounded" />
                        <div className="h-4 w-14 bg-cream-border/50 dark:bg-cream-dark-border/50 rounded" />
                      </div>

                      {/* Footer separator & buttons */}
                      <div className="flex items-center justify-between pt-4 border-t border-cream-border dark:border-cream-dark-border">
                        <div className="h-3.5 w-20 bg-cream-border/60 dark:bg-cream-dark-border/60 rounded" />
                        <div className="h-3.5 w-16 bg-cream-border/80 dark:bg-cream-dark-border/80 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="bg-white dark:bg-cream-dark-card rounded-2xl border border-dotted border-cream-border dark:border-cream-dark-border p-12 text-center text-warm-muted max-w-lg mx-auto">
                <BookOpen className="w-12 h-12 text-warm-light-muted mx-auto mb-4" />
                <h4 className="font-serif font-bold text-lg text-warm-text dark:text-cream-bg">No biographical pages match</h4>
                <p className="text-xs text-warm-light-muted mt-2">
                  Try decreasing your parameters or typing simple words (e.g. coffee, editor, teacher).
                </p>
                <button 
                  onClick={clearAllFilters}
                  className="mt-4 px-4 py-2 border border-cream-border dark:border-cream-dark-border rounded-xl text-xs hover:bg-olive-light dark:hover:bg-cream-dark-bg text-warm-text dark:text-cream-bg transition-colors cursor-pointer"
                >
                  Reset parameters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredProfiles.map((p) => {
                  const bookmarked = isBookmarked(p.uid);
                  return (
                    <div 
                      key={p.uid} 
                      className="bg-white dark:bg-cream-dark-card rounded-2xl border border-cream-border dark:border-cream-dark-border p-6 shadow-cozy flex flex-col justify-between hover:border-olive/30 dark:hover:border-cream-dark-border transition-all group"
                      id={`search-item-${p.uid}`}
                    >
                      <div>
                        {/* Header details */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={p.photoURL} 
                              alt={p.name} 
                              className="w-11 h-11 rounded-full object-cover border border-cream-border/30 shadow-sm"
                            />
                            <div>
                              <h4 className="font-serif font-bold text-base text-warm-text dark:text-cream-bg group-hover:text-olive dark:group-hover:text-olive-light transition-colors">
                                {p.name}
                              </h4>
                              <div className="flex items-center text-[10px] uppercase font-mono text-warm-light-muted mt-0.5">
                                <MapPin className="w-3 h-3 mr-1 text-olive-light" />
                                <span>{p.location}</span>
                              </div>
                            </div>
                          </div>

                          {/* Bookmark trigger */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(p.uid);
                            }}
                            className={`p-1.5 rounded-full transition-all border cursor-pointer ${
                              bookmarked 
                                ? 'bg-amber-50/20 border-amber-200 text-amber-600' 
                                : 'hover:bg-olive-light dark:hover:bg-cream-dark-border border-transparent text-warm-light-muted hover:text-warm-text'
                            }`}
                            id={`bookmark-toggle-${p.uid}`}
                          >
                            <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        <div className="inline-block px-2.5 py-0.5 bg-olive-muted dark:bg-cream-dark-bg text-olive dark:text-olive-light rounded-lg text-[11px] font-medium mb-3 border border-cream-border/30 dark:border-cream-dark-border/30">
                          {p.profession}
                        </div>

                        <p className="text-xs text-warm-muted dark:text-warm-light-muted line-clamp-3 italic leading-relaxed mb-4 font-sans">
                          "{p.bio}"
                        </p>
                      </div>

                      <div>
                        {/* Experience Tags */}
                        <div className="flex flex-wrap gap-1 mb-5">
                          {p.experienceTags.slice(0, 3).map((tag, idx) => (
                            <span 
                              key={idx} 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLifeTag(tag);
                              }}
                              className="px-1.5 py-0.5 bg-olive-accent hover:bg-olive-light dark:bg-cream-dark-bg dark:hover:bg-cream-dark-border text-warm-muted dark:text-warm-light-muted text-[9px] uppercase font-mono rounded cursor-pointer transition-colors"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-cream-border dark:border-cream-dark-border">
                          <span className="text-[10px] font-mono text-warm-light-muted">
                            {p.yearsOfExperience} yrs experience
                          </span>
                          <button 
                            onClick={() => navigateTo('human', { uid: p.uid })}
                            className="text-xs font-mono uppercase font-bold text-olive dark:text-olive-light flex items-center space-x-1 hover:underline cursor-pointer"
                            id={`view-button-${p.uid}`}
                          >
                            <span>Open Log</span>
                            <span>→</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};
