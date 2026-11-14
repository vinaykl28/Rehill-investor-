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
    <div className={`relative rounded-3xl overflow-hidden bg-white border border-redhill-line shadow-2xl transition-all duration-300 ${
      isFullscreen ? 'fixed inset-4 z-50 rounded-2xl' : 'w-full'
    }`}>
      {/* Top Header Controls Bar */}
      <div className="p-4 sm:p-5 border-b border-redhill-line bg-redhill-sand-deep backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-redhill-red/10 border border-redhill-red/20 flex items-center justify-center text-redhill-red">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-redhill-charcoal font-serif flex items-center gap-2">
              <span>Google Maps Location</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 font-sans">
                Live GPS
              </span>
            </h3>
            <p className="text-xs text-redhill-muted">Accurate street view and aerial navigation for Redhill developments</p>
          </div>
        </div>

        {/* Map View & Layer Toggle (Standard Roadmap vs Satellite) */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex bg-redhill-ivory p-1 rounded-xl border border-redhill-line text-xs font-bold">
            <button
              onClick={() => setMapType('m')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                mapType === 'm'
                  ? 'bg-redhill-red text-white shadow-md'
                  : 'text-redhill-muted hover:text-redhill-charcoal'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Map View</span>
            </button>
            <button
              onClick={() => setMapType('k')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                mapType === 'k'
                  ? 'bg-redhill-red text-white shadow-md'
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
            className="px-3.5 py-2 bg-redhill-sand/70 hover:bg-redhill-sand text-redhill-charcoal rounded-xl text-xs font-bold border border-redhill-line transition-all flex items-center gap-1.5 cursor-pointer"
            title="Open in Google Maps App"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">Open in Google Maps</span>
          </a>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-redhill-sand/70 hover:bg-redhill-sand text-stone-700 hover:text-redhill-charcoal rounded-xl border border-redhill-line transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <X className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Project Selector Pills Bar */}
      <div className="px-4 sm:px-6 py-3 bg-redhill-ivory border-b border-redhill-line flex items-center gap-2 overflow-x-auto custom-scrollbar">
        <span className="text-xs text-redhill-muted font-bold uppercase tracking-wider shrink-0 mr-1">Select Project:</span>
        {projects.map(p => {
          const isSelected = selectedProject.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedProject(p)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-redhill-red text-white border-redhill-red shadow-lg shadow-redhill-red/25'
                  : 'bg-[#FBF9F5] text-stone-700 border-redhill-line hover:bg-redhill-sand hover:text-redhill-charcoal'
              }`}
            >
              <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-redhill-charcoal' : 'text-amber-700'}`} />
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
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-[380px] bg-redhill-sand-deep backdrop-blur-2xl rounded-2xl p-5 border border-redhill-line shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-20">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-redhill-line">
            <div>
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {selectedProject.location.split(',')[0]}
              </span>
              <h4 className="text-base font-bold text-redhill-charcoal font-serif mt-1">{selectedProject.name}</h4>
              <p className="text-xs text-redhill-muted mt-0.5 line-clamp-2">{selectedProject.address}</p>
            </div>
            <button
              onClick={handleCopyCoordinates}
              className="p-2 text-redhill-muted hover:text-redhill-charcoal hover:bg-redhill-sand rounded-lg transition-colors shrink-0"
              title="Copy GPS coordinates"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Key Proximity Highlights */}
          <div className="space-y-1.5 py-3 border-b border-redhill-line">
            {selectedProject.proximityHighlights.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-stone-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-2 gap-2 pt-3">
            <a
              href={selectedProject.googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-redhill-sand/70 hover:bg-redhill-sand text-redhill-charcoal py-2.5 px-3 rounded-xl text-xs font-bold transition-all border border-redhill-line flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 text-cyan-700" />
              <span>Get Directions</span>
            </a>

            <button
              onClick={() => {
                if (onBookSiteVisit) onBookSiteVisit(selectedProject);
                else {
                  window.open(selectedProject.googleMapsUrl, '_blank');
                }
              }}
              className="bg-redhill-red hover:bg-red-700 text-white py-2.5 px-3 rounded-xl text-xs font-bold transition-all shadow-md shadow-redhill-red/25 flex items-center justify-center gap-1.5 cursor-pointer"
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
