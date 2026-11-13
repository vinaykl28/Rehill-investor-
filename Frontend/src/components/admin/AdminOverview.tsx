import React from 'react';
import {
  ArrowUpRight,
  Plus,
  UserPlus,
  MessageSquare,
  MapPin,
  ChevronRight,
  Building2,
  Users
} from 'lucide-react';
import { Project, User } from '../../types';
import { ROLE_CONFIG } from '../../constants/roles';
import { getAssetUrl } from '../../config/env';

interface AdminOverviewProps {
  user: User;
  projects: Project[];
  investors: User[];
  unansweredCount: number;
  adminsCount?: number;
  analytics?: {
    totalFundsRaised?: number;
    totalAllottedSqft?: number;
    activeProjectsCount?: number;
    activeProjects?: number;
  };
  setActiveView: (view: 'overview' | 'investors' | 'projects' | 'queries' | 'admins' | 'ledger') => void;
  onNewProject?: () => void;
  onNewInvestor?: () => void;
  onSelectProject?: (project: Project) => void;
}

export default function AdminOverview({
  user,
  projects = [],
  investors = [],
  unansweredCount = 0,
  adminsCount = 0,
  setActiveView,
  onNewProject,
  onNewInvestor,
  onSelectProject
}: AdminOverviewProps) {
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'senior_admin';
  const isSiteManager = user?.role === 'site_manager';
  const isFinancialOfficer = user?.role === 'financial_officer';
  const isSupportAgent = user?.role === 'support_agent';

  const roleMeta = ROLE_CONFIG[user?.role || 'super_admin'] || ROLE_CONFIG.super_admin;

  const metricCells = [
    !isSupportAgent && {
      key: 'projects',
      label: 'Projects',
      value: projects.length,
      sub: projects.length === 1 ? '1 development' : `${projects.length} developments`,
      onClick: () => setActiveView('projects'),
    },
    (isSuperAdmin || isFinancialOfficer) && {
      key: 'investors',
      label: 'Investors',
      value: investors.length,
      sub: investors.length === 1 ? '1 registered account' : `${investors.length} registered accounts`,
      onClick: () => setActiveView('investors'),
    },
    {
      key: 'queries',
      label: 'Inquiries',
      value: unansweredCount,
      sub: unansweredCount > 0 ? `${unansweredCount} awaiting reply` : 'All answered',
      highlight: unansweredCount > 0,
      onClick: () => setActiveView('queries'),
    },
    isSuperAdmin && {
      key: 'admins',
      label: 'Team',
      value: adminsCount,
      sub: adminsCount === 1 ? '1 staff member' : `${adminsCount} staff members`,
      onClick: () => setActiveView('admins'),
    },
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    value: number;
    sub: string;
    highlight?: boolean;
    onClick: () => void;
  }>;

  return (
    <div className="space-y-8">
      {/* 1. Quiet Editorial Header */}
      <div className="bg-white border border-redhill-line rounded-lg p-6 sm:p-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-redhill-muted font-medium">
            Administration · {roleMeta?.badge || 'Staff'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-normal text-redhill-charcoal tracking-tight">
            Welcome, {user?.name || user?.email || 'Administrator'}
          </h1>
          <p className="text-sm text-redhill-muted">
            Portfolio oversight, investor allocations, and site progress updates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!isSiteManager && !isSupportAgent && onNewProject && (
            <button
              onClick={onNewProject}
              className="bg-redhill-red hover:bg-red-700 text-white font-medium px-4 py-2.5 rounded-md transition-colors flex items-center gap-2 cursor-pointer text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          )}

          {(isSuperAdmin || isFinancialOfficer) && onNewInvestor && (
            <button
              onClick={onNewInvestor}
              className="bg-white hover:bg-redhill-ivory text-redhill-charcoal font-medium px-4 py-2.5 rounded-md border border-redhill-line transition-colors flex items-center gap-2 cursor-pointer text-xs sm:text-sm"
            >
              <UserPlus className="w-4 h-4 text-redhill-muted" />
              <span>Add Investor</span>
            </button>
          )}

          <button
            onClick={() => setActiveView('queries')}
            className="bg-white hover:bg-redhill-ivory text-redhill-charcoal font-medium px-4 py-2.5 rounded-md border border-redhill-line transition-colors flex items-center gap-2 cursor-pointer text-xs sm:text-sm"
          >
            <MessageSquare className="w-4 h-4 text-redhill-muted" />
            <span>Inquiries</span>
            {unansweredCount > 0 && (
              <span className="bg-redhill-red text-white text-[11px] font-medium px-1.5 py-0.5 rounded tabular-nums">
                {unansweredCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Architectural Summary Strip */}
      <div className="bg-white border border-redhill-line rounded-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-redhill-line overflow-hidden">
        {metricCells.map((cell) => (
          <button
            key={cell.key}
            type="button"
            onClick={cell.onClick}
            className="group text-left p-6 hover:bg-redhill-ivory/60 transition-colors cursor-pointer flex flex-col justify-between gap-4"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] uppercase tracking-[0.16em] text-redhill-muted font-medium">
                {cell.label}
              </span>
              <ArrowUpRight className="w-4 h-4 text-redhill-muted group-hover:text-redhill-charcoal transition-colors" />
            </div>

            <div>
              <div className="text-3xl font-light text-redhill-charcoal tabular-nums tracking-tight">
                {cell.value}
              </div>
              <p className={`text-xs mt-1.5 ${cell.highlight ? 'text-redhill-red font-medium' : 'text-redhill-muted'}`}>
                {cell.sub}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* 3. Projects & Recent Investors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!isSupportAgent && (
          <div className="bg-white rounded-lg border border-redhill-line overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-redhill-line flex items-center justify-between">
              <div>
                <h2 className="text-base font-medium text-redhill-charcoal">Projects</h2>
                <p className="text-xs text-redhill-muted mt-0.5">Construction progress and milestones</p>
              </div>
              <button
                onClick={() => setActiveView('projects')}
                className="text-xs font-medium text-redhill-charcoal hover:text-redhill-red flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View all ({projects.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="p-10 flex-1 flex flex-col items-center justify-center text-center">
                <Building2 className="w-6 h-6 text-redhill-muted/60 mb-3" />
                <p className="text-sm text-redhill-charcoal font-medium">No developments added yet</p>
                <p className="text-xs text-redhill-muted mt-1 max-w-xs">
                  Add a project to start uploading progress photos, documents, and investor allocations.
                </p>
                {!isSiteManager && onNewProject && (
                  <button
                    onClick={onNewProject}
                    className="mt-4 text-xs font-medium text-redhill-red hover:underline cursor-pointer"
                  >
                    + Create first project
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-redhill-line flex-1">
                {projects.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => (onSelectProject ? onSelectProject(p) : setActiveView('projects'))}
                    className="px-6 py-4 hover:bg-redhill-ivory/60 transition-colors flex items-center justify-between gap-4 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-md overflow-hidden bg-redhill-ivory border border-redhill-line shrink-0">
                        <img
                          src={getAssetUrl(p.image_url, p.id)}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getAssetUrl(null, p.id);
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-sm text-redhill-charcoal group-hover:text-redhill-red transition-colors truncate">
                          {p.name}
                        </h4>
                        <p className="text-xs text-redhill-muted flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-redhill-muted shrink-0" />
                          <span>{p.location}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                      <span className="text-[11px] text-redhill-muted">{p.status}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-redhill-ivory h-1 rounded-full overflow-hidden">
                          <div
                            className="bg-redhill-charcoal h-full"
                            style={{ width: `${p.completion_percentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-redhill-charcoal tabular-nums">
                          {p.completion_percentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(isSuperAdmin || isFinancialOfficer) && (
          <div className="bg-white rounded-lg border border-redhill-line overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-redhill-line flex items-center justify-between">
              <div>
                <h2 className="text-base font-medium text-redhill-charcoal">Recent Investor Accounts</h2>
                <p className="text-xs text-redhill-muted mt-0.5">Verified directory &amp; access credentials</p>
              </div>
              <button
                onClick={() => setActiveView('investors')}
                className="text-xs font-medium text-redhill-charcoal hover:text-redhill-red flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Directory ({investors.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {investors.length === 0 ? (
              <div className="p-10 flex-1 flex flex-col items-center justify-center text-center">
                <Users className="w-6 h-6 text-redhill-muted/60 mb-3" />
                <p className="text-sm text-redhill-charcoal font-medium">No investor accounts yet</p>
                <p className="text-xs text-redhill-muted mt-1 max-w-xs">
                  Add an investor to generate login credentials and assign project allocations.
                </p>
                {onNewInvestor && (
                  <button
                    onClick={onNewInvestor}
                    className="mt-4 text-xs font-medium text-redhill-red hover:underline cursor-pointer"
                  >
                    + Add investor
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-redhill-line flex-1">
                {investors.slice(0, 4).map((i) => (
                  <div
                    key={i.id}
                    onClick={() => setActiveView('investors')}
                    className="px-6 py-4 hover:bg-redhill-ivory/60 transition-colors flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-md bg-redhill-ivory border border-redhill-line flex items-center justify-center text-sm font-medium text-redhill-charcoal shrink-0">
                        {i.name ? i.name.charAt(0).toUpperCase() : 'I'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-sm text-redhill-charcoal truncate">{i.name}</h4>
                        <p className="text-xs text-redhill-muted truncate">{i.email}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono text-redhill-charcoal">
                        {i.login_id || '—'}
                      </span>
                      <p className="text-[11px] text-redhill-muted mt-0.5 tabular-nums">
                        {i.phone || '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
