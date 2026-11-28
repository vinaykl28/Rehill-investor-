import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Project, Milestone, MilestoneCategory, MilestoneStatus, ProgressUpdate, Query, Role, LedgerEntry } from '../types';
import {
  Users, Building2, LayoutDashboard, CheckCircle2, Clock, AlertCircle,
  Image as ImageIcon, Video, Bell, Save, Trash2, UserPlus, MapPin,
  MessageCircle, Send, ArrowLeft, Pencil, Copy, Check, ExternalLink, Eye, EyeOff,
  Search, MoreHorizontal, ChevronDown, ChevronUp, ChevronRight, Wallet, MoreVertical, Hammer,
  Upload, Link as LinkIcon, X, FileVideo, IndianRupee, Shield, Mail, BookOpen,
  PlusCircle, TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Logo from '../components/Logo';
import Layout from '../components/Layout';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import StatusChip from '../components/StatusChip';
import ManageMilestonesModal from '../components/admin/ManageMilestonesModal';
import { formatCurrency, formatDate, formatRelativeTime } from '../utils/formatters';
import { ROLE_CONFIG, RoleMetadata } from '../constants/roles';
import { apiFetch } from '../api/client';
import { getAssetUrl } from '../config/env';

// Modular Admin Components
import AdminOverview from '../components/admin/AdminOverview';
import AdminManagement from '../components/admin/AdminManagement';
import InvestmentLedger from '../components/admin/InvestmentLedger';
import AdminQueries from '../components/admin/AdminQueries';
import ProjectDrawer from '../components/admin/ProjectDrawer';

// Modular Modals
import CreateAdminModal from '../components/admin/modals/CreateAdminModal';
import EditAdminModal from '../components/admin/modals/EditAdminModal';
import CreateProjectModal from '../components/admin/modals/CreateProjectModal';
import CreateInvestorModal from '../components/admin/modals/CreateInvestorModal';
import AssignProjectModal from '../components/admin/modals/AssignProjectModal';
import RecordPaymentModal from '../components/admin/modals/RecordPaymentModal';
import SubInvestmentModal from '../components/admin/modals/SubInvestmentModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const { showToast } = useToast();
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'senior_admin';
  const isSiteManager = user?.role === 'site_manager';
  const isFinancialOfficer = user?.role === 'financial_officer';
  const isMarketingManager = user?.role === 'marketing_manager';
  const isSupportAgent = user?.role === 'support_agent';

  const [activeView, setActiveView] = useState<'overview' | 'investors' | 'projects' | 'queries' | 'admins' | 'ledger'>('overview');
  const [selectedThread, setSelectedThread] = useState<Query | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Queries fetching
  const { data: investors = [], isLoading: loadingInvestors, refetch: refetchInvestors } = useQuery<User[]>({
    queryKey: ['admin-investors'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/investors');
      return res.json();
    },
    enabled: isSuperAdmin || isFinancialOfficer
  });

  const { data: projects = [], isLoading: loadingProjects, refetch: refetchProjects } = useQuery<Project[]>({
    queryKey: ['admin-projects'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/projects');
      return res.json();
    }
  });

  const { data: assignments = [], refetch: refetchAssignments } = useQuery<any[]>({
    queryKey: ['admin-investor-projects'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/investor-projects');
      return res.json();
    },
    enabled: isSuperAdmin || isFinancialOfficer
  });

  const { data: threads = [], refetch: refetchQueries } = useQuery<Query[]>({
    queryKey: ['admin-queries'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/queries');
      return res.json();
    },
    refetchInterval: 15000
  });

  const { data: adminsList = [], refetch: refetchAdmins } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/users');
      return res.json();
    },
    enabled: isSuperAdmin
  });

  const { data: ledgerEntries = [], refetch: refetchLedger } = useQuery<LedgerEntry[]>({
    queryKey: ['admin-ledger'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/ledger');
      return res.json();
    },
    enabled: isSuperAdmin || isFinancialOfficer
  });

  const { data: analyticsData, refetch: refetchAnalytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/analytics');
      return res.json();
    }
  });

  // Modal Visibility State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showInvestorModal, setShowInvestorModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSubInvestmentModal, setShowSubInvestmentModal] = useState(false);
  const [targetAssignment, setTargetAssignment] = useState<any | null>(null);

  // Project Detail Drawer / Milestone state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectMilestones, setProjectMilestones] = useState<Milestone[]>([]);
  const [projectUpdates, setProjectUpdates] = useState<ProgressUpdate[]>([]);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCctvModal, setShowCctvModal] = useState(false);
  const [cctvUrl, setCctvUrl] = useState('');

  // Form states for Milestones
  const [mCategory, setMCategory] = useState<MilestoneCategory>('documentation');
  const [mName, setMName] = useState('');
  const [mStatus, setMStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const [mDocUrl, setMDocUrl] = useState('');
  const [mDocFile, setMDocFile] = useState<File | null>(null);
  const mDocFileRef = useRef<HTMLInputElement>(null);

  // Form states for Updates
  const [updateType, setUpdateType] = useState<'photo' | 'video'>('photo');
  const [updateUrl, setUpdateUrl] = useState('');
  const [updateCaption, setUpdateCaption] = useState('');
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Assignment Modal state
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);
  const [editContribution, setEditContribution] = useState('');
  const [editInvestmentAmt, setEditInvestmentAmt] = useState('');
  const [editSqft, setEditSqft] = useState('');
  const [editMarketPrice, setEditMarketPrice] = useState('');
  const [editPriceAtInv, setEditPriceAtInv] = useState('');
  const [editInvDate, setEditInvDate] = useState('');

  // Search & Pagination States
  const [investorSearch, setInvestorSearch] = useState('');
  const [investorPage, setInvestorPage] = useState(1);
  const [investorSortField, setInvestorSortField] = useState('name');
  const [investorSortDir, setInvestorSortDir] = useState<'asc' | 'desc'>('asc');

  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [assignmentProjectFilter, setAssignmentProjectFilter] = useState('');
  const [assignmentPage, setAssignmentPage] = useState(1);
  const [assignmentSortField, setAssignmentSortField] = useState('investor');
  const [assignmentSortDir, setAssignmentSortDir] = useState<'asc' | 'desc'>('asc');

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const unansweredCount = threads.filter((t: any) => t.last_sender_role === 'investor').length;

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (selectedThread) {
      scrollToBottom();
    }
  }, [selectedThread, threads]);

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast(`Copied "${text}" to clipboard`, 'info');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast('Failed to copy to clipboard', 'error');
    }
  }, [showToast]);

  const fetchProjectDetails = async (projectId: number) => {
    try {
      const res = await apiFetch(`/api/investor/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProjectMilestones(data.milestones || []);
        setProjectUpdates(data.updates || []);
      }
    } catch {
      showToast('Failed to load project milestones and updates', 'error');
    }
  };

  const openProjectDrawer = (project: Project) => {
    setSelectedProject(project);
    setCctvUrl(project.cctv_url || '');
    fetchProjectDetails(project.id);
  };

  // --- Handlers ---
  const handleCreateAdmin = async (data: { name: string; email: string; role: Role; password: string }) => {
    try {
      const res = await apiFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        refetchAdmins();
        setShowAdminModal(false);
        showToast('Admin staff created successfully', 'success');
      } else {
        const err = await res.json();
        showToast(`Error: ${err.error}`, 'error');
      }
    } catch {
      showToast('An error occurred', 'error');
    }
  };

  const handleUpdateAdmin = async (id: number, data: { name: string; email: string; role: Role; password?: string }) => {
    try {
      const res = await apiFetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        refetchAdmins();
        setShowEditAdminModal(false);
        showToast('Admin user updated successfully', 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update admin', 'error');
      }
    } catch {
      showToast('An error occurred', 'error');
    }
  };

  const handleDeleteAdmin = (id: number, name: string) => {
    if (id === user.id) {
      showToast('You cannot delete your own Super Admin account', 'error');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: `Remove ${name}?`,
      message: `Are you sure you want to remove "${name}" from administrators? This will permanently revoke their access to the portal.`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
          if (res.ok) {
            refetchAdmins();
            showToast('Admin account removed successfully', 'success');
          } else {
            const data = await res.json();
            showToast(data.error || 'Failed to delete admin', 'error');
          }
        } catch {
          showToast('Failed to delete admin', 'error');
        }
      }
    });
  };

  const handleCreateProject = async (data: {
    name: string;
    location: string;
    status: string;
    imageUrl: string;
    completionPercentage: number;
    description: string;
    imageFile: File | null;
  }) => {
    let finalImageUrl = data.imageUrl;
    if (data.imageFile) {
      const formData = new FormData();
      formData.append('file', data.imageFile);
      const uploadRes = await apiFetch('/api/admin/upload', { method: 'POST', body: formData });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        finalImageUrl = uploadData.url;
      }
    }

    const res = await apiFetch('/api/admin/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        location: data.location,
        total_value: '',
        status: data.status,
        image_url: finalImageUrl,
        completion_percentage: data.completionPercentage,
        cctv_url: '',
        description: data.description,
      })
    });

    if (res.ok) {
      setShowProjectModal(false);
      refetchProjects();
      showToast('Project created successfully!', 'success');
    } else {
      showToast('Failed to create project', 'error');
    }
  };

  const handleCreateInvestor = async (data: { name: string; email: string; phone: string; password: string }) => {
    const res = await apiFetch('/api/admin/investors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      setShowInvestorModal(false);
      refetchInvestors();
      showToast('Investor account created successfully!', 'success');
    } else {
      const err = await res.json().catch(() => ({ error: 'Failed to create investor' }));
      showToast(`Error: ${err.error}`, 'error');
      throw new Error(err.error || 'Failed to create investor');
    }
  };

  const handleDeleteInvestor = (id: number, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete ${name}?`,
      message: `This will permanently remove the investor "${name}" and all their project assignments, investment records, and query history.`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await apiFetch(`/api/admin/investors/${id}`, { method: 'DELETE' });
          if (res.ok) {
            refetchInvestors();
            refetchAssignments();
            refetchLedger();
            showToast(`${name} has been deleted successfully.`, 'success');
          } else {
            showToast('Failed to delete investor', 'error');
          }
        } catch {
          showToast('An error occurred', 'error');
        }
      }
    });
  };

  const handleAssignProject = async (data: {
    userId: string;
    projectId: string;
    contribution: string;
    investmentAmount: string;
    allottedSqft: string;
    marketPricePerSqft: string;
  }) => {
    const res = await apiFetch('/api/admin/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: parseInt(data.userId),
        project_id: parseInt(data.projectId),
        contribution: data.contribution,
        investment_amount: parseFloat(data.investmentAmount) || 0,
        allotted_sqft: parseFloat(data.allottedSqft) || 0,
        market_price_per_sqft: parseFloat(data.marketPricePerSqft) || 0
      })
    });

    if (res.ok) {
      setShowAssignModal(false);
      refetchAssignments();
      refetchLedger();
      showToast('Investor assigned to project successfully!', 'success');
    } else {
      const err = await res.json();
      showToast(`Error: ${err.error}`, 'error');
    }
  };

  const handleRecordPayment = async (data: {
    type: 'receipt' | 'invoice';
    amount: string;
    date: string;
    notes: string;
    file: File | null;
  }) => {
    if (!targetAssignment) return;
    let docUrl = '';
    if (data.file) {
      const formData = new FormData();
      formData.append('file', data.file);
      const upRes = await apiFetch('/api/admin/upload', { method: 'POST', body: formData });
      if (upRes.ok) {
        const upData = await upRes.json();
        docUrl = upData.url;
      }
    }

    const res = await apiFetch('/api/admin/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: targetAssignment.project_id,
        user_id: targetAssignment.user_id,
        type: data.type,
        amount: Number(data.amount),
        date: data.date,
        status: 'paid',
        description: data.notes,
        file_url: docUrl
      })
    });

    if (res.ok) {
      setShowPaymentModal(false);
      showToast('Payment transaction recorded successfully!', 'success');
    } else {
      const err = await res.json();
      showToast(`Error: ${err.error}`, 'error');
    }
  };

  const handleAddSubInvestment = async (data: {
    userId: number;
    projectId: number;
    addCapital: number;
    addSqft: number;
    currentPrice: number;
    notes: string;
    transactionDate: string;
  }) => {
    const res = await apiFetch('/api/admin/ledger/sub-investment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: data.userId,
        project_id: data.projectId,
        investment_amount: data.addCapital,
        allotted_sqft: data.addSqft,
        price_at_investment: data.currentPrice,
        market_price_per_sqft: data.currentPrice,
        note: data.notes,
        transaction_date: data.transactionDate
      })
    });

    if (res.ok) {
      setShowSubInvestmentModal(false);
      setTargetAssignment(null);
      refetchAssignments();
      refetchLedger();
      refetchAnalytics();
      showToast('Sub-investment upgraded & logged to Ledger successfully!', 'success');
    } else {
      const err = await res.json();
      showToast(`Error: ${err.error}`, 'error');
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread || !replyMessage.trim()) return;

    setSendingReply(true);
    try {
      const res = await apiFetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedThread.project_id,
          user_id: selectedThread.user_id,
          message: replyMessage
        })
      });

      if (res.ok) {
        setReplyMessage('');
        refetchQueries();
        showToast('Reply dispatched successfully', 'success');
      } else {
        showToast('Failed to send reply', 'error');
      }
    } catch {
      showToast('Error sending message', 'error');
    } finally {
      setSendingReply(false);
    }
  };

  const handleLogout = async () => {
    await apiFetch('/api/logout', { method: 'POST' });
    onLogout();
  };

  // Filtered Investors for Investors Tab
  const filteredInvestors = investors
    .filter(i => {
      if (!investorSearch) return true;
      const q = investorSearch.toLowerCase();
      return (
        (i.name?.toLowerCase().includes(q) ?? false) ||
        (i.email?.toLowerCase().includes(q) ?? false) ||
        (i.login_id?.toLowerCase().includes(q) ?? false)
      );
    });
  const paginatedInvestors = filteredInvestors.slice((investorPage - 1) * 10, investorPage * 10);
  const investorTotalPages = Math.max(1, Math.ceil(filteredInvestors.length / 10));

  // Filtered Assignments for Investors Tab
  const filteredAssignments = assignments.filter((a: any) => {
    const matchesSearch = !assignmentSearch || 
      (a.investor_name?.toLowerCase().includes(assignmentSearch.toLowerCase()) || false) ||
      (a.investor_email?.toLowerCase().includes(assignmentSearch.toLowerCase()) || false);
    const matchesProject = !assignmentProjectFilter || a.project_id === Number(assignmentProjectFilter);
    return matchesSearch && matchesProject;
  });
  const paginatedAssignments = filteredAssignments.slice((assignmentPage - 1) * 10, assignmentPage * 10);
  const assignmentTotalPages = Math.max(1, Math.ceil(filteredAssignments.length / 10));

  // Navigation Items
  const sidebarNav = (closeMenu: () => void) => (
    <nav className="flex-1 space-y-1.5 pt-2">
      {[
        { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
        { id: 'projects', label: 'Projects', icon: Building2, hidden: isSupportAgent },
        { id: 'investors', label: 'Investor Directory', icon: Users, hidden: isSiteManager || isMarketingManager || isSupportAgent },
        { id: 'ledger', label: 'Investment Ledger', icon: BookOpen, hidden: isSiteManager || isMarketingManager || isSupportAgent },
        { id: 'queries', label: 'Inquiries & Site Visits', icon: MessageCircle },
        { id: 'admins', label: 'Staff & Roles', icon: Shield, hidden: !isSuperAdmin },
      ].filter(item => !item.hidden).map((item) => {
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => { setActiveView(item.id as any); closeMenu(); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-xs sm:text-sm cursor-pointer",
              isActive
                ? "bg-redhill-charcoal text-white shadow-xs border border-redhill-charcoal font-semibold"
                : "text-stone-700 hover:text-redhill-charcoal hover:bg-redhill-sand/70 border border-transparent"
            )}
          >
            <item.icon className={cn("w-4 h-4", isActive ? "text-redhill-gold-soft" : "text-redhill-muted")} />
            <span className="flex-1 text-left">{item.label}</span>
            {item.id === 'queries' && unansweredCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 bg-redhill-red text-white text-[10px] font-medium rounded flex items-center justify-center tabular-nums">
                {unansweredCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <Layout user={user} onLogout={handleLogout} sidebarContent={sidebarNav}>
      <div className={cn("p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto w-full pb-10", activeView === 'queries' ? "h-full flex flex-col" : "")}>
        {/* Overview Tab */}
        {activeView === 'overview' && (
          <AdminOverview
            user={user}
            projects={projects}
            investors={investors}
            threads={threads}
            ledgerEntries={ledgerEntries}
            unansweredCount={unansweredCount}
            adminsCount={adminsList.length}
            analytics={analyticsData}
            setActiveView={setActiveView}
            onNewProject={() => setShowProjectModal(true)}
            onNewInvestor={() => setShowInvestorModal(true)}
            onSelectProject={openProjectDrawer}
          />
        )}

        {/* Projects Tab */}
        {activeView === 'projects' && !isSupportAgent && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-redhill-line">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-redhill-muted font-medium mb-1">
                  Developments
                </p>
                <h1 className="text-2xl sm:text-3xl font-normal text-redhill-charcoal tracking-tight">Project Management</h1>
                <p className="text-redhill-muted mt-1 text-xs sm:text-sm">Manage developments, milestone schedules, and site progress updates.</p>
              </div>
              {!isSiteManager && (
                <button
                  onClick={() => setShowProjectModal(true)}
                  className="bg-redhill-red hover:bg-red-700 text-white px-4 py-2.5 rounded-md font-medium flex items-center gap-2 transition-colors cursor-pointer text-xs sm:text-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>New Project</span>
                </button>
              )}
            </div>

            {projects.length === 0 ? (
              <div className="bg-white border border-redhill-line rounded-lg p-12 text-center">
                <Building2 className="w-7 h-7 text-redhill-muted/60 mx-auto mb-3" />
                <p className="text-sm font-medium text-redhill-charcoal">No developments added yet</p>
                <p className="text-xs text-redhill-muted mt-1 max-w-sm mx-auto">
                  Create your first project to upload architectural imagery, monthly progress photos, and documents.
                </p>
                {!isSiteManager && (
                  <button
                    onClick={() => setShowProjectModal(true)}
                    className="mt-5 inline-flex items-center gap-2 bg-redhill-red hover:bg-red-700 text-white px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>New Project</span>
                  </button>
                )}
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {projects.map(p => (
                <div 
                  key={p.id} 
                  className="bg-white rounded-lg border border-redhill-line overflow-hidden flex flex-col hover:border-redhill-charcoal/40 transition-colors group cursor-pointer"
                  onClick={() => openProjectDrawer(p)}
                >
                  <div className="h-48 relative overflow-hidden bg-redhill-ivory">
                    <img
                      src={getAssetUrl(p.image_url, p.id)}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getAssetUrl(null, p.id);
                      }}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                    <div className="absolute top-3 right-3 rounded-md bg-white/95 border border-redhill-line">
                      <StatusChip status={p.status} />
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-1">
                        <h3 className="text-base font-medium text-redhill-charcoal leading-snug group-hover:text-redhill-red transition-colors">
                          {p.name}
                        </h3>
                        <Link
                          to={`/project/${p.id}`}
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 hover:bg-redhill-ivory text-redhill-muted hover:text-redhill-charcoal rounded-md transition-colors border border-redhill-line"
                          title="Preview as Investor"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                      <p className="text-xs text-redhill-muted flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-redhill-muted shrink-0" />
                        <span className="truncate">{p.location}</span>
                      </p>
                    </div>
                    
                    <div className="space-y-3 pt-3 border-t border-redhill-line">
                      <div>
                        <div className="flex justify-between text-xs text-redhill-muted mb-1.5">
                          <span>Completion</span>
                          <span className="font-mono text-redhill-charcoal tabular-nums">{p.completion_percentage}%</span>
                        </div>
                        <div className="w-full bg-redhill-ivory h-1 rounded-full overflow-hidden">
                          <div 
                            className="bg-redhill-charcoal h-full transition-all duration-500" 
                            style={{ width: `${p.completion_percentage}%` }} 
                          />
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openProjectDrawer(p);
                        }}
                        className="w-full py-2.5 bg-redhill-ivory hover:bg-redhill-charcoal text-redhill-charcoal hover:text-white text-xs font-medium rounded-md transition-colors border border-redhill-line cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>Manage Milestones &amp; Updates</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {/* Investors Tab */}
        {activeView === 'investors' && (isSuperAdmin || isFinancialOfficer) && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-redhill-line">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-redhill-muted font-medium mb-1">
                  Client Relations
                </p>
                <h1 className="text-2xl sm:text-3xl font-normal text-redhill-charcoal tracking-tight">Investor Directory &amp; Allocations</h1>
                <p className="text-redhill-muted mt-1 text-xs sm:text-sm">Manage investor accounts, login credentials, and project allocations.</p>
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="px-4 py-2.5 bg-white hover:bg-redhill-ivory text-redhill-charcoal rounded-md font-medium border border-redhill-line transition-colors flex items-center gap-2 cursor-pointer text-xs sm:text-sm"
                >
                  <PlusCircle className="w-4 h-4 text-redhill-muted" />
                  <span>Assign Project</span>
                </button>
                <button
                  onClick={() => setShowInvestorModal(true)}
                  className="px-4 py-2.5 bg-redhill-red hover:bg-red-700 text-white rounded-md font-medium transition-colors flex items-center gap-2 cursor-pointer text-xs sm:text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Investor</span>
                </button>
              </div>
            </div>

            {/* Investors Table */}
            <div className="bg-white rounded-lg border border-redhill-line overflow-hidden">
              <div className="px-6 py-4 border-b border-redhill-line flex flex-col sm:flex-row justify-between items-center gap-4 bg-redhill-ivory/50">
                <h2 className="font-medium text-redhill-charcoal text-base">Registered Investors ({investors.length})</h2>
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-redhill-muted" />
                  <input
                    type="text"
                    placeholder="Search name, email, or ID..."
                    value={investorSearch}
                    onChange={(e) => setInvestorSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-redhill-line rounded-md outline-none text-xs sm:text-sm text-redhill-charcoal focus:border-redhill-charcoal"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-redhill-ivory/40 border-b border-redhill-line text-[11px] font-medium text-redhill-muted uppercase tracking-[0.12em]">
                      <th className="px-6 py-3.5">Investor</th>
                      <th className="px-6 py-3.5">Email</th>
                      <th className="px-6 py-3.5">Login ID</th>
                      <th className="px-6 py-3.5">Phone</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-redhill-line text-sm">
                    {paginatedInvestors.map(i => (
                      <tr key={i.id} className="hover:bg-redhill-ivory/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-md bg-redhill-ivory border border-redhill-line flex items-center justify-center text-redhill-charcoal font-medium text-xs">
                              {i.name ? i.name.charAt(0).toUpperCase() : 'I'}
                            </div>
                            <span className="font-medium text-redhill-charcoal">{i.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-redhill-muted text-xs">{i.email}</td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs text-redhill-charcoal">
                            {i.login_id || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-redhill-muted text-xs tabular-nums">{i.phone || '—'}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteInvestor(i.id, i.name)}
                            className="p-2 text-redhill-muted hover:text-redhill-red hover:bg-redhill-ivory rounded-md transition-colors cursor-pointer"
                            title="Delete Investor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Assignments Table */}
            {assignments.length > 0 && (
              <div className="bg-white rounded-lg border border-redhill-line overflow-hidden">
                <div className="px-6 py-4 border-b border-redhill-line bg-redhill-ivory/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-medium text-redhill-charcoal text-base">Active Portfolio Allocations</h2>
                    <p className="text-xs text-redhill-muted mt-0.5">Assigned developments and allotted area per investor.</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-redhill-ivory border-b border-redhill-line text-[10px] font-black text-redhill-muted uppercase tracking-widest">
                        <th className="px-5 py-3">Investor</th>
                        <th className="px-5 py-3">Project</th>
                        <th className="px-5 py-3">Investment</th>
                        <th className="px-5 py-3">Allotted Area</th>
                        <th className="px-5 py-3">Market Rate</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-redhill-line">
                      {paginatedAssignments.map((a: any) => (
                        <tr key={`${a.user_id}-${a.project_id}`} className="hover:bg-[#FBF9F5] transition-colors">
                          <td className="px-5 py-3 font-bold text-redhill-charcoal">{a.investor_name}</td>
                          <td className="px-5 py-3 text-stone-700">{a.project_name}</td>
                          <td className="px-5 py-3 font-bold text-redhill-charcoal">{a.contribution || formatCurrency(a.investment_amount)}</td>
                          <td className="px-5 py-3 text-stone-700">{a.allotted_sqft?.toLocaleString('en-IN') || 0} sqft</td>
                          <td className="px-5 py-3 text-emerald-700 font-bold">{formatCurrency(a.market_price_per_sqft)}/sqft</td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => { setTargetAssignment(a); setShowPaymentModal(true); }}
                                className="p-2 text-redhill-muted hover:text-emerald-700 bg-redhill-sand/70 hover:bg-emerald-500/10 rounded-lg transition-all cursor-pointer border border-redhill-line"
                                title="Record Payment / Invoice"
                              >
                                <IndianRupee className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setTargetAssignment(a); setShowSubInvestmentModal(true); }}
                                className="px-3 py-1.5 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border border-emerald-500/20"
                                title="Add Sub-Investment"
                              >
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span>Upgrade</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Investment Ledger Tab */}
        {activeView === 'ledger' && (isSuperAdmin || isFinancialOfficer) && (
          <InvestmentLedger ledgerEntries={ledgerEntries} projects={projects} />
        )}

        {/* Admin Management Tab */}
        {activeView === 'admins' && isSuperAdmin && (
          <AdminManagement
            adminsList={adminsList}
            currentUserId={user.id}
            onAddNewAdmin={() => setShowAdminModal(true)}
            onEditAdmin={(admin) => { setEditingAdmin(admin); setShowEditAdminModal(true); }}
            onDeleteAdmin={handleDeleteAdmin}
          />
        )}

        {/* Queries Tab */}
        {activeView === 'queries' && (
          <AdminQueries />
        )}
      </div>

      {/* Modular Modals */}
      <CreateAdminModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onSubmit={handleCreateAdmin}
      />

      <EditAdminModal
        isOpen={showEditAdminModal}
        admin={editingAdmin}
        onClose={() => { setShowEditAdminModal(false); setEditingAdmin(null); }}
        onSubmit={handleUpdateAdmin}
      />

      <CreateProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onSubmit={handleCreateProject}
      />

      <CreateInvestorModal
        isOpen={showInvestorModal}
        onClose={() => setShowInvestorModal(false)}
        onSubmit={handleCreateInvestor}
      />

      <AssignProjectModal
        isOpen={showAssignModal}
        investors={investors}
        projects={projects}
        onClose={() => setShowAssignModal(false)}
        onSubmit={handleAssignProject}
      />

      <RecordPaymentModal
        isOpen={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setTargetAssignment(null); }}
        onSubmit={handleRecordPayment}
      />

      <SubInvestmentModal
        isOpen={showSubInvestmentModal}
        assignment={targetAssignment}
        onClose={() => { setShowSubInvestmentModal(false); setTargetAssignment(null); }}
        onSubmit={handleAddSubInvestment}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Project Drawer for Milestones, Updates & CCTV */}
      {selectedProject && (
        <ProjectDrawer
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onRefreshProjects={refetchProjects}
        />
      )}
    </Layout>
  );
}
