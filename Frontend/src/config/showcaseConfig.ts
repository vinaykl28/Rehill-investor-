import heroBiophilicImg from '../assets/hero-biophilic.jpg';

/**
 * Redhill Infra Showcase & Explorer Configuration
 * 
 * Customize your social media handles, hero taglines, brand highlights,
 * and featured projects here.
 */

export interface SocialLink {
  name: string;
  url: string;
  icon: 'youtube' | 'linkedin' | 'instagram' | 'facebook' | 'twitter';
  ariaLabel: string;
  handle: string;
}

export interface ShowcaseProjectGalleryItem {
  url: string;
  title: string;
  tag: string;
}

export interface ShowcaseProject {
  id: string;
  name: string;
  category: 'villas' | 'highrise' | 'township' | 'commercial';
  location: string;
  badge: 'New Launch' | 'Under Construction' | 'Pre-Launch' | 'Exclusive Edition';
  rating: string;
  image: string;
  priceStarting: string;
  configuration: string;
  possessionDate: string;
  carpetArea: string;
  landArea?: string;
  floors?: string;
  statusText?: string;
  description: string;
  highlights: string[];
  gallery: ShowcaseProjectGalleryItem[];
}

export const SHOWCASE_CONFIG = {
  // Brand Info
  brand: {
    name: 'Redhill Infra',
    taglineBadge: 'CONTEMPORARY BOUTIQUE HIGH-RISE LIVING · BENGALURU',
  },

  // Hero Section
  hero: {
    headlinePrefix: 'Thoughtfully Designed.',
    headlineMain: 'Built for Better Living.',
    subheadline: 'Contemporary residential communities crafted for modern urban living.',
    ctaExploreText: 'Explore Developments',
    ctaSiteVisitText: 'Book Visit',
    backgroundImage: heroBiophilicImg,
  },

  // Social Media Handles - Update your links here
  socialMediaHandles: [
    {
      name: 'YouTube',
      url: 'https://youtube.com/@redhillinfra',
      icon: 'youtube',
      ariaLabel: 'Subscribe on YouTube',
      handle: '@redhillinfra',
    },
    {
      name: 'LinkedIn',
      url: 'https://linkedin.com/company/redhillinfra',
      icon: 'linkedin',
      ariaLabel: 'Follow on LinkedIn',
      handle: 'Redhill Infrastructure Pvt Ltd',
    },
    {
      name: 'Instagram',
      url: 'https://instagram.com/redhillinfra',
      icon: 'instagram',
      ariaLabel: 'Follow on Instagram',
      handle: '@redhillinfra',
    },
    {
      name: 'Facebook',
      url: 'https://facebook.com/redhillinfra',
      icon: 'facebook',
      ariaLabel: 'Like on Facebook',
      handle: 'Redhill Infra Official',
    },
    {
      name: 'X (Twitter)',
      url: 'https://x.com/redhillinfra',
      icon: 'twitter',
      ariaLabel: 'Follow on X',
      handle: '@redhillinfra',
    },
  ] as SocialLink[],

  // Redhill Infrastructure Featured Projects (populated dynamically from Admin-created database projects)
  featuredProjects: [] as ShowcaseProject[],

  // Referral Rewards Program
  referral: {
    badge: 'Redhill Referral Circle',
    headline: 'Refer & Earn ₹50,000 – ₹3,00,000 INR',
    subtitle: 'Introduce your friends, family & associates to Redhill’s landmark developments. Unlock milestone rewards directly disbursed to your bank account on every successful booking.',
    rewardHighlight: '₹50,000 – ₹3,00,000 INR per Booking',
    tagline: 'Together as One. Move into the circle of trust.',
    steps: [
      { step: '01', title: 'Submit Referral', desc: 'Introduce your loved ones to the Redhill community & signature properties.' },
      { step: '02', title: 'Track Referral', desc: 'Real-time updates as your referral completes guided walkthrough, booking & registration.' },
      { step: '03', title: 'Get Rewarded', desc: 'Direct disbursement of ₹50,000 to ₹3 Lakh into your verified account upon 10% payment.' }
    ]
  },

  // Events & Conclaves
  events: [
    {
      id: 1,
      title: 'Redhill Private Investor & Conclave 2026',
      date: 'Saturday, 17th October 2026 • 6:30 PM IST',
      location: 'The Oberoi / Leela Palace, Bangalore',
      tag: 'Exclusive Event',
      desc: 'Exclusive evening exploring high-yield real estate corridors, upcoming pre-launch allocations, and sovereign asset portfolio strategies.',
    },
    {
      id: 2,
      title: 'Redhill Architectural Design & Portfolio Briefing',
      date: 'Sunday, 25th October 2026 • 11:00 AM IST',
      location: 'Redhill Experience Studio, Bengaluru',
      tag: 'Private Briefing',
      desc: 'Private architectural briefing with our design and engineering leadership on upcoming residential communities.',
    },
  ],

  // Concierge Services
  services: [
    {
      title: 'Guided Property Site Tour',
      desc: 'Complimentary premium pickup and drop for private property walkthroughs.',
      badge: 'Complimentary',
    },
    {
      title: 'Legal & Title Deeds Due-Diligence',
      desc: 'Direct consultation with senior real estate legal counsels for absolute title transparency.',
      badge: 'Certified',
    },
    {
      title: 'Preferential Mortgage & Wealth Advisory',
      desc: 'Pre-negotiated lending terms with premier private and nationalized banking partners.',
      badge: 'Fast-Track',
    },
    {
      title: 'Turnkey Architectural & Interior Packages',
      desc: 'End-to-end bespoke interior solutions customized by award-winning design studios.',
      badge: 'Custom',
    },
  ]
};
