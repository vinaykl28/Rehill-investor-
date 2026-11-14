import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Layers, 
  ExternalLink, 
  Compass, 
  Share2, 
  Copy, 
  Check, 
  Search,
  Star,
  Car,
  Plane,
  Building2,
  CheckCircle2,
  Maximize2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './Toast';

export interface MapProject {
  id: number | string;
  name: string;
  location: string;
  address: string;
  lat: number;
  lng: number;
  status: string;
  completion: number;
  value?: string;
  carpetArea?: string;
  image?: string;
  proximityHighlights: { icon: string; label: string }[];
  googleMapsUrl: string;
}

export const BANGALORE_PROJECTS: MapProject[] = [];

interface InteractiveMapProps {
  projects?: MapProject[];
  highlightProjectId?: number | string;
  onBookSiteVisit?: (project: MapProject) => void;
  standalone?: boolean;
}

export default function InteractiveMap({
  projects = BANGALORE_PROJECTS,
  highlightProjectId,
  onBookSiteVisit,
  standalone = false
}: InteractiveMapProps) {
  const { showToast } = useToast();
  const [selectedProject, setSelectedProject] = useState<MapProject | null>(
    () => projects.find(p => String(p.id) === String(highlightProjectId)) || projects[0] || null
  );
  const [mapType, setMapType] = useState<'m' | 'k'>('m'); // 'm' = standard roadmap, 'k' = satellite
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync selectedProject when projects list or highlightProjectId changes
  useEffect(() => {
    if (projects.length === 0) {
      setSelectedProject(null);
      return;
    }
    if (highlightProjectId) {
      const match = projects.find(p => String(p.id) === String(highlightProjectId));
      if (match) {
        setSelectedProject(match);
        return;
      }
    }
    setSelectedProject(prev => (prev && projects.some(p => p.id === prev.id) ? prev : projects[0]));
  }, [projects, highlightProjectId]);

  if (!selectedProject || projects.length === 0) {
    return null;
  }

  const handleCopyCoordinates = () => {
    navigator.clipboard.writeText(selectedProject.address || selectedProject.location);
    setCopied(true);
    showToast('Location copied to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  // Google Maps Embed URL dynamically centered on selected project location or coordinates
  const queryTarget = selectedProject.address || selectedProject.location || `${selectedProject.lat},${selectedProject.lng}`;
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(queryTarget)}&t=${mapType}&z=14&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className={`relative rounded-[4px] overflow-hidden bg-white border border-redhill-line shadow-lg transition-all duration-300 ${
      isFullscreen ? 'fixed inset-4 z-50 rounded-[4px]' : 'w-full'
    }`}>
      {/* Top Header Controls Bar */}
      <div className="p-4 sm:p-5 border-b border-redhill-line bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xs bg-redhill-sand border border-redhill-line flex items-center justify-center text-redhill-charcoal">
            <MapPin className="w-4 h-4 text-redhill-gold" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-normal text-redhill-charcoal font-serif flex items-center gap-2">
              <span>Google Maps Location</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-800 font-medium px-2 py-0.5 rounded-xs border border-emerald-500/20 font-sans uppercase tracking-[0.14em]">
                Live GPS
              </span>
            </h3>
            <p className="text-xs text-redhill-muted">Accurate street view and aerial navigation for Redhill developments</p>
          </div>
        </div>

        {/* Map View & Layer Toggle (Standard Roadmap vs Satellite) */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex bg-redhill-sand p-1 rounded-xs border border-redhill-line text-xs font-medium">
            <button
              onClick={() => setMapType('m')}
              className={`px-3.5 py-1.5 rounded-xs transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-[0.12em] text-[11px] ${
                mapType === 'm'
                  ? 'bg-redhill-charcoal text-white shadow-xs'
                  : 'text-redhill-muted hover:text-redhill-charcoal'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Map View</span>
            </button>
            <button
              onClick={() => setMapType('k')}
              className={`px-3.5 py-1.5 rounded-xs transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-[0.12em] text-[11px] ${
                mapType === 'k'
                  ? 'bg-redhill-charcoal text-white shadow-xs'
                  : 'text-redhill-muted hover:text-redhill-charcoal'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Satellite</span>
            </button>
          </div>

          <a
            href={selectedProject.googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 bg-white hover:bg-redhill-sand text-redhill-charcoal rounded-xs text-xs uppercase tracking-[0.12em] font-medium border border-redhill-line transition-all flex items-center gap-1.5 cursor-pointer"
            title="Open in Google Maps App"
          >
            <ExternalLink className="w-3.5 h-3.5 text-redhill-gold" />
            <span className="hidden sm:inline">Open in Maps</span>
          </a>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-white hover:bg-redhill-sand text-redhill-charcoal rounded-xs border border-redhill-line transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <X className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Project Selector Pills Bar */}
      <div className="px-4 sm:px-6 py-3 bg-redhill-ivory border-b border-redhill-line flex items-center gap-2 overflow-x-auto custom-scrollbar">
        <span className="text-[11px] text-redhill-muted uppercase tracking-[0.18em] font-medium shrink-0 mr-1">Select Project:</span>
        {projects.map(p => {
          const isSelected = selectedProject.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedProject(p)}
              className={`px-3.5 py-1.5 rounded-xs text-xs uppercase tracking-[0.12em] font-medium transition-all border shrink-0 flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-redhill-charcoal text-white border-redhill-charcoal'
                  : 'bg-white text-stone-700 border-redhill-line hover:border-redhill-stone hover:text-redhill-charcoal'
              }`}
            >
              <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-redhill-gold-soft' : 'text-redhill-gold'}`} />
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Map Container */}
      <div className="relative h-[480px] sm:h-[540px] w-full bg-[#10121A] overflow-hidden">
        {/* Real Embedded Google Maps View */}
        <iframe
          key={`${selectedProject.id}-${mapType}`}
          title={`Google Maps - ${selectedProject.name}`}
          src={mapEmbedUrl}
          className="w-full h-full border-0"
          loading="lazy"
          allowFullScreen
        />

        {/* Floating Google Maps Style Location Card (Left / Bottom Overlay) */}
        <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-auto sm:w-[380px] bg-white/95 backdrop-blur-md rounded-xs p-4 sm:p-5 border border-redhill-line shadow-xl z-20">
          <div className="flex items-start justify-between gap-3 pb-2.5 sm:pb-3 border-b border-redhill-line">
            <div>
              <span className="text-[9px] sm:text-[10px] font-semibold text-redhill-gold uppercase tracking-[0.18em] bg-redhill-sand px-2 py-0.5 rounded-xs border border-redhill-line">
                {selectedProject.location.split(',')[0]}
              </span>
              <h4 className="text-base sm:text-lg font-medium text-redhill-charcoal font-serif mt-1">{selectedProject.name}</h4>
              <p className="text-[11px] sm:text-xs text-redhill-muted mt-0.5 line-clamp-1 sm:line-clamp-2">{selectedProject.address}</p>
            </div>
            <button
              onClick={handleCopyCoordinates}
              className="p-1.5 sm:p-2 text-redhill-muted hover:text-redhill-charcoal hover:bg-redhill-sand rounded-xs transition-colors shrink-0 cursor-pointer"
              title="Copy GPS coordinates"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Key Proximity Highlights */}
          <div className="hidden sm:block space-y-1.5 py-3 border-b border-redhill-line">
            {selectedProject.proximityHighlights.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-stone-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-2 gap-2 pt-2.5 sm:pt-3">
            <a
              href={selectedProject.googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary py-2 sm:py-2.5 px-2.5 sm:px-3 text-[11px] sm:text-xs uppercase tracking-[0.12em] justify-center"
            >
              <Navigation className="w-3.5 h-3.5 text-redhill-gold" />
              <span>Directions</span>
            </a>

            <button
              onClick={() => {
                if (onBookSiteVisit) onBookSiteVisit(selectedProject);
                else {
                  window.open(selectedProject.googleMapsUrl, '_blank');
                }
              }}
              className="btn-primary py-2 sm:py-2.5 px-2.5 sm:px-3 text-[11px] sm:text-xs uppercase tracking-[0.12em] justify-center"
            >
              <Car className="w-3.5 h-3.5" />
              <span>Visit Site</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
