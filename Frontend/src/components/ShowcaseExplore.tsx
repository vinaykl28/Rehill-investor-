import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Project } from '../types';
import { 
  Calendar, 
  Gift, 
  HeartHandshake, 
  Home, 
  Sparkles, 
  MapPin, 
  Phone, 
  X, 
  Share2, 
  Check, 
  Copy, 
  Send,
  Building2,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Camera,
  Image as ImageIcon,
  User as UserIcon,
  LogOut,
  ExternalLink,
  Star,
  Download,
  Clock,
  Compass,
  CheckCircle2,
  Car,
  FileCheck,
  BadgeCheck,
  ArrowUpRight,
  ArrowLeft,
  Users,
  Briefcase,
  UserCheck,
  Search,
  Coins,
  FileText,
  HelpCircle,
  Award,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';
import InteractiveMap, { MapProject } from './InteractiveMap';
import { SHOWCASE_CONFIG, ShowcaseProject } from '../config/showcaseConfig';
import { apiFetch } from '../api/client';
import { getAssetUrl } from '../config/env';

interface ShowcaseExploreProps {
  user: User;
  onLogout: () => void;
  apiProjects?: Project[];
  onNavigateToPortfolio?: () => void;
  hasInvestments?: boolean;
}

export default function ShowcaseExplore({
  user,
  onLogout,
  apiProjects = [],
  onNavigateToPortfolio,
  hasInvestments = false
}: ShowcaseExploreProps) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<ShowcaseProject | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);
  const [showSiteVisitModal, setShowSiteVisitModal] = useState(false);
  const [showEnquirySuccess, setShowEnquirySuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<'projects' | 'referral' | 'events'>('projects');
  const [fetchedDbProjects, setFetchedDbProjects] = useState<Project[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch('/api/investor/projects').then(r => (r.ok ? r.json() : [])).catch(() => []),
      apiFetch('/api/investor/new-projects').then(r => (r.ok ? r.json() : [])).catch(() => []),
    ]).then(([assigned, open]) => {
      if (!active) return;
      const map = new Map<number, Project>();
      if (Array.isArray(assigned)) assigned.forEach((p: Project) => map.set(p.id, p));
      if (Array.isArray(open)) open.forEach((p: Project) => map.set(p.id, p));
      setFetchedDbProjects(Array.from(map.values()));
    });
    return () => {
      active = false;
    };
  }, []);

  const combinedDbProjects = useMemo(() => {
    const map = new Map<number, Project>();
    apiProjects.forEach(p => map.set(p.id, p));
    fetchedDbProjects.forEach(p => map.set(p.id, p));
    return Array.from(map.values());
  }, [apiProjects, fetchedDbProjects]);

  const allShowcaseProjects: ShowcaseProject[] = useMemo(() => {
    return combinedDbProjects.map((p) => {
      const imgUrl = getAssetUrl(p.image_url, p.id);
      return {
        id: String(p.id),
        name: p.name,
        category: 'highrise',
        location: p.location,
        badge: p.status === 'Completed' ? 'Exclusive Edition' : p.status === 'In Progress' ? 'Under Construction' : 'New Launch',
        rating: '4.9/5',
        image: imgUrl,
        priceStarting: p.total_value || (p.market_price_per_sqft ? `₹${p.market_price_per_sqft.toLocaleString('en-IN')}/sqft` : 'On Request'),
        configuration: 'Boutique Residential Community',
        possessionDate: p.status || 'Active Development',
        carpetArea: p.allotted_sqft ? `${p.allotted_sqft.toLocaleString('en-IN')} sq.ft.` : 'Custom Layouts',
        statusText: p.status || 'Active Development',
        description: `${p.name} in ${p.location} — RERA-registered residential development managed by Redhill Infrastructure (${p.completion_percentage || 0}% site completion).`,
        highlights: [
          `${p.location} · ${p.status || 'Active'}`,
          `${p.completion_percentage || 0}% Recorded Construction Progress`,
        ],
        gallery: [
          {
            url: imgUrl,
            title: `${p.name} — ${p.location}`,
            tag: p.status || 'Overview',
          },
        ],
      };
    });
  }, [combinedDbProjects]);

  const mapProjects: MapProject[] = useMemo(() => {
    return combinedDbProjects.map((p) => ({
      id: p.id,
      name: p.name,
      location: p.location,
      address: `${p.name}, ${p.location}`,
      lat: 12.9716,
      lng: 77.5946,
      status: `${p.status || 'Active'} (${p.completion_percentage || 0}%)`,
      completion: p.completion_percentage || 0,
      value: p.total_value || undefined,
      image: getAssetUrl(p.image_url, p.id),
      proximityHighlights: [
        { icon: 'location', label: p.location },
        { icon: 'status', label: `Status: ${p.status || 'Planning'} (${p.completion_percentage || 0}%)` },
      ],
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name} ${p.location}`)}`,
    }));
  }, [combinedDbProjects]);

  // Referral Hub Flow States
  const [isReferralHubOpen, setIsReferralHubOpen] = useState(false);
  const [referralStep, setReferralStep] = useState<'persona' | 'intro' | 'overview' | 'form' | 'success'>('persona');
  const [selectedPersona, setSelectedPersona] = useState<'investor' | 'new_customer' | 'employee' | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Referral Form States
  const [refereeName, setRefereeName] = useState('');
  const [refereePhone, setRefereePhone] = useState('');
  const [refereeEmail, setRefereeEmail] = useState('');
  const [refereeCity, setRefereeCity] = useState('');
  const [refereeProject, setRefereeProject] = useState('Open to Any Luxury Project');
  const [refereeRelationship, setRefereeRelationship] = useState('Friend / Associate');
  const [refereeNotes, setRefereeNotes] = useState('');
  const [submittingReferral, setSubmittingReferral] = useState(false);
  const [referralRefCode, setReferralRefCode] = useState('');

  // General Enquiry States
  const [enquiryPhone, setEnquiryPhone] = useState(user?.phone || '');
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [siteVisitDate, setSiteVisitDate] = useState('');
  const [submittingEnquiry, setSubmittingEnquiry] = useState(false);

  // Referral Hub Handlers
  const handleStartReferral = () => {
    setSelectedPersona(null);
    setReferralStep('persona');
    setIsReferralHubOpen(true);
  };

  const handleSelectPersona = (persona: 'investor' | 'new_customer' | 'employee') => {
    setSelectedPersona(persona);
    setReferralStep('intro');
  };

  const handleBackStep = () => {
    if (referralStep === 'intro') {
      setReferralStep('persona');
    } else if (referralStep === 'overview') {
      setReferralStep('intro');
    } else if (referralStep === 'form') {
      setReferralStep('overview');
    } else if (referralStep === 'success') {
      setIsReferralHubOpen(false);
    } else {
      setIsReferralHubOpen(false);
    }
  };

  const handleSubmitReferralLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReferral(true);

    try {
      const matchingDbProject = combinedDbProjects.find(p => p.name.toLowerCase().includes(refereeProject.toLowerCase()));
      const projectId = matchingDbProject ? matchingDbProject.id : (combinedDbProjects[0]?.id || 1);
      const generatedCode = `REF-RDH-${Math.floor(100000 + Math.random() * 900000)}`;
      setReferralRefCode(generatedCode);

      const personaLabel = 
        selectedPersona === 'investor' ? 'Existing Customer / Investor' :
        selectedPersona === 'employee' ? 'Employee / Channel Partner' : 'Not a Booked Customer (Exploring)';

      await apiFetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          message: `[REFERRAL LEAD - ${generatedCode}] Referrer: ${user.name} (${user.email}, ${user.phone || 'N/A'}). Category: ${personaLabel}. Referral: ${refereeName}, Phone: ${refereePhone}, Email: ${refereeEmail || 'N/A'}, City: ${refereeCity || 'Bangalore'}. Preferred Project: ${refereeProject}. Relationship: ${refereeRelationship}. Notes: ${refereeNotes || 'Referred via Redhill Referral Circle.'}`,
        })
      });

      setReferralStep('success');
    } catch (err) {
      console.error('Failed to submit referral lead', err);
      const generatedCode = `REF-RDH-${Math.floor(100000 + Math.random() * 900000)}`;
      setReferralRefCode(generatedCode);
      setReferralStep('success');
    } finally {
      setSubmittingReferral(false);
    }
  };

  const handleResetReferralForm = () => {
    setRefereeName('');
    setRefereePhone('');
    setRefereeEmail('');
    setRefereeCity('');
    setRefereeNotes('');
    setReferralStep('form');
  };

  // Filter projects by category (only Admin-created database projects)
  const filteredProjects = selectedCategory === 'all' 
    ? allShowcaseProjects 
    : allShowcaseProjects.filter(p => p.category === selectedCategory);

  const handleSendEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingEnquiry(true);

    try {
      const projectName = selectedProject?.name || 'Redhill Premier Development';
      const matchingDbProject = combinedDbProjects.find(p => p.name.toLowerCase().includes(projectName.toLowerCase()));
      const projectId = matchingDbProject ? matchingDbProject.id : (combinedDbProjects[0]?.id || 1);

      await apiFetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          message: `[Showcase Lead - ${projectName}] Phone: ${enquiryPhone}. Preferred Date: ${siteVisitDate || 'Flexible'}. Notes: ${enquiryMessage || 'Requested detailed brochure and VIP site walkthrough.'}`,
        })
      });

      setShowEnquirySuccess(true);
      setTimeout(() => {
        setShowEnquirySuccess(false);
        setSelectedProject(null);
        setShowSiteVisitModal(false);
        setEnquiryMessage('');
      }, 2500);
    } catch (err) {
      console.error('Failed to submit enquiry', err);
      setShowEnquirySuccess(true);
      setTimeout(() => {
        setShowEnquirySuccess(false);
        setSelectedProject(null);
        setShowSiteVisitModal(false);
      }, 2500);
    } finally {
      setSubmittingEnquiry(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(
      sectionId === 'projects-grid' ? 'projects' :
      sectionId === 'referral-section' ? 'referral' : 'events'
    );
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -85;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const renderSocialIcon = (iconName: string) => {
    switch (iconName) {
      case 'youtube':
        return (
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        );
      case 'linkedin':
        return (
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
          </svg>
        );
      case 'instagram':
        return (
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        );
      case 'facebook':
        return (
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        );
      case 'twitter':
        return (
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        );
      default:
        return <ExternalLink className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-redhill-ivory text-redhill-charcoal selection:bg-redhill-red selection:text-white flex flex-col">
      
      {/* ======================================================== */}
      {/* 1. DESKTOP STICKY TOP NAVIGATION BAR                     */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-redhill-line">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Logo className="scale-105" />
            
            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 bg-redhill-sand p-1 rounded-xs border border-redhill-line">
              <button
                onClick={() => scrollToSection('projects-grid')}
                className={`px-4 py-2 rounded-xs text-xs uppercase tracking-[0.12em] font-medium transition-all cursor-pointer ${
                  activeSection === 'projects' ? 'bg-redhill-charcoal text-white shadow-xs' : 'text-redhill-muted hover:text-redhill-charcoal'
                }`}
              >
                Featured Projects
              </button>
              <button
                onClick={() => scrollToSection('referral-section')}
                className={`px-4 py-2 rounded-xs text-xs uppercase tracking-[0.12em] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSection === 'referral' ? 'bg-redhill-charcoal text-white shadow-xs' : 'text-redhill-muted hover:text-redhill-charcoal'
                }`}
              >
                <Gift className="w-3.5 h-3.5 text-redhill-gold" />
                Refer & Earn
              </button>
              <button
                onClick={() => scrollToSection('events-section')}
                className={`px-4 py-2 rounded-xs text-xs uppercase tracking-[0.12em] font-medium transition-all cursor-pointer ${
                  activeSection === 'events' ? 'bg-redhill-charcoal text-white shadow-xs' : 'text-redhill-muted hover:text-redhill-charcoal'
                }`}
              >
                Events & Conclaves
              </button>
            </nav>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-4">
            {/* Always allow switching back to portfolio dashboard */}
            <button
              onClick={() => {
                if (onNavigateToPortfolio) {
                  onNavigateToPortfolio();
                } else {
                  navigate('/dashboard');
                }
              }}
              className="hidden sm:flex items-center gap-2 btn-secondary py-2 px-3.5 text-xs uppercase tracking-[0.14em]"
            >
              <Building2 className="w-4 h-4 text-redhill-gold" />
              My Portfolio
            </button>

            {/* User Pill */}
            <div className="flex items-center gap-3 bg-white px-3.5 py-1.5 rounded-full border border-redhill-line transition-all">
              <div className="w-7 h-7 rounded-full bg-redhill-charcoal flex items-center justify-center text-white font-medium text-xs">
                {(user?.name || 'I').charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-medium text-redhill-charcoal leading-none">{user?.name || 'Investor'}</p>
                <p className="text-[10px] text-redhill-gold uppercase tracking-[0.16em] mt-0.5">{(user?.role || 'investor').replace('_', ' ')}</p>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-2.5 text-redhill-muted hover:text-redhill-red hover:bg-redhill-sand rounded-xs transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. PC / DESKTOP FULL-BLEED LUXURY HERO BANNER            */}
      {/* ======================================================== */}
      <section className="relative overflow-hidden min-h-[520px] lg:min-h-[580px] flex items-center border-b border-redhill-line">
        {/* Background Image with Ambient Overlays */}
        <div className="absolute inset-0 z-0">
          <img 
            src={SHOWCASE_CONFIG.hero.backgroundImage} 
            alt="Redhill Architectural Horizon" 
            className="w-full h-full object-cover brightness-[0.7] contrast-[1.05] scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-redhill-ivory via-redhill-ivory/95 to-redhill-ivory/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-redhill-ivory via-transparent to-redhill-ivory/30" />
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Headlines & CTAs */}
            <motion.div 
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-8 space-y-6"
            >
              {/* Gold Collection Tag */}
              <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-xs bg-white/95 border border-redhill-line shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-redhill-red" />
                <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-redhill-gold">
                  {SHOWCASE_CONFIG.brand.taglineBadge}
                </span>
              </div>

              {/* Editorial Display Headline */}
              <h1 className="text-[clamp(2.4rem,4.5vw,4.25rem)] font-serif font-light text-redhill-charcoal tracking-tight leading-[1.08]">
                {SHOWCASE_CONFIG.hero.headlinePrefix} <br />
                <span className="text-redhill-gold italic">
                  {SHOWCASE_CONFIG.hero.headlineMain}
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-stone-700 text-sm sm:text-base lg:text-lg max-w-2xl leading-relaxed font-light">
                {SHOWCASE_CONFIG.hero.subheadline}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    const el = document.getElementById('projects-grid');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="btn-primary px-7 py-3.5 text-xs uppercase tracking-[0.14em]"
                >
                  <span>{SHOWCASE_CONFIG.hero.ctaExploreText}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowSiteVisitModal(true)}
                  className="btn-secondary px-7 py-3.5 text-xs uppercase tracking-[0.14em]"
                >
                  <Car className="w-4 h-4 text-redhill-gold" />
                  <span>{SHOWCASE_CONFIG.hero.ctaSiteVisitText}</span>
                </button>
              </div>
            </motion.div>

            {/* Right Column: Social Media Hub & Redhill Highlights Card */}
            <motion.div 
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-4 space-y-4"
            >
              {/* Redhill Premier Badge Card */}
              <div className="lux-card p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-redhill-line">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-redhill-gold font-medium">
                      Official Channels
                    </span>
                    <h3 className="text-sm font-medium text-redhill-charcoal mt-0.5">Connect With Redhill</h3>
                  </div>
                  <div className="w-8 h-8 rounded-xs bg-redhill-sand border border-redhill-line flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-redhill-gold" />
                  </div>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed font-light">
                  Join our official digital channels for weekly drone walkthroughs, architectural progress feeds, and executive launch announcements.
                </p>

                {/* Social Media Circular Handle Buttons */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  {SHOWCASE_CONFIG.socialMediaHandles.map((social) => {
                    return (
                      <a
                        key={social.name}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`${social.name}: ${social.handle}`}
                        className="w-10 h-10 rounded-xs bg-white text-redhill-charcoal hover:bg-redhill-sand hover:text-redhill-red transition-all flex items-center justify-center border border-redhill-line shadow-xs cursor-pointer"
                      >
                        {renderSocialIcon(social.icon)}
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Flagship Spotlight Card (Only shown when Admin has added projects) */}
              {allShowcaseProjects.length > 0 && (
                <div 
                  onClick={() => setSelectedProject(allShowcaseProjects[0])}
                  className="group lux-card lux-card-hover p-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="relative w-16 h-16 rounded-xs overflow-hidden flex-shrink-0 bg-redhill-sand border border-redhill-line">
                      <img 
                        src={allShowcaseProjects[0].image} 
                        alt="Spotlight"
                        className="w-full h-full object-cover img-zoom" 
                      />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[9px] font-medium uppercase tracking-[0.18em] bg-redhill-sand text-redhill-charcoal px-2 py-0.5 rounded-xs border border-redhill-line">
                          Featured Residence
                        </span>
                      </div>
                      <h4 className="text-sm font-medium text-redhill-charcoal font-serif truncate group-hover:text-redhill-gold transition-colors">
                        {allShowcaseProjects[0].name}
                      </h4>
                      <p className="text-[11px] text-redhill-muted truncate mt-0.5">
                        {allShowcaseProjects[0].location}
                      </p>
                    </div>

                    <div className="w-8 h-8 rounded-xs bg-redhill-sand group-hover:bg-redhill-charcoal flex items-center justify-center text-stone-700 group-hover:text-white transition-all flex-shrink-0">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. FEATURED REDHILL PROJECTS SHOWCASE (Desktop Grid)     */}
      {/* ======================================================== */}
      <section id="projects-grid" className="py-16 sm:py-20 bg-white border-t border-redhill-line flex-1">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Section Header with Category Filters */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-5 border-b border-redhill-line">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-6 h-px bg-redhill-gold" />
                <span className="eyebrow text-redhill-gold">
                  Boutique Residential Portfolio · Bengaluru
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-normal text-redhill-charcoal tracking-tight">
                Redhill Residential Developments
              </h2>
              <p className="text-redhill-muted text-sm mt-1 max-w-xl font-light">
                Explore active residential communities developed and managed by Redhill Infrastructure.
              </p>
            </div>

            {allShowcaseProjects.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: 'All Developments', count: allShowcaseProjects.length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedCategory(tab.id)}
                    className={`px-4 py-2 rounded-xs text-xs uppercase tracking-[0.14em] font-medium transition-all flex items-center gap-2 cursor-pointer border ${
                      selectedCategory === tab.id
                        ? 'bg-redhill-charcoal text-white border-redhill-charcoal shadow-xs'
                        : 'bg-white text-stone-700 hover:text-redhill-charcoal border-redhill-line hover:border-redhill-stone'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-xs tabular font-medium ${
                      selectedCategory === tab.id ? 'bg-white/20 text-white' : 'bg-redhill-sand text-redhill-muted'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Project Cards Grid or Empty State when no Admin projects exist */}
          {filteredProjects.length === 0 ? (
            <div className="rounded-xs border border-redhill-line bg-redhill-ivory p-10 sm:p-14 text-center max-w-2xl mx-auto space-y-3">
              <div className="w-12 h-12 rounded-xs bg-white border border-redhill-line flex items-center justify-center mx-auto text-redhill-gold">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-normal text-redhill-charcoal font-serif">
                No Developments Published Yet
              </h3>
              <p className="text-xs sm:text-sm text-redhill-muted leading-relaxed font-light">
                New residential developments added by the Redhill administration will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project, idx) => (
                <motion.article
                  key={project.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="group lux-card lux-card-hover overflow-hidden flex flex-col h-full"
                >
                  {/* Project Image Container */}
                  <div className="relative h-64 overflow-hidden bg-redhill-sand">
                    <img 
                      src={project.image} 
                      alt={project.name}
                      className="w-full h-full object-cover img-zoom"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Top-Left Status Ribbon */}
                    <div className="absolute top-3.5 left-3.5 bg-white/95 backdrop-blur-xs text-redhill-charcoal font-medium text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 rounded-xs border border-stone-200/80 shadow-xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-redhill-red" />
                      <span>{project.badge}</span>
                    </div>

                    {/* Price / Value Overlay */}
                    <div className="absolute bottom-3.5 left-4 right-4">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-white/70 block">Starting Valuation</span>
                      <span className="font-serif text-xl font-medium text-white tabular drop-shadow-xs">{project.priceStarting}</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4 bg-white">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-redhill-gold text-xs uppercase tracking-[0.14em] font-medium">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{project.location}</span>
                      </div>

                      <h3 className="text-2xl font-normal text-redhill-charcoal group-hover:text-redhill-gold transition-colors leading-tight font-serif">
                        {project.name}
                      </h3>
                      
                      <p className="text-xs text-redhill-muted font-light">
                        {project.configuration} · {project.carpetArea}
                      </p>

                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed font-light pt-1">
                        {project.description}
                      </p>
                    </div>

                    {/* Highlights Pills */}
                    <div className="space-y-1.5 pt-3 border-t border-redhill-line">
                      {project.highlights.slice(0, 2).map((h, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-stone-700 font-light">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                          <span className="truncate">{h}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2.5 pt-2">
                      <button
                        onClick={() => {
                          setSelectedProject(project);
                          setActivePhotoIdx(0);
                        }}
                        className="btn-secondary py-2.5 px-3 text-xs uppercase tracking-[0.12em]"
                      >
                        <Camera className="w-3.5 h-3.5 text-redhill-gold" />
                        <span>Overview</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProject(project);
                          setActivePhotoIdx(0);
                          setShowSiteVisitModal(true);
                        }}
                        className="btn-primary py-2.5 px-3 text-xs uppercase tracking-[0.12em]"
                      >
                        <span>Book Visit</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* ======================================================== */}
      {/* 3.5 STRATEGIC INFRASTRUCTURE & LOCATION MATRIX MAP       */}
      {/* ======================================================== */}
      {mapProjects.length > 0 && (
        <section id="infrastructure-map-section" className="py-16 bg-redhill-ivory border-t border-redhill-line">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-700 text-xs font-bold border border-amber-500/20">
                <Compass className="w-3.5 h-3.5 text-amber-700" />
                <span>Bengaluru Strategic Growth Corridors</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-redhill-charcoal font-serif tracking-tight">
                Interactive Asset & Connectivity Map
              </h2>
              <p className="text-redhill-muted text-sm sm:text-base leading-relaxed">
                Explore the prime geographical positioning of Redhill developments across Bengaluru's prime residential sectors.
              </p>
            </div>

            <InteractiveMap
              projects={mapProjects}
              onBookSiteVisit={(mapProj) => {
                const matchedShowcase = allShowcaseProjects.find(p => String(p.id) === String(mapProj.id) || p.name.toLowerCase().includes(mapProj.name.toLowerCase()));
                if (matchedShowcase) {
                  setSelectedProject(matchedShowcase);
                }
                setShowSiteVisitModal(true);
              }}
            />
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 4. REDHILL LUXURY REFERRAL SPOTLIGHT (Desktop Banner)    */}
      {/* ======================================================== */}
      <section id="referral-section" className="py-16 sm:py-20 bg-white border-t border-redhill-line">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-xs overflow-hidden bg-redhill-ivory border border-redhill-line p-8 sm:p-12 shadow-sm">
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="w-6 h-px bg-redhill-gold" />
                  <span className="eyebrow text-redhill-gold">
                    Client Referral Privilege
                  </span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-serif font-normal text-redhill-charcoal tracking-tight">
                  {SHOWCASE_CONFIG.referral.headline}
                </h2>

                <p className="text-stone-700 text-sm sm:text-base leading-relaxed max-w-xl font-light">
                  {SHOWCASE_CONFIG.referral.subtitle}
                </p>

                {/* Steps Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                  {SHOWCASE_CONFIG.referral.steps.map((st, i) => (
                    <div key={i} className="bg-white rounded-xs p-4 border border-redhill-line">
                      <span className="text-redhill-gold font-serif text-lg font-medium">{st.step}</span>
                      <h4 className="text-xs uppercase tracking-[0.12em] font-medium text-redhill-charcoal mt-1">{st.title}</h4>
                      <p className="text-[11px] text-redhill-muted mt-1 leading-relaxed font-light">{st.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Direct "Refer Here" Action Panel */}
              <div className="lg:col-span-5 lux-card p-6 sm:p-8 space-y-4">
                <div className="pb-3 border-b border-redhill-line">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-redhill-gold font-medium block">Advisory Reward Tier</span>
                  <span className="font-serif text-2xl font-normal text-redhill-charcoal mt-1 block">₹50,000 – ₹3,00,000 INR</span>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed font-light">
                  Introduce acquaintances and business associates in three seamless stages. Our private relationship desk coordinates private previews, architectural walk-throughs, and priority booking allocations.
                </p>

                {/* Primary CTA Button */}
                <div className="space-y-2.5 pt-2">
                  <button
                    onClick={handleStartReferral}
                    className="btn-primary w-full py-3.5 text-xs uppercase tracking-[0.14em]"
                  >
                    <Gift className="w-4 h-4 text-redhill-gold-soft" />
                    <span>Initiate Client Referral</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setShowTermsModal(true)}
                    className="btn-secondary w-full py-3 text-xs uppercase tracking-[0.12em]"
                  >
                    <FileText className="w-3.5 h-3.5 text-redhill-gold" />
                    <span>Program Terms &amp; Guidelines</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. UPCOMING EVENTS & CONCLAVES                           */}
      {/* ======================================================== */}
      <section id="events-section" className="py-16 sm:py-20 bg-redhill-ivory border-t border-redhill-line">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-redhill-line">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-6 h-px bg-redhill-gold" />
                <span className="eyebrow text-redhill-gold">
                  Private Gatherings · By Invitation
                </span>
              </div>
              <h2 className="text-3xl font-serif font-normal text-redhill-charcoal tracking-tight">
                Upcoming Investor Events &amp; Project Walkthroughs
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SHOWCASE_CONFIG.events.map((evt) => (
              <div 
                key={evt.id}
                className="lux-card lux-card-hover p-6 sm:p-7 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium uppercase tracking-[0.2em] bg-redhill-sand text-redhill-charcoal px-2.5 py-1 rounded-xs border border-redhill-line">
                      {evt.tag}
                    </span>
                    <span className="text-xs text-redhill-muted flex items-center gap-1.5 font-light">
                      <Clock className="w-3.5 h-3.5 text-redhill-gold" />
                      {evt.date}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-serif font-normal text-redhill-charcoal">{evt.title}</h3>
                  
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-light">{evt.desc}</p>

                  <div className="flex items-center gap-2 text-xs text-redhill-charcoal pt-1">
                    <MapPin className="w-4 h-4 text-redhill-gold" />
                    <span>{evt.location}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-redhill-line">
                  <button
                    onClick={() => alert(`RSVP registered for "${evt.title}". Our concierge will send your digital invite badge to ${user.email}.`)}
                    className="btn-secondary w-full py-3 text-xs uppercase tracking-[0.14em]"
                  >
                    <Calendar className="w-4 h-4 text-redhill-gold" />
                    <span>Reserve Guest Admission</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. FOOTER                                                */}
      {/* ======================================================== */}
      <footer className="bg-white border-t border-redhill-line py-12 text-redhill-muted text-xs">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <Logo className="scale-95" />
          <p>© 2026 Redhill Infrastructure Pvt Ltd. All rights reserved. RERA Registered.</p>
          <div className="flex items-center gap-4 text-redhill-muted">
            {SHOWCASE_CONFIG.socialMediaHandles.map((s) => (
              <a 
                key={s.name} 
                href={s.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-redhill-charcoal transition-colors"
                title={s.name}
              >
                {renderSocialIcon(s.icon)}
              </a>
            ))}
          </div>
        </div>
      </footer>

      {/* ======================================================== */}
      {/* 8. PROJECT DETAILS MODAL WITH DEMO PHOTO GALLERY         */}
      {/* ======================================================== */}
      <AnimatePresence>
        {selectedProject && (() => {
          const currentGallery = selectedProject.gallery && selectedProject.gallery.length > 0 
            ? selectedProject.gallery 
            : [{ url: selectedProject.image, title: selectedProject.name, tag: 'Overview' }];
          const currentPhoto = currentGallery[activePhotoIdx] || currentGallery[0];

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white rounded-[4px] max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-redhill-line shadow-2xl text-redhill-charcoal relative custom-scrollbar"
              >
                {/* Modal Banner & Interactive Demo Photo Carousel */}
                <div className="relative h-80 sm:h-96 w-full overflow-hidden bg-redhill-ink group">
                  <motion.img 
                    key={currentPhoto.url}
                    initial={{ opacity: 0.7, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    src={currentPhoto.url} 
                    alt={currentPhoto.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/30" />

                  {/* Top-Left Tag & Badges */}
                  <div className="absolute top-4 left-5 flex items-center gap-2 z-10">
                    <span className="bg-white/95 text-redhill-charcoal font-medium text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 rounded-xs shadow-xs border border-stone-200/80">
                      {selectedProject.badge}
                    </span>
                    <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium uppercase tracking-[0.16em] px-2.5 py-1 rounded-xs border border-white/20 flex items-center gap-1.5 shadow-xs">
                      <Camera className="w-3 h-3 text-redhill-gold-soft" />
                      {currentPhoto.tag}
                    </span>
                  </div>

                  {/* Top-Center Photo Counter */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-xs px-3 py-1 rounded-xs text-[11px] font-mono font-medium text-white/90 border border-white/20 shadow-xs z-10">
                    {activePhotoIdx + 1} / {currentGallery.length}
                  </div>

                  {/* Close Modal Button */}
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="absolute top-4 right-4 w-9 h-9 rounded-xs bg-black/60 hover:bg-redhill-charcoal text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20 z-10 shadow-xs"
                    title="Close preview"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Previous / Next Arrow Controls */}
                  {currentGallery.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : currentGallery.length - 1));
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xs bg-black/60 hover:bg-redhill-charcoal text-white flex items-center justify-center transition-all border border-white/20 cursor-pointer shadow-md z-10"
                        title="Previous Photo"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePhotoIdx((prev) => (prev < currentGallery.length - 1 ? prev + 1 : 0));
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xs bg-black/60 hover:bg-redhill-charcoal text-white flex items-center justify-center transition-all border border-white/20 cursor-pointer shadow-md z-10"
                        title="Next Photo"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Bottom Info Banner on Image */}
                  <div className="absolute bottom-4 left-6 right-6 z-10">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-redhill-gold-soft font-medium mb-1">
                      {selectedProject.location}
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-serif font-normal text-white">{selectedProject.name}</h3>
                  </div>
                </div>

                {/* Interactive Clickable Thumbnail Strip */}
                {currentGallery.length > 1 && (
                  <div className="bg-redhill-ivory px-6 py-3 border-b border-redhill-line flex items-center gap-2.5 overflow-x-auto">
                    <span className="text-[10px] font-medium text-redhill-muted uppercase tracking-[0.18em] flex-shrink-0 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-redhill-gold" />
                      Gallery:
                    </span>
                    {currentGallery.map((item, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => setActivePhotoIdx(pIdx)}
                        className={`relative rounded-xs overflow-hidden flex-shrink-0 h-14 w-20 border transition-all cursor-pointer ${
                          activePhotoIdx === pIdx 
                            ? 'border-redhill-charcoal ring-1 ring-redhill-charcoal' 
                            : 'border-redhill-line opacity-60 hover:opacity-100 hover:border-redhill-stone'
                        }`}
                      >
                        <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0.5 left-1 text-[8px] font-medium uppercase tracking-wider text-white bg-black/70 px-1 rounded-xs truncate max-w-[90%]">
                          {item.tag}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Modal Content */}
                <div className="p-6 sm:p-8 space-y-6">
                  
                  {/* Specs Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-redhill-ivory p-3.5 rounded-xs border border-redhill-line">
                      <span className="text-[10px] text-redhill-muted uppercase tracking-[0.14em] block">Valuation</span>
                      <span className="font-serif text-base font-medium text-redhill-charcoal mt-0.5 block">{selectedProject.priceStarting}</span>
                    </div>
                    <div className="bg-redhill-ivory p-3.5 rounded-xs border border-redhill-line">
                      <span className="text-[10px] text-redhill-muted uppercase tracking-[0.14em] block">Configuration</span>
                      <span className="text-xs font-medium text-redhill-charcoal mt-1 block">{selectedProject.configuration}</span>
                    </div>
                    <div className="bg-redhill-ivory p-3.5 rounded-xs border border-redhill-line">
                      <span className="text-[10px] text-redhill-muted uppercase tracking-[0.14em] block">Allotted Area</span>
                      <span className="text-xs font-medium text-redhill-charcoal mt-1 block">{selectedProject.carpetArea}</span>
                    </div>
                    <div className="bg-redhill-ivory p-3.5 rounded-xs border border-redhill-line">
                      <span className="text-[10px] text-redhill-muted uppercase tracking-[0.14em] block">Possession</span>
                      <span className="text-xs font-medium text-emerald-800 mt-1 block">{selectedProject.possessionDate}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-[11px] uppercase tracking-[0.18em] font-medium text-redhill-muted mb-2">Project Overview</h4>
                    <p className="text-sm text-stone-700 leading-relaxed font-light">{selectedProject.description}</p>
                  </div>

                  {/* Highlights */}
                  <div>
                    <h4 className="text-[11px] uppercase tracking-[0.18em] font-medium text-redhill-muted mb-3">Signature Architectural Features</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedProject.highlights.map((hl, i) => (
                        <div key={i} className="flex items-center gap-2.5 bg-redhill-ivory p-3 rounded-xs border border-redhill-line text-xs text-redhill-charcoal font-light">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                          <span>{hl}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                {/* Enquiry & Site Visit Form */}
                <form onSubmit={handleSendEnquiry} className="pt-5 border-t border-redhill-line space-y-4">
                  <h4 className="text-sm font-medium text-redhill-charcoal flex items-center gap-2 font-serif text-lg">
                    <Car className="w-4 h-4 text-redhill-gold" />
                    Book Private Site Tour / Request Dossier
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input 
                      type="tel" 
                      value={enquiryPhone}
                      onChange={(e) => setEnquiryPhone(e.target.value)}
                      placeholder="Your Mobile (+91 ...)"
                      className="field text-xs"
                      required
                    />
                    <input 
                      type="date" 
                      value={siteVisitDate}
                      onChange={(e) => setSiteVisitDate(e.target.value)}
                      className="field text-xs"
                    />
                  </div>

                  <input 
                    type="text" 
                    value={enquiryMessage}
                    onChange={(e) => setEnquiryMessage(e.target.value)}
                    placeholder="Specific questions or custom requirements?"
                    className="field text-xs"
                  />

                  {showEnquirySuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xs text-xs font-medium flex items-center gap-2">
                      <Check className="w-4 h-4" /> Thank you. Your inquiry has been submitted to the Redhill concierge.
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={submittingEnquiry}
                      className="btn-primary flex-1 py-3 text-xs uppercase tracking-[0.14em]"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {submittingEnquiry ? 'Submitting...' : 'Schedule Site Tour'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedProject(null)}
                      className="btn-secondary py-3 px-6 text-xs uppercase tracking-[0.14em]"
                    >
                      Close
                    </button>
                  </div>
                </form>

              </div>
            </motion.div>
          </div>
          );
        })()}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 9. SITE VISIT & ENQUIRY MODAL                            */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showSiteVisitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-[4px] max-w-md w-full p-6 sm:p-8 border border-redhill-line text-redhill-charcoal relative shadow-2xl space-y-5"
            >
              <button
                onClick={() => setShowSiteVisitModal(false)}
                className="absolute top-4 right-4 text-redhill-muted hover:text-redhill-charcoal transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1.5 text-center">
                <div className="w-10 h-10 bg-redhill-sand border border-redhill-line rounded-xs flex items-center justify-center mx-auto text-redhill-charcoal">
                  <Car className="w-5 h-5 text-redhill-gold" />
                </div>
                <h3 className="text-xl font-normal text-redhill-charcoal font-serif">Book Property Walkthrough</h3>
                <p className="text-xs text-redhill-muted font-light">
                  Enjoy complimentary pickup and guided preview across our Bangalore flagship properties.
                </p>
              </div>

              <form onSubmit={handleSendEnquiry} className="space-y-3">
                <div>
                  <label className="field-label mb-1">Contact Phone</label>
                  <input 
                    type="tel"
                    value={enquiryPhone}
                    onChange={(e) => setEnquiryPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="field text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="field-label mb-1">Preferred Date</label>
                  <input 
                    type="date"
                    value={siteVisitDate}
                    onChange={(e) => setSiteVisitDate(e.target.value)}
                    className="field text-xs"
                  />
                </div>

                {showEnquirySuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4" /> Tour booked! Our team will connect with you.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submittingEnquiry}
                  className="btn-primary w-full py-3.5 text-xs uppercase tracking-[0.14em]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingEnquiry ? 'Submitting...' : 'Confirm Appointment'}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 10. DEDICATED REDHILL REFERRAL HUB (Multi-Step Flow)     */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isReferralHubOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="bg-white rounded-3xl max-w-2xl w-full border border-redhill-line text-redhill-charcoal relative shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
            >
              {/* Hub Sticky Top Header Navigation */}
              <div className="px-6 py-4 border-b border-redhill-line bg-redhill-sand-deep backdrop-blur flex items-center justify-between shrink-0">
                <button
                  onClick={handleBackStep}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-redhill-sand/70 hover:bg-redhill-sand text-xs font-bold text-redhill-charcoal transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-redhill-red" />
                  <span>Back</span>
                </button>

                <div className="flex items-center gap-2">
                  <Logo className="scale-85" />
                  <span className="hidden sm:inline-block text-[10px] uppercase tracking-widest font-black text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Referral Circle
                  </span>
                </div>

                <button
                  onClick={() => setIsReferralHubOpen(false)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-redhill-sand/70 hover:bg-redhill-sand text-xs font-bold text-redhill-charcoal transition-all cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5 text-amber-700" />
                  <span>Home</span>
                </button>
              </div>

              {/* Hub Body */}
              <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">

                {/* STEP 1: Persona Selection ("What describes you the best?") */}
                {referralStep === 'persona' && (
                  <motion.div
                    key="step-persona"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6 text-center py-4"
                  >
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-redhill-red bg-redhill-red/10 px-3 py-1 rounded-full border border-redhill-red/20">
                        Step 1 of 3
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-redhill-charcoal tracking-tight font-serif pt-1">
                        What describes you the best?
                      </h3>
                      <p className="text-xs sm:text-sm text-redhill-muted max-w-md mx-auto">
                        Select your relationship with Redhill Infra to personalize your referral rewards program.
                      </p>
                    </div>

                    {/* Persona Options (Inspired by Screenshot 1 with Redhill Theme) */}
                    <div className="space-y-3.5 max-w-lg mx-auto pt-2">
                      <button
                        onClick={() => handleSelectPersona('investor')}
                        className="w-full text-left p-5 rounded-2xl bg-[#FBF9F5] hover:bg-redhill-sand border border-redhill-line hover:border-amber-500/50 transition-all duration-300 group flex items-center justify-between shadow-lg cursor-pointer hover:scale-[1.02]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-gray-950 transition-colors">
                            <Building2 className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-sm sm:text-base font-bold text-redhill-charcoal group-hover:text-amber-700 transition-colors">
                              I am an Existing Customer / Investor
                            </h4>
                            <p className="text-xs text-redhill-muted mt-0.5">
                              I own or have active investments in Redhill properties
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-stone-500 group-hover:text-amber-700 group-hover:translate-x-1 transition-all shrink-0" />
                      </button>

                      <button
                        onClick={() => handleSelectPersona('new_customer')}
                        className="w-full text-left p-5 rounded-2xl bg-[#FBF9F5] hover:bg-redhill-sand border border-redhill-line hover:border-redhill-red/50 transition-all duration-300 group flex items-center justify-between shadow-lg cursor-pointer hover:scale-[1.02]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-redhill-red/10 border border-redhill-red/20 text-redhill-red flex items-center justify-center shrink-0 group-hover:bg-redhill-red group-hover:text-white transition-colors">
                            <Users className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-sm sm:text-base font-bold text-redhill-charcoal group-hover:text-red-700 transition-colors">
                              I am not a booked Customer of Redhill
                            </h4>
                            <p className="text-xs text-redhill-muted mt-0.5">
                              I am exploring or introducing friends & family to Redhill
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-stone-500 group-hover:text-redhill-red group-hover:translate-x-1 transition-all shrink-0" />
                      </button>

                      <button
                        onClick={() => handleSelectPersona('employee')}
                        className="w-full text-left p-5 rounded-2xl bg-[#FBF9F5] hover:bg-redhill-sand border border-redhill-line hover:border-emerald-500/50 transition-all duration-300 group flex items-center justify-between shadow-lg cursor-pointer hover:scale-[1.02]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-gray-950 transition-colors">
                            <Briefcase className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-sm sm:text-base font-bold text-redhill-charcoal group-hover:text-emerald-700 transition-colors">
                              I am an Employee / Channel Partner
                            </h4>
                            <p className="text-xs text-redhill-muted mt-0.5">
                              Official Redhill associate or registered brokerage network
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-stone-500 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all shrink-0" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Welcome / Intro Proposition (Inspired by Screenshot 2) */}
                {referralStep === 'intro' && (
                  <motion.div
                    key="step-intro"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8 text-center py-6"
                  >
                    {/* Glowing Prestige Gift Box Visual */}
                    <div className="relative mx-auto w-32 h-32 rounded-3xl bg-redhill-sand border border-amber-500/30 flex items-center justify-center shadow-2xl">
                      <div className="absolute inset-0 bg-amber-500/10 rounded-3xl blur-xl" />
                      <Gift className="w-16 h-16 text-amber-700 drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
                    </div>

                    <div className="space-y-3 max-w-lg mx-auto">
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-redhill-charcoal tracking-tight font-serif leading-snug">
                        Go on, Introduce your loved ones to the world of Redhill Premier Living.
                      </h3>
                      <p className="text-sm text-stone-700 leading-relaxed">
                        Refer your friends and family and earn anywhere between{' '}
                        <span className="text-amber-700 font-extrabold">₹50,000 – ₹3,00,000 INR</span>.
                      </p>
                    </div>

                    <div className="pt-4 max-w-xs mx-auto space-y-3">
                      <button
                        onClick={() => setReferralStep('overview')}
                        className="w-full bg-white text-gray-950 hover:bg-gray-100 font-extrabold py-3.5 px-6 rounded-2xl text-sm transition-all shadow-xl hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Overview & "Making Referrals Easy" (Inspired by Screenshot 5 & 3) */}
                {referralStep === 'overview' && (
                  <motion.div
                    key="step-overview"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Header Payout Banner */}
                    <div className="text-center space-y-2 pb-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-redhill-muted">
                        Refer your friends and family and earn anywhere between
                      </p>
                      <h3 className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight font-sans">
                        ₹50,000 – ₹3,00,000 INR
                      </h3>
                    </div>

                    {/* Section: Making Referrals Easy */}
                    <div className="space-y-3">
                      <h4 className="text-xs uppercase tracking-wider font-bold text-redhill-muted">
                        Making Referrals Easy
                      </h4>

                      <div className="space-y-3">
                        {/* 1. Submit Referral */}
                        <div className="bg-[#FBF9F5] p-4 rounded-2xl border border-redhill-line flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                            <Search className="w-6 h-6" />
                          </div>
                          <div>
                            <h5 className="text-sm font-bold text-redhill-charcoal">Submit Referral</h5>
                            <p className="text-xs text-redhill-muted mt-0.5 leading-relaxed">
                              Introduce your loved ones to your community and signature developments.
                            </p>
                          </div>
                        </div>

                        {/* 2. Track Referral */}
                        <div className="bg-[#FBF9F5] p-4 rounded-2xl border border-redhill-line flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-redhill-red/10 border border-redhill-red/20 text-redhill-red flex items-center justify-center shrink-0">
                            <UserCheck className="w-6 h-6" />
                          </div>
                          <div>
                            <h5 className="text-sm font-bold text-redhill-charcoal">Track Referral</h5>
                            <p className="text-xs text-redhill-muted mt-0.5 leading-relaxed">
                              Wait for them to complete their guided property walkthrough, booking & registration.
                            </p>
                          </div>
                        </div>

                        {/* 3. Get Rewarded */}
                        <div className="bg-[#FBF9F5] p-4 rounded-2xl border border-redhill-line flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center shrink-0">
                            <Coins className="w-6 h-6" />
                          </div>
                          <div>
                            <h5 className="text-sm font-bold text-redhill-charcoal">Get Rewarded</h5>
                            <p className="text-xs text-redhill-muted mt-0.5 leading-relaxed">
                              Receive your referral reward within 30-60 days post agreement signing and 10% of property value paid.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 pt-2">
                      <button
                        onClick={() => setReferralStep('form')}
                        className="w-full bg-[#0E3557] hover:bg-[#134470] text-redhill-charcoal font-extrabold py-4 px-6 rounded-2xl text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#0E3557]/40 cursor-pointer hover:scale-[1.02]"
                      >
                        <span>Add a Referral</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      <div className="text-center">
                        <button
                          onClick={() => setShowTermsModal(true)}
                          className="text-xs text-amber-700 hover:text-amber-700 font-bold underline underline-offset-4 cursor-pointer"
                        >
                          View Referral Terms & Conditions (T&C)
                        </button>
                      </div>
                    </div>

                    {/* Footer Quote */}
                    <p className="text-center text-xs italic text-redhill-muted pt-2">
                      "Together as One. Move into the circle of trust."
                    </p>
                  </motion.div>
                )}

                {/* STEP 4: Referral Submission Form */}
                {referralStep === 'form' && (
                  <motion.div
                    key="step-form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-redhill-red bg-redhill-red/10 px-3 py-1 rounded-full border border-redhill-red/20">
                        Referral Form
                      </span>
                      <h3 className="text-2xl font-extrabold text-redhill-charcoal tracking-tight font-serif mt-1">
                        Add a Referral Lead
                      </h3>
                      <p className="text-xs text-redhill-muted mt-0.5">
                        Please provide your contact's details. Our private wealth manager will connect with tailored courtesies.
                      </p>
                    </div>

                    <form onSubmit={handleSubmitReferralLead} className="space-y-4">
                      {/* Referrer Info Banner */}
                      <div className="p-3 bg-[#FBF9F5] rounded-xl border border-redhill-line flex items-center justify-between text-xs text-stone-700">
                        <span>Referring As: <strong className="text-redhill-charcoal">{user.name}</strong></span>
                        <span className="text-amber-700 font-mono text-[11px] uppercase">
                          {selectedPersona === 'investor' ? 'Investor' : selectedPersona === 'employee' ? 'Partner/Employee' : 'Patron'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider font-bold text-redhill-muted block mb-1">
                            Referee Full Name *
                          </label>
                          <input 
                            type="text"
                            value={refereeName}
                            onChange={(e) => setRefereeName(e.target.value)}
                            placeholder="e.g. Rajesh Malhotra"
                            className="field text-xs"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[10px] uppercase tracking-wider font-bold text-redhill-muted block mb-1">
                            Mobile Number (+91) *
                          </label>
                          <input 
                            type="tel"
                            value={refereePhone}
                            onChange={(e) => setRefereePhone(e.target.value)}
                            placeholder="+91 98765 43210"
                            className="field text-xs"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider font-bold text-redhill-muted block mb-1">
                            Email Address (Optional)
                          </label>
                          <input 
                            type="email"
                            value={refereeEmail}
                            onChange={(e) => setRefereeEmail(e.target.value)}
                            placeholder="rajesh@example.com"
                            className="field text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] uppercase tracking-wider font-bold text-redhill-muted block mb-1">
                            City of Residence
                          </label>
                          <input 
                            type="text"
                            value={refereeCity}
                            onChange={(e) => setRefereeCity(e.target.value)}
                            placeholder="Bangalore, Mumbai, NRI..."
                            className="field text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider font-bold text-redhill-muted block mb-1">
                            Preferred Development
                          </label>
                          <select
                            value={refereeProject}
                            onChange={(e) => setRefereeProject(e.target.value)}
                            className="w-full text-xs p-3.5 rounded-xl bg-white border border-redhill-line text-redhill-charcoal outline-none focus:ring-2 focus:ring-redhill-red/30"
                          >
                            {allShowcaseProjects.map((proj) => (
                              <option key={proj.id} value={proj.name}>
                                {proj.name} ({proj.location})
                              </option>
                            ))}
                            <option value="Open to Any Luxury Project">Open to Recommendations</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase tracking-wider font-bold text-redhill-muted block mb-1">
                            Relationship
                          </label>
                          <select
                            value={refereeRelationship}
                            onChange={(e) => setRefereeRelationship(e.target.value)}
                            className="w-full text-xs p-3.5 rounded-xl bg-white border border-redhill-line text-redhill-charcoal outline-none focus:ring-2 focus:ring-redhill-red/30"
                          >
                            <option value="Family Member">Family Member</option>
                            <option value="Friend">Friend</option>
                            <option value="Business Colleague">Business Colleague / Associate</option>
                            <option value="Neighbour">Neighbour / Acquaintance</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-wider font-bold text-redhill-muted block mb-1">
                          Personal Notes / Requirements (Optional)
                        </label>
                        <input 
                          type="text"
                          value={refereeNotes}
                          onChange={(e) => setRefereeNotes(e.target.value)}
                          placeholder="e.g. Looking for a 3 BHK duplex facing pool; flexible timeline"
                          className="field text-xs"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={submittingReferral}
                          className="w-full bg-redhill-red hover:bg-redhill-crimson hover:brightness-110 text-white font-extrabold py-4 px-6 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xl  cursor-pointer disabled:opacity-60"
                        >
                          <Send className="w-4 h-4" />
                          {submittingReferral ? 'Registering Lead...' : 'Submit Referral Lead'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* STEP 5: Success & Confirmation */}
                {referralStep === 'success' && (
                  <motion.div
                    key="step-success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-6 py-6"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center mx-auto shadow-xl">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>

                    <div className="space-y-2 max-w-md mx-auto">
                      <h3 className="text-2xl font-extrabold text-redhill-charcoal font-serif">
                        Referral Registered Successfully!
                      </h3>
                      <p className="text-xs text-stone-700">
                        Your referral has been assigned to our senior client relationship desk. We will arrange a private site walkthrough with VIP courtesies.
                      </p>
                    </div>

                    <div className="bg-redhill-sand/70 p-4 rounded-2xl border border-redhill-line max-w-sm mx-auto space-y-1">
                      <span className="text-[10px] text-redhill-muted uppercase font-bold tracking-widest block">
                        Tracking Reference Code
                      </span>
                      <span className="text-lg font-mono font-black text-amber-700">
                        {referralRefCode || 'REF-RDH-2026-88192'}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto pt-2">
                      <button
                        onClick={handleResetReferralForm}
                        className="flex-1 bg-redhill-sand hover:bg-redhill-sand text-redhill-charcoal font-bold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Refer Another Person
                      </button>
                      <button
                        onClick={() => setIsReferralHubOpen(false)}
                        className="flex-1 bg-redhill-red hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-lg "
                      >
                        Done & Return
                      </button>
                    </div>
                  </motion.div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 11. REFERRAL PROGRAM TERMS & CONDITIONS MODAL (T&C)       */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showTermsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="bg-[#1A1E29] rounded-3xl max-w-xl w-full max-h-[85vh] overflow-y-auto border border-redhill-line text-redhill-charcoal relative shadow-2xl p-6 sm:p-8 space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-redhill-line pb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-redhill-charcoal font-serif">Referral T&C</h3>
                  <p className="text-xs text-redhill-muted">Important Program Terms & Guidelines</p>
                </div>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="w-8 h-8 rounded-full bg-redhill-sand/70 hover:bg-redhill-red text-stone-700 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* T&C Content (Directly matching user's Screenshots 3 & 4 with Redhill adaptation) */}
              <div className="space-y-6 text-xs text-stone-700 leading-relaxed">
                
                {/* Cases Applicable */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-redhill-charcoal flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    Case where referral rewards are applicable:
                  </h4>
                  <ol className="space-y-1.5 list-decimal list-inside text-stone-700 pl-1">
                    <li>
                      When the referral leads are submitted only:
                      <ul className="list-disc list-inside pl-4 text-redhill-muted mt-1">
                        <li>Via this web application / portal</li>
                        <li>Via official Redhill Referral Form submission</li>
                      </ul>
                    </li>
                    <li>
                      The referral lead (aka Referred) must mention the Referrer info:
                      <ul className="list-disc list-inside pl-4 text-redhill-muted mt-1">
                        <li>At the project site during client registration</li>
                        <li>While filling their Booking Application Form</li>
                      </ul>
                    </li>
                    <li>
                      Disbursement is credited within 30-60 days post formal agreement signing and 10% of total property value paid.
                    </li>
                  </ol>
                </div>

                {/* Cases NOT Applicable */}
                <div className="space-y-2 pt-2 border-t border-redhill-line">
                  <h4 className="text-sm font-bold text-redhill-charcoal flex items-center gap-1.5 text-red-700">
                    <X className="w-4 h-4 text-red-700 shrink-0" />
                    Case where referral rewards are NOT applicable:
                  </h4>
                  <ol className="space-y-1.5 list-decimal list-inside text-stone-700 pl-1">
                    <li>If the Referred (referral lead) has already submitted an inquiry directly in Redhill database in the past 60 days.</li>
                    <li>If the referral lead was received via other third-party channel partner / brokerage sources.</li>
                    <li>Referral lead given using alternate contact info of an existing client in the system.</li>
                    <li>If the referred decides to forego the referral reward or opts out of referral program.</li>
                    <li>If the referred cancels the booking prior to registration.</li>
                  </ol>
                </div>

                {/* Legal Disclaimer */}
                <div className="p-3.5 bg-[#FBF9F5] rounded-xl border border-redhill-line text-[11px] text-redhill-muted italic">
                  Redhill Infrastructure Pvt Ltd reserves the right to modify the rules and policies related to this program at any time in accordance with RERA guidelines.
                </div>
              </div>

              {/* Crimson "Understood" Button */}
              <div className="pt-2">
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="w-full bg-[#C2182B] hover:bg-[#A01423] text-redhill-charcoal font-extrabold py-3.5 px-6 rounded-2xl text-xs sm:text-sm transition-all shadow-xl  cursor-pointer"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
