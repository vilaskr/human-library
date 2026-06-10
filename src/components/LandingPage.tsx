import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Compass, BookOpen, Sparkles, MessageSquare, ArrowRight, UserCheck, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { recordSearchAppearance } from '../lib/storage';

export const LandingPage: React.FC = () => {
  const { navigateTo, profiles, user } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const popularCategories = [
    { name: 'Students', tag: 'student' },
    { name: 'Video Editors', tag: 'video' },
    { name: 'Teachers', tag: 'teacher' },
    { name: 'Engineers', tag: 'engineer' },
    { name: 'Coffee Farmers', tag: 'coffee' },
    { name: 'Entrepreneurs', tag: 'business' },
    { name: 'Artists', tag: 'wood' },
    { name: 'Doctors', tag: 'medicine' },
  ].map(cat => {
    const count = profiles.filter(profile => {
      if (profile.isDraft) return false;
      if (profile.moderationStatus && profile.moderationStatus !== 'approved') return false;

      const s = cat.tag.toLowerCase();
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

      return matchText.includes(s);
    }).length;

    return { ...cat, count };
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateTo('search', { query: searchQuery });
  };

  const handleCategoryClick = (tag: string) => {
    navigateTo('search', { query: tag });
  };

  // Find featured, or fallback to the first few loaded profiles
  const featuredHumans = profiles.filter(p => !p.isDraft).slice(0, 3);

  return (
    <div className="min-h-screen bg-cream-bg dark:bg-cream-dark-bg pb-24 text-warm-text dark:text-cream-bg transition-colors duration-200">
      
      {/* 1. HERO SECTION */}
      <section className="relative px-4 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center overflow-hidden">
        {/* Soft background radial highlights for organic feel */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#EFE9DD]/30 dark:bg-olive/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-4xl mx-auto">
          {/* Subtle tag anchor */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-olive-light dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border rounded-full text-xs font-mono font-medium text-olive-dark dark:text-olive-light mb-6 sm:mb-8"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Archive of Real Journeys</span>
          </motion.div>

          {/* Main Title Headings */}
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.1] mb-5 sm:mb-6"
          >
            Discover <span className="italic font-normal">people</span>,<br />
            not <span className="font-mono font-light text-slate-400 dark:text-slate-500">profiles.</span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-xl sm:max-w-2xl mx-auto text-base sm:text-lg text-gray-600 dark:text-slate-400 mb-10 sm:mb-12 leading-relaxed font-sans"
          >
            Explore real stories, careers, experiences, and life lessons from ordinary people around the world. No marketing templates. No corporate lingo. Just human journeys.
          </motion.p>

          {/* Large Search Bar */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto mb-8 sm:mb-10 px-0 sm:px-4"
          >
            <form 
              onSubmit={handleSearchSubmit}
              className="flex flex-col sm:flex-row items-stretch bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border p-2 rounded-2xl shadow-paper transition-shadow focus-within:ring-2 focus-within:ring-olive/40 dark:focus-within:ring-olive/40 cursor-text"
              id="hero-search-form"
            >
              <div className="flex-1 flex items-center px-4 py-2 sm:py-0">
                <Search className="w-5 h-5 text-warm-muted dark:text-warm-light-muted mr-3 shrink-0" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search video editor, coffee farmer, teacher, student..."
                  className="w-full bg-transparent border-none text-warm-text dark:text-cream-bg focus:outline-none py-1 text-sm sm:text-base font-sans"
                />
              </div>
              <button 
                type="submit"
                className="bg-olive hover:bg-olive-dark text-white dark:bg-olive dark:hover:bg-olive-dark px-6 py-3.5 rounded-xl font-medium text-sm transition-all shadow-sm shrink-0 flex items-center justify-center space-x-2 cursor-pointer"
                id="hero-search-btn"
              >
                <span>Browse Lives</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4"
          >
            <button 
              onClick={() => navigateTo('search')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border text-sm font-semibold hover:bg-[#FAF9F5] dark:hover:bg-olive-dark/30 transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer text-warm-text dark:text-cream-bg"
              id="hero-explore-cta"
            >
              <Compass className="w-4 h-4 text-warm-muted dark:text-warm-light-muted" />
              <span>Explore Catalog</span>
            </button>
            <button 
              onClick={() => navigateTo(user ? 'dashboard' : 'editor')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-olive hover:bg-olive-dark text-white dark:bg-olive dark:hover:bg-olive-dark text-sm font-semibold transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
              id="hero-create-cta"
            >
              <BookOpen className="w-4 h-4" />
              <span>Create Your Page</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* 2. POPULAR CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="border-t border-cream-border dark:border-cream-dark-border pt-16">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10">
            <div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-warm-text dark:text-cream-bg">
                Cataloged Categories
              </h3>
              <p className="text-sm text-warm-muted dark:text-warm-light-muted mt-1">
                Filter the human archive by specific callings and life stages.
              </p>
            </div>
            <button 
              onClick={() => navigateTo('search')}
              className="group flex items-center space-x-1.5 text-sm font-medium text-olive dark:text-olive-light hover:underline mt-4 sm:mt-0 cursor-pointer"
              id="categories-explore-all"
            >
              <span>View exact indices</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularCategories.map((cat, idx) => (
              <div 
                key={idx}
                onClick={() => handleCategoryClick(cat.tag)}
                className="group p-5 bg-white dark:bg-cream-dark-card border border-cream-border dark:border-cream-dark-border rounded-2xl cursor-pointer hover:border-olive dark:hover:border-olive hover:shadow-cozy transition-all"
                id={`cat-${cat.tag}`}
              >
                <div className="font-serif text-lg font-bold text-warm-text dark:text-cream-bg transition-colors group-hover:text-olive dark:group-hover:text-olive-light">
                  {cat.name}
                </div>
                <div className="mt-2 text-xs font-mono uppercase text-warm-light-muted dark:text-warm-muted">
                  {cat.count > 0 ? `${cat.count} curated books` : 'Awaiting entries'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURED HUMANS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="border-t border-cream-border dark:border-cream-dark-border pt-16">
          <div className="text-center sm:text-left mb-12">
            <h3 className="font-serif text-3xl sm:text-4xl font-bold text-warm-text dark:text-cream-bg">
              Curated Narratives
            </h3>
            <p className="text-sm text-warm-muted dark:text-warm-light-muted mt-2 max-w-xl">
              Take a quiet moment to read through a few highlights. Written by ordinary humans with extraordinary depth in details.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredHumans.map((profile) => (
              <div 
                key={profile.uid}
                className="flex flex-col bg-white dark:bg-cream-dark-card rounded-2xl border border-cream-border dark:border-cream-dark-border overflow-hidden shadow-paper h-full hover:scale-[1.01] transition-transform"
                id={`featured-card-${profile.uid}`}
              >
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Header: Photo & Core details */}
                    <div className="flex items-center space-x-4 mb-5">
                      <img 
                        src={profile.photoURL} 
                        alt={profile.name} 
                        className="w-12 h-12 rounded-full object-cover border border-olive/20"
                      />
                      <div>
                        <h4 className="font-serif font-bold text-lg text-warm-text dark:text-cream-bg">
                          {profile.name}
                        </h4>
                        <div className="text-xs font-mono uppercase text-warm-light-muted mt-0.5">
                          {profile.location}
                        </div>
                      </div>
                    </div>

                    <div className="inline-block px-2.5 py-1 bg-olive-accent dark:bg-cream-dark-bg text-olive dark:text-olive-light rounded-lg text-xs font-medium mb-3 border border-cream-border dark:border-cream-dark-border">
                      {profile.profession}
                    </div>

                    <p className="text-sm text-warm-dark-muted dark:text-warm-light-muted line-clamp-3 mb-6 font-sans italic leading-relaxed">
                      "{profile.bio}"
                    </p>
                  </div>

                  <div>
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {profile.experienceTags.slice(0, 2).map((tag, idx) => (
                        <span 
                          key={idx} 
                          className="px-2 py-0.5 bg-olive-muted dark:bg-cream-dark-bg text-warm-muted dark:text-warm-light-muted text-[10px] uppercase font-mono rounded border border-cream-border/10"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <button 
                      onClick={() => navigateTo('human', { uid: profile.uid })}
                      className="w-full text-center bg-olive/10 text-olive hover:bg-olive hover:text-white dark:bg-olive/20 dark:text-olive-light dark:hover:bg-olive dark:hover:text-white py-3 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
                      id={`read-featured-${profile.uid}`}
                    >
                      Read full biography
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="border-t border-cream-border dark:border-cream-dark-border pt-16 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2.5 mb-4">
                <div className="p-2 bg-cream-bg border border-cream-border rounded-xl text-olive">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold text-lg text-warm-text dark:text-cream-bg">
                  Human Library
                </h4>
              </div>
              <p className="text-xs text-warm-muted dark:text-warm-light-muted max-w-sm leading-relaxed font-sans">
                A globally crowdsourced archive of lives, dedicated to quiet cataloging, deep career postmodems, and honest storytelling. Wikipedia × Notion × Medium.
              </p>
            </div>
            
            <div>
              <h5 className="font-mono text-[10px] uppercase tracking-wider text-warm-light-muted mb-3">
                Philosophy
              </h5>
              <ul className="space-y-2 text-xs text-warm-muted dark:text-warm-light-muted">
                <li><span className="hover:underline cursor-pointer hover:text-olive">Archive Manifesto</span></li>
                <li><span className="hover:underline cursor-pointer hover:text-olive">Ordinary Journeys</span></li>
                <li><span className="hover:underline cursor-pointer hover:text-olive">No Influencer Mandate</span></li>
              </ul>
            </div>

            <div>
              <h5 className="font-mono text-[10px] uppercase tracking-wider text-warm-light-muted mb-3">
                Legal & Archive
              </h5>
              <ul className="space-y-2 text-xs text-warm-muted dark:text-warm-light-muted">
                <li><span className="hover:underline cursor-pointer hover:text-olive">Terms of Cataloging</span></li>
                <li><span className="hover:underline cursor-pointer hover:text-olive">Privacy Principles</span></li>
                <li><span className="hover:underline cursor-pointer hover:text-olive">Contact Curators</span></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center border-t border-cream-border dark:border-cream-dark-border pt-8 mt-8 text-[11px] text-warm-light-muted font-mono">
            <div>
              © 2026 Human Library Foundation. Made for genuine connections.
            </div>
            <div className="flex items-center space-x-1.5 mt-4 sm:mt-0 text-olive dark:text-olive-light">
              <Heart className="w-3 h-3 fill-current" />
              <span>In praise of quiet, structured lives</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};
