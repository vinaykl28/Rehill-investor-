import React from 'react';
import {
  ArrowUpRight,
  Plus,
  UserPlus,
  MessageSquare,
  MapPin,
  ChevronRight,
  Building2,
  Users,
  BookOpen
} from 'lucide-react';
import { Project, User, Query, LedgerEntry } from '../../types';
import { ROLE_CONFIG } from '../../constants/roles';
import { getAssetUrl } from '../../config/env';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface AdminOverviewProps {
  user: User;
  projects: Project[];
  investors: User[];
  threads?: Query[];
  ledgerEntries?: LedgerEntry[];
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
  threads = [],
  ledgerEntries = [],
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
    <div className="space-y-5">
      {/* 1. Quiet Editorial Header */}
      <div className="bg-white border border-redhill-line rounded-lg px-5 py-5 sm:px-6 sm:py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-redhill-muted font-medium">
            Administration · {roleMeta?.badge || 'Staff'}
          </p>
          <h1 className="text-2xl font-normal text-redhill-charcoal tracking-tight">
            Welcome, {user?.name || user?.email || 'Administrator'}
          </h1>
          <p className="text-xs sm:text-sm text-redhill-muted">
            Portfolio oversight, investor allocations, and site progress updates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!isSiteManager && !isSupportAgent && onNewProject && (
            <button
              onClick={onNewProject}
              className="bg-redhill-red hover:bg-red-700 text-white font-medium px-4 py-2 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          )}

          {(isSuperAdmin || isFinancialOfficer) && onNewInvestor && (
            <button
              onClick={onNewInvestor}
              className="bg-white hover:bg-redhill-ivory text-redhill-charcoal font-medium px-4 py-2 rounded-md border border-redhill-line transition-colors flex items-center gap-1.5 cursor-pointer text-xs sm:text-sm"
            >
              <UserPlus className="w-4 h-4 text-redhill-muted" />
              <span>Add Investor</span>
            </button>
          )}

          <button
            onClick={() => setActiveView('queries')}
            className="bg-white hover:bg-redhill-ivory text-redhill-charcoal font-medium px-4 py-2 rounded-md border border-redhill-line transition-colors flex items-center gap-1.5 cursor-pointer text-xs sm:text-sm"
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
            className="group text-left px-5 py-4 hover:bg-redhill-ivory/60 transition-colors cursor-pointer flex flex-col justify-between gap-2.5"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] uppercase tracking-[0.16em] text-redhill-muted font-medium">
                {cell.label}
              </span>
              <ArrowUpRight className="w-4 h-4 text-redhill-muted group-hover:text-redhill-charcoal transition-colors" />
            </div>

            <div className="flex items-baseline justify-between gap-3">
              <span className="text-2xl sm:text-3xl font-light text-redhill-charcoal tabular-nums tracking-tight">
                {cell.value}
              </span>
              <span className={`text-xs ${cell.highlight ? 'text-redhill-red font-medium' : 'text-redhill-muted'}`}>
                {cell.sub}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* 3. Operational Panels (Projects, Investors, Inquiries, Ledger) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {!isSupportAgent && (
          <div className="bg-white rounded-lg border border-redhill-line overflow-hidden">
            <div className="px-5 py-3.5 border-b border-redhill-line flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-redhill-charcoal">Projects</h2>
                <p className="text-xs text-redhill-muted">Construction progress and milestones</p>
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
              <div className="px-5 py-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-md bg-redhill-ivory border border-redhill-line flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-redhill-muted" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-redhill-charcoal font-medium">No developments added yet</p>
                    <p className="text-xs text-redhill-muted truncate">
                      Add a project to upload photos, documents, and allocations.
                    </p>
                  </div>
                </div>
                {!isSiteManager && onNewProject && (
                  <button
                    onClick={onNewProject}
                    className="shrink-0 text-xs font-medium text-redhill-red hover:underline cursor-pointer"
                  >
                    + Create
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-redhill-line">
                {projects.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => (onSelectProject ? onSelectProject(p) : setActiveView('projects'))}
                    className="px-5 py-3.5 hover:bg-redhill-ivory/60 transition-colors flex items-center justify-between gap-4 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-md overflow-hidden bg-redhill-ivory border border-redhill-line shrink-0">
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

                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <span className="text-[11px] text-redhill-muted">{p.status}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-redhill-ivory h-1 rounded-full overflow-hidden">
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
          <div className="bg-white rounded-lg border border-redhill-line overflow-hidden">
            <div className="px-5 py-3.5 border-b border-redhill-line flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-redhill-charcoal">Recent Investor Accounts</h2>
                <p className="text-xs text-redhill-muted">Verified directory &amp; access credentials</p>
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
              <div className="px-5 py-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-md bg-redhill-ivory border border-redhill-line flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-redhill-muted" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-redhill-charcoal font-medium">No investor accounts yet</p>
                    <p className="text-xs text-redhill-muted truncate">
                      Add an investor to generate credentials and assign allocations.
                    </p>
                  </div>
                </div>
                {onNewInvestor && (
                  <button
                    onClick={onNewInvestor}
                    className="shrink-0 text-xs font-medium text-redhill-red hover:underline cursor-pointer"
                  >
                    + Add
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-redhill-line">
                {investors.slice(0, 4).map((i) => (
                  <div
                    key={i.id}
                    onClick={() => setActiveView('investors')}
                    className="px-5 py-3.5 hover:bg-redhill-ivory/60 transition-colors flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-md bg-redhill-ivory border border-redhill-line flex items-center justify-center text-xs font-medium text-redhill-charcoal shrink-0">
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

        {/* Bottom-Left: Recent Inquiries */}
        <div className="bg-white rounded-lg border border-redhill-line overflow-hidden">
          <div className="px-5 py-3.5 border-b border-redhill-line flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-redhill-charcoal">Inquiries &amp; Site Visits</h2>
              <p className="text-xs text-redhill-muted">Latest investor questions and requests</p>
            </div>
            <button
              onClick={() => setActiveView('queries')}
              className="text-xs font-medium text-redhill-charcoal hover:text-redhill-red flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Open desk ({threads.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {threads.length === 0 ? (
            <div className="px-5 py-6 flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-redhill-ivory border border-redhill-line flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4 text-redhill-muted" />
              </div>
              <div>
                <p className="text-sm text-redhill-charcoal font-medium">No active inquiries</p>
                <p className="text-xs text-redhill-muted">New messages from investors will appear here.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-redhill-line">
              {threads.slice(0, 4).map((t: any) => (
                <div
                  key={t.id}
                  onClick={() => setActiveView('queries')}
                  className="px-5 py-3.5 hover:bg-redhill-ivory/60 transition-colors flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="min-w-0">
                    <h4 className="font-medium text-sm text-redhill-charcoal truncate">
                      {t.investor_name || 'Investor'} · <span className="text-redhill-muted font-normal">{t.project_name || 'General'}</span>
                    </h4>
                    <p className="text-xs text-redhill-muted truncate mt-0.5">
                      {t.last_message || t.message || 'Inquiry thread'}
                    </p>
                  </div>
                  <span className={`shrink-0 text-[11px] font-medium ${t.last_sender_role === 'investor' ? 'text-redhill-red' : 'text-redhill-muted'}`}>
                    {t.last_sender_role === 'investor' ? 'Needs reply' : 'Replied'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom-Right: Recent Investment Ledger */}
        {(isSuperAdmin || isFinancialOfficer) && (
          <div className="bg-white rounded-lg border border-redhill-line overflow-hidden">
            <div className="px-5 py-3.5 border-b border-redhill-line flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-redhill-charcoal">Recent Ledger Activity</h2>
                <p className="text-xs text-redhill-muted">Capital receipts and allotment entries</p>
              </div>
              <button
                onClick={() => setActiveView('ledger')}
                className="text-xs font-medium text-redhill-charcoal hover:text-redhill-red flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View ledger ({ledgerEntries.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {ledgerEntries.length === 0 ? (
              <div className="px-5 py-6 flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-redhill-ivory border border-redhill-line flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-redhill-muted" />
                </div>
                <div>
                  <p className="text-sm text-redhill-charcoal font-medium">No ledger entries recorded</p>
                  <p className="text-xs text-redhill-muted">Payments and receipts will show here once recorded.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-redhill-line">
                {ledgerEntries.slice(0, 4).map((entry: any) => (
                  <div
                    key={entry.id}
                    onClick={() => setActiveView('ledger')}
                    className="px-5 py-3.5 hover:bg-redhill-ivory/60 transition-colors flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <h4 className="font-medium text-sm text-redhill-charcoal truncate">
                        {entry.investor_name || 'Investor'}
                      </h4>
                      <p className="text-xs text-redhill-muted truncate mt-0.5">
                        {entry.project_name || 'Project'} · {entry.payment_date ? formatDate(entry.payment_date) : '—'}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-mono text-redhill-charcoal tabular-nums">
                      {formatCurrency(entry.amount || 0)}
                    </span>
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
