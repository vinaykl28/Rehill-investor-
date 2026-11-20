import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User } from '../types';
import {
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  User as UserIcon,
  Phone,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Menu,
  X,
  Landmark,
  Activity,
  BookOpen,
  Camera,
  MessageCircle,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import Logo from '../components/Logo';
import Reveal from '../components/Reveal';
import { apiFetch } from '../api/client';

type AuthMode = 'login' | 'signup' | 'forgot_request' | 'forgot_reset';

interface LoginProps {
  onLogin: (user: User) => void;
}

const EXPERIENCE_IMAGE = '/assets/projects/pinnacle-heights.jpg';
const ACCESS_EDITORIAL_IMAGE = '/assets/projects/signature-towers.jpg';

const NAV_LINKS = [
  { id: 'experience', label: 'Investor Experience' },
  { id: 'access', label: 'Investor Access' },
  { id: 'contact', label: 'Contact Us' },
];

const iconCls = 'absolute left-3.5 top-1/2 -translate-y-1/2 text-redhill-muted w-[17px] h-[17px] pointer-events-none';
const toggleCls = 'absolute right-3 top-1/2 -translate-y-1/2 text-redhill-muted hover:text-redhill-charcoal transition-colors cursor-pointer p-1';
const errorCls = 'p-3.5 bg-red-50 border border-red-200 text-red-800 text-sm rounded-md font-medium';
const successCls = 'p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-md font-medium flex items-center gap-2';

const Spinner = () => (
  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden="true" />
);

export default function Login({ onLogin }: LoginProps) {
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  // Login / Signup state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password & reset state
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Status & feedback state
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Landing presentation state
  const reduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [accessDrawerOpen, setAccessDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [entering, setEntering] = useState(false);

  const inlineFormRef = useRef<HTMLDivElement>(null);
  const drawerFormRef = useRef<HTMLDivElement>(null);
  const activeSectionRef = useRef<string | null>(null);
  activeSectionRef.current = activeSection;

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);


  const completeLogin = (user: User) => {
    setEntering(true);
    window.setTimeout(() => onLogin(user), reduceMotion ? 0 : 240);
  };

  // Countdown timer for resending OTP
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Track which section is in view
  useEffect(() => {
    const els = NAV_LINKS.map(l => document.getElementById(l.id)).filter(Boolean) as HTMLElement[];
    if (!('IntersectionObserver' in window) || els.length === 0) return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
          else if (entry.target.id === activeSectionRef.current && entry.boundingClientRect.top > 0) setActiveSection(null);
        });
      },
      { rootMargin: '-40% 0px -45% 0px' }
    );
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Escape & scroll lock for mobile nav and access drawer
  useEffect(() => {
    if (!mobileNavOpen && !accessDrawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileNavOpen(false);
        setAccessDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileNavOpen, accessDrawerOpen]);

  // Focus first field when the slide-over access drawer opens
  useEffect(() => {
    if (!accessDrawerOpen) return;
    const t = window.setTimeout(() => {
      drawerFormRef.current?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
    }, reduceMotion ? 0 : 220);
    return () => window.clearTimeout(t);
  }, [accessDrawerOpen, reduceMotion]);

  const openAccessDrawer = useCallback((mode?: 'login' | 'signup') => {
    setMobileNavOpen(false);
    if (mode) { setAuthMode(mode); setError(''); setSuccessMsg(''); }
    setAccessDrawerOpen(true);
  }, []);

  const scrollToAccessSection = useCallback(() => {
    setMobileNavOpen(false);
    const el = document.getElementById('access');
    el?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    window.setTimeout(() => {
      inlineFormRef.current?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
    }, reduceMotion ? 0 : 500);
  }, [reduceMotion]);

  const scrollToSection = (id: string) => {
    setMobileNavOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  // =====================================================================
  // EXISTING AUTH HANDLERS (preserved verbatim)
  // =====================================================================
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const isLogin = authMode === 'login';
      const endpoint = isLogin ? '/api/login' : '/api/signup';
      const cleanEmail = email.trim();
      const cleanName = name.trim();
      const cleanPhone = phone.trim();

      const body = isLogin
        ? { email: cleanEmail, password }
        : { name: cleanName, email: cleanEmail, phone: cleanPhone, password };

      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const user = await res.json();
        if (user.token) {
          try {
            localStorage.setItem('redhill_auth_token', user.token);
          } catch {
            // ignore storage errors in private browsing
          }
        }
        completeLogin(user);
      } else {
        const data = await res.json().catch(() => ({ error: `Server error (${res.status})` }));
        setError(data.error || (isLogin ? 'Login failed' : 'Sign up failed'));
      }
    } catch (err: any) {
      console.error('Auth request failed:', err);
      setError(err?.message || 'Something went wrong. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const identifier = forgotIdentifier.trim() || email.trim();
    if (!identifier) {
      setError('Please enter your email, Login ID, or phone number');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await apiFetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTargetEmail(data.email);
        setMaskedEmail(data.maskedEmail || data.email);
        setSuccessMsg(`Verification code sent to ${data.maskedEmail || data.email}`);
        setAuthMode('forgot_reset');
        setResendTimer(45);
        setOtpDigits(['', '', '', '', '', '']);
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 300);
      } else {
        setError(data.error || 'Failed to send verification code. Please check your details.');
      }
    } catch (err: any) {
      console.error('Forgot password request failed:', err);
      setError(err?.message || 'Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = otpDigits.join('').trim();

    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP code');
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      setError('Password must be at least 4 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await apiFetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          otp,
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('redhill_auth_token', data.token);
        setSuccessMsg('Password reset successfully! Logging you in...');
        setTimeout(() => {
          onLogin(data);
        }, 600);
      } else {
        setError(data.error || 'Failed to reset password. Please verify the OTP.');
      }
    } catch (err: any) {
      console.error('Password reset failed:', err);
      setError(err?.message || 'Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    if (cleanVal.length > 1) {
      const chars = cleanVal.slice(0, 6).split('');
      const newDigits = [...otpDigits];
      chars.forEach((c, i) => {
        if (i < 6) newDigits[i] = c;
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(chars.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    if (cleanVal && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const switchToForgot = () => {
    setForgotIdentifier(email || '');
    setError('');
    setSuccessMsg('');
    setAuthMode('forgot_request');
  };

  const switchToLogin = () => {
    setError('');
    setSuccessMsg('');
    setAuthMode('login');
  };

  const rise = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  const panelHeading =
    authMode === 'login'
      ? {
          title: 'Welcome to Your Private Portfolio',
          sub: 'Access your investments, project updates and important documents in one place.',
        }
      : authMode === 'signup'
      ? {
          title: 'Create Your Investor Account',
          sub: 'Register your profile to access Redhill residential developments and portfolio records.',
        }
      : authMode === 'forgot_request'
      ? {
          title: 'Reset Your Password',
          sub: 'Enter your registered account details to receive a 6-digit verification code.',
        }
      : {
          title: 'Verify & Set New Password',
          sub: 'Confirm your 6-digit code and choose a new password.',
        };

  // =====================================================================
  // Shared Authentication Form (rendered both in the inline #access
  // section and in the slide-over drawer; state is shared so entered
  // values are always preserved).
  // =====================================================================
  const renderAuthForm = (prefix: string) => (
    <div>
      {(authMode === 'login' || authMode === 'signup') && (
        <div role="tablist" aria-label="Authentication mode" className="grid grid-cols-2 border-b border-redhill-line mb-6">
          {(['login', 'signup'] as const).map(mode => (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={authMode === mode}
              onClick={() => { setAuthMode(mode); setError(''); setSuccessMsg(''); }}
              className={`relative pb-3 text-xs uppercase tracking-[0.16em] font-semibold transition-colors cursor-pointer ${
                authMode === mode ? 'text-rh-botanical' : 'text-redhill-muted hover:text-rh-botanical'
              }`}
            >
              {mode === 'login' ? 'Sign In' : 'Create Account'}
              {authMode === mode && (
                <span className="absolute inset-x-0 -bottom-px h-[2px] bg-rh-botanical" />
              )}
            </button>
          ))}
        </div>
      )}

      {(authMode === 'login' || authMode === 'signup') && (
        <form onSubmit={handleAuthSubmit} className="space-y-5">
          {authMode === 'signup' && (
            <>
              <div>
                <label htmlFor={`${prefix}-name`} className="field-label">Full Name</label>
                <div className="relative">
                  <UserIcon className={iconCls} />
                  <input
                    id={`${prefix}-name`}
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="field field-icon-left"
                    placeholder="Full legal name"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor={`${prefix}-phone`} className="field-label">Phone Number</label>
                <div className="relative">
                  <Phone className={iconCls} />
                  <input
                    id={`${prefix}-phone`}
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="field field-icon-left"
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor={`${prefix}-id`} className="field-label">
              {authMode === 'login' ? 'Email, Login ID or Phone Number' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className={iconCls} />
              <input
                id={`${prefix}-id`}
                type="text"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field field-icon-left"
                placeholder={authMode === 'login' ? 'name@example.com, jo210 or +91…' : 'name@example.com'}
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor={`${prefix}-pwd`} className="field-label mb-0">Password</label>
              {authMode === 'login' && (
                <button
                  type="button"
                  onClick={switchToForgot}
                  className="text-xs font-medium text-redhill-red hover:text-redhill-crimson transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className={iconCls} />
              <input
                id={`${prefix}-pwd`}
                type={showPassword ? 'text' : 'password'}
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field field-icon-left field-icon-right"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={toggleCls}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <div role="alert" className={errorCls}>{error}</div>}
          {successMsg && (
            <div role="status" className={successCls}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 group">
            {loading ? (
              <><Spinner />{authMode === 'login' ? 'Signing In…' : 'Registering…'}</>
            ) : (
              <>
                {authMode === 'login' ? 'Sign In to Portfolio' : 'Create Account'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-redhill-muted pt-1">
            Dedicated portal for registered Redhill Infra investors and partners.
          </p>
        </form>
      )}

      {authMode === 'forgot_request' && (
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-3.5 bg-redhill-ivory border border-redhill-line rounded-md">
            <KeyRound className="w-4 h-4 text-redhill-gold shrink-0 mt-0.5" />
            <p className="text-xs text-redhill-muted leading-relaxed">
              Enter your registered email, Login ID or phone number to receive a 6-digit verification code.
            </p>
          </div>
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label htmlFor={`${prefix}-forgot`} className="field-label">Account Identifier</label>
              <div className="relative">
                <Mail className={iconCls} />
                <input
                  id={`${prefix}-forgot`}
                  type="text"
                  autoComplete="username"
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  className="field field-icon-left"
                  placeholder="Email, Login ID or phone number"
                  required
                />
              </div>
            </div>
            {error && <div role="alert" className={errorCls}>{error}</div>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
              {loading ? <><Spinner />Sending Code…</> : <>Send Verification Code<ArrowRight className="w-4 h-4" /></>}
            </button>
            <button
              type="button"
              onClick={switchToLogin}
              className="w-full py-2 text-xs text-redhill-muted hover:text-redhill-charcoal inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </button>
          </form>
        </div>
      )}

      {authMode === 'forgot_reset' && (
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-3.5 bg-redhill-ivory border border-redhill-line rounded-md">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="text-xs text-redhill-muted leading-relaxed">
              Enter the 6-digit code sent to <strong className="text-redhill-charcoal">{maskedEmail || targetEmail}</strong>.
            </p>
          </div>

          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="field-label mb-0">6-Digit Verification Code</span>
                <button
                  type="button"
                  disabled={resendTimer > 0 || loading}
                  onClick={() => handleRequestOtp()}
                  className="text-xs font-medium text-redhill-red hover:text-redhill-crimson disabled:opacity-50 cursor-pointer inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                </button>
              </div>
              <div className="grid grid-cols-6 gap-2" role="group" aria-label="Verification code">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { if (prefix === 'inline' || accessDrawerOpen) otpInputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                    aria-label={`Digit ${idx + 1}`}
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="field px-0 h-12 text-center text-lg font-semibold tabular"
                  />
                ))}
              </div>
            </div>

            <div>
              <label htmlFor={`${prefix}-newpwd`} className="field-label">New Password</label>
              <div className="relative">
                <Lock className={iconCls} />
                <input
                  id={`${prefix}-newpwd`}
                  type={showNewPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="field field-icon-left field-icon-right"
                  placeholder="At least 4 characters"
                  required
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className={toggleCls} tabIndex={-1} aria-label={showNewPassword ? 'Hide password' : 'Show password'}>
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor={`${prefix}-cfmpwd`} className="field-label">Confirm New Password</label>
              <div className="relative">
                <Lock className={iconCls} />
                <input
                  id={`${prefix}-cfmpwd`}
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="field field-icon-left field-icon-right"
                  placeholder="Re-type new password"
                  required
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className={toggleCls} tabIndex={-1} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <div role="alert" className={errorCls}>{error}</div>}
            {successMsg && (
              <div role="status" className={successCls}>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
              {loading ? <><Spinner />Updating Password…</> : <>Reset Password &amp; Sign In<ArrowRight className="w-4 h-4" /></>}
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button type="button" onClick={() => { setAuthMode('forgot_request'); setError(''); }} className="text-redhill-muted hover:text-redhill-charcoal cursor-pointer">
                ← Change Identifier
              </button>
              <button type="button" onClick={switchToLogin} className="text-redhill-red hover:text-redhill-crimson cursor-pointer">
                Back to Sign In
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-redhill-ivory text-redhill-charcoal">

      {/* ================================================================ */}
      {/* MINIMAL IVORY NAVIGATION BAR                                      */}
      {/* ================================================================ */}
      <header
        className={`fixed top-0 inset-x-0 z-40 bg-rh-ivory/95 backdrop-blur-sm border-b transition-shadow duration-300 ${
          scrolled ? 'border-rh-stone shadow-[0_8px_24px_-20px_rgba(32,58,43,0.35)]' : 'border-rh-stone/60'
        }`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="page-container h-16 sm:h-20 grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center gap-4">
          <a
            href="#top"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); }}
            aria-label="Redhill Infra — home"
            className="justify-self-start shrink-0"
          >
            <Logo />
          </a>

          <nav aria-label="Primary" className="hidden md:flex items-center justify-center gap-8 lg:gap-11 justify-self-center">
            {NAV_LINKS.map(link => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => { e.preventDefault(); scrollToSection(link.id); }}
                aria-current={activeSection === link.id ? 'true' : undefined}
                className={`nav-link text-[13px] tracking-[0.06em] whitespace-nowrap transition-colors duration-300 ${
                  activeSection === link.id ? 'text-rh-botanical font-semibold' : 'text-rh-botanical/70 hover:text-rh-botanical font-medium'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-2 justify-self-end">
            <button
              type="button"
              onClick={() => openAccessDrawer('login')}
              className="hidden sm:inline-flex items-center gap-2 min-h-[42px] px-5 text-[11px] font-medium tracking-[0.16em] uppercase border border-rh-botanical/40 text-rh-botanical hover:border-rh-botanical hover:bg-rh-botanical hover:text-rh-ivory transition-colors cursor-pointer whitespace-nowrap"
            >
              <Lock className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-nav"
              className="md:hidden w-11 h-11 inline-flex items-center justify-center text-rh-botanical hover:bg-rh-stone/40 transition-colors cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <div className="md:hidden fixed inset-0 z-50" id="mobile-nav" role="dialog" aria-modal="true" aria-label="Navigation">
            <motion.div
              className="absolute inset-0 bg-redhill-ink/45"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.div
              className="absolute right-0 top-0 h-full w-[86%] max-w-sm bg-rh-ivory border-l border-rh-stone flex flex-col"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="h-20 px-5 flex items-center justify-between border-b border-redhill-line">
                <Logo />
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Close navigation menu"
                  autoFocus
                  className="w-11 h-11 inline-flex items-center justify-center rounded-md text-redhill-charcoal hover:bg-redhill-sand transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav aria-label="Mobile" className="flex-1 px-5 py-6 flex flex-col">
                {NAV_LINKS.map((link, i) => (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => scrollToSection(link.id)}
                    className="text-left min-h-[56px] border-b border-rh-stone flex items-center justify-between text-base font-medium text-rh-botanical cursor-pointer"
                  >
                    <span><span className="text-redhill-gold text-xs font-mono tracking-[0.18em] mr-3">0{i + 1}</span>{link.label}</span>
                    <ArrowRight className="w-4 h-4 text-redhill-muted" />
                  </button>
                ))}
              </nav>
              <div className="p-5 border-t border-rh-stone" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
                <button type="button" onClick={() => openAccessDrawer('login')} className="btn-botanical w-full">
                  <Lock className="w-4 h-4" />
                  Investor Access
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================================================================ */}
      {/* SLIDE-OVER INVESTOR ACCESS DRAWER                                 */}
      {/* ================================================================ */}
      <AnimatePresence>
        {accessDrawerOpen && (
          <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Investor Access">
            <motion.div
              className="absolute inset-0 bg-redhill-ink/45 backdrop-blur-[2px]"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setAccessDrawerOpen(false)}
            />
            <motion.div
              ref={drawerFormRef}
              className="absolute right-0 top-0 h-full w-full max-w-[460px] bg-white border-l border-redhill-line shadow-2xl flex flex-col overflow-y-auto"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="h-20 px-6 sm:px-8 border-b border-redhill-line flex items-center justify-between shrink-0">
                <span className="eyebrow text-redhill-gold">Redhill Investor Portal</span>
                <button
                  type="button"
                  onClick={() => setAccessDrawerOpen(false)}
                  aria-label="Close Investor Access"
                  className="w-10 h-10 inline-flex items-center justify-center rounded-md text-redhill-muted hover:text-redhill-charcoal hover:bg-redhill-sand transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 sm:p-8 flex-1">
                <h2 className="font-serif text-2xl sm:text-3xl text-redhill-charcoal font-semibold tracking-tight">
                  {panelHeading.title}
                </h2>
                <p className="text-sm text-redhill-muted mt-1.5 mb-7 leading-relaxed">{panelHeading.sub}</p>
                {renderAuthForm('drawer')}
              </div>

              <div className="px-6 sm:px-8 py-4 border-t border-redhill-line bg-redhill-ivory text-xs text-redhill-muted flex items-center justify-between">
                <span>Concierge Desk</span>
                <span className="font-mono text-redhill-charcoal">invest@redhillinfra.com</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================================================================ */}
      {/* SPLIT-SCREEN ARCHITECTURAL COVER                                  */}
      {/* Desktop: 52% architectural image (left) / 48% ivory editorial    */}
      {/* Mobile:  image -> headline -> copy -> actions (stacked)          */}
      {/* ================================================================ */}
      <section id="top" className="relative bg-rh-ivory text-rh-botanical pt-16 sm:pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-[52fr_48fr] lg:min-h-[calc(100dvh-5rem)]">
          {/* LEFT — Architectural image */}
          <div className="relative overflow-hidden bg-rh-stone aspect-[4/5] sm:aspect-[4/3] lg:aspect-auto lg:h-full">
            <picture className="block w-full h-full">
              <source
                type="image/avif"
                srcSet="/assets/projects/hero-split-800.avif 800w, /assets/projects/hero-split-1200.avif 1200w, /assets/projects/hero-split-1920.avif 1920w"
                sizes="(min-width: 1024px) 52vw, 100vw"
              />
              <source
                type="image/webp"
                srcSet="/assets/projects/hero-split-800.webp 800w, /assets/projects/hero-split-1200.webp 1200w, /assets/projects/hero-split-1920.webp 1920w"
                sizes="(min-width: 1024px) 52vw, 100vw"
              />
              <img
                src="/assets/projects/hero-split-1200.jpg"
                srcSet="/assets/projects/hero-split-800.jpg 800w, /assets/projects/hero-split-1200.jpg 1200w, /assets/projects/hero-split-1920.jpg 1920w"
                sizes="(min-width: 1024px) 52vw, 100vw"
                width={1920}
                height={2160}
                alt="Conceptual render of a Redhill Infra residential tower with curved balconies, integrated greenery and warm wooden soffits"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover object-[50%_40%] select-none"
              />
            </picture>
            <span className="absolute left-4 bottom-4 sm:left-6 sm:bottom-6 text-[10px] uppercase tracking-[0.2em] text-white/90 bg-black/25 px-2.5 py-1">
              Conceptual render
            </span>
          </div>

          {/* RIGHT — Editorial content */}
          <div className="flex items-center">
            <div className="w-full px-5 sm:px-10 md:px-12 lg:px-12 xl:px-20 py-12 sm:py-16 lg:py-20 max-w-[740px]">
              <motion.p {...rise(0.05)} className="text-[11px] sm:text-xs uppercase tracking-[0.24em] text-rh-champagne font-medium mb-6 sm:mb-8">
                Redhill Infra · Bengaluru
              </motion.p>

              <motion.h1
                {...rise(0.12)}
                className="font-serif font-light uppercase text-rh-botanical text-[clamp(1.85rem,3.05vw,3.35rem)] leading-[1.08] tracking-[0.015em]"
              >
                Spaces that inspire.
                <span className="block">Homes that belong.</span>
              </motion.h1>

              <motion.div {...rise(0.2)} className="h-px w-20 bg-rh-stone my-7 sm:my-9" aria-hidden="true" />

              <motion.p {...rise(0.24)} className="text-[15px] sm:text-base lg:text-[17px] leading-relaxed text-rh-botanical/80 font-light max-w-md">
                Thoughtfully designed residences where contemporary architecture, nature and everyday comfort come together.
              </motion.p>

              <motion.p {...rise(0.28)} className="mt-6 font-serif italic text-xl sm:text-2xl text-rh-botanical">
                Discover Redhill Infra.
              </motion.p>

              <motion.div {...rise(0.34)} className="mt-9 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button type="button" onClick={() => scrollToSection('experience')} className="btn-botanical w-full sm:w-auto">
                  Explore Our Projects
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button type="button" onClick={scrollToAccessSection} className="btn-botanical-outline w-full sm:w-auto">
                  <Lock className="w-3.5 h-3.5" />
                  Investor Access
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 01 — THE INVESTOR EXPERIENCE (Swan Realty Bodhi Editorial Style) */}
      {/* ================================================================ */}
      <section id="experience" className="relative bg-rh-ivory border-t text-rh-botanical py-20 sm:py-28 lg:py-36 overflow-hidden border-b border-rh-stone">
        <div className="page-container relative">
          
          {/* Section Heading */}
          <div className="relative z-20 mb-8 sm:mb-12 lg:mb-14">
            <Reveal>
              <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
                <span className="w-6 sm:w-10 h-px bg-rh-botanical/40" />
                <span className="text-[10px] sm:text-xs uppercase tracking-[0.22em] text-rh-botanical/75 font-semibold">
                  01 — Portfolio Transparency
                </span>
              </div>
              <h2 className="font-serif text-[clamp(2.2rem,4.8vw,4.2rem)] font-light text-rh-botanical tracking-[0.03em] sm:tracking-[0.04em] leading-[1.05] uppercase select-none">
                The Investor Experience
              </h2>
            </Reveal>
          </div>

          {/* Two-Column Bodhi Layout: 50-55% Image (Left) + Editorial Content (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-20 items-start lg:items-center">
            
            {/* Left Column: Architectural Photography (Occupying ~55% content width on desktop) */}
            <Reveal className="lg:col-span-7 xl:col-span-7 relative z-10">
              <div className="relative aspect-[4/5] sm:aspect-[16/11] lg:aspect-[4/3] rounded-xs overflow-hidden border border-rh-botanical/15 shadow-[0_24px_60px_-24px_rgba(48,75,54,0.18)] group bg-[#EDE4D8]">
                <img
                  src={EXPERIENCE_IMAGE}
                  alt="Redhill contemporary boutique residential high-rise architecture in Bengaluru"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1F3124]/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-5 sm:bottom-6 left-5 sm:left-6 right-5 sm:right-6 text-xs text-white/95 flex items-center justify-between border-t border-white/20 pt-3 sm:pt-3.5 backdrop-blur-xs">
                  <span className="uppercase tracking-[0.2em] font-medium text-[10px] sm:text-[11px]">Boutique High-Rise Living</span>
                  <span className="text-white/80 font-light text-[10px] sm:text-[11px]">12+ Storeys · Bengaluru</span>
                </div>
              </div>
            </Reveal>

            {/* Right Column: Investor Experience Description & Feature Breakdown (~45% width) */}
            <div className="lg:col-span-5 xl:col-span-5 relative z-20 space-y-7 sm:space-y-8">
              <Reveal>
                <h3 className="font-serif text-[clamp(1.75rem,2.7vw,2.65rem)] text-rh-botanical font-normal leading-[1.14] tracking-tight">
                  Every square foot, milestone and rupee — accounted for in real time.
                </h3>
                <p className="mt-4 sm:mt-5 text-rh-botanical/80 leading-relaxed text-sm sm:text-base lg:text-[16px] font-light">
                  Designed as a private residential ownership and investment portal, Redhill gives you direct visibility into your allocated area, construction stages, project documents, and capital ledger.
                </p>
              </Reveal>

              <ol className="divide-y divide-rh-botanical/12 border-y border-rh-botanical/15">
                {[
                  { icon: Activity, title: 'Stage-by-Stage Milestones', desc: 'Documentation, statutory approvals and construction progress tracked with recorded dates.' },
                  { icon: BookOpen, title: 'Audited Capital Ledger', desc: 'Initial assignments, additional allocations and allotted square footage recorded with buy rates.' },
                  { icon: Camera, title: 'Site Progress & Media', desc: 'Direct site camera feeds alongside dated progress photography and engineering dispatches.' },
                  { icon: MessageCircle, title: 'Executive Relationship Desk', desc: 'Project-specific communication thread with the Redhill Bengaluru team.' },
                ].map((item, i) => (
                  <Reveal as="li" key={item.title} delay={i * 0.05} className="py-4 sm:py-5 flex gap-3.5 sm:gap-4 items-start group">
                    <span className="font-serif text-rh-botanical/45 group-hover:text-rh-botanical transition-colors text-base sm:text-lg tabular w-6 shrink-0 font-light pt-0.5">
                      0{i + 1}
                    </span>
                    <div className="flex-1">
                      <h4 className="text-rh-botanical font-medium flex items-center gap-2 mb-1 text-sm tracking-wide">
                        <item.icon className="w-4 h-4 text-rh-botanical/80 shrink-0" />
                        {item.title}
                      </h4>
                      <p className="text-xs sm:text-[13px] text-rh-botanical/75 leading-relaxed font-light">
                        {item.desc}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </ol>
            </div>

          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 02 — INVESTOR ACCESS (Refined Two-Column Private Portfolio View)  */}
      {/* ================================================================ */}
      <section id="access" className="py-16 sm:py-24 lg:py-28 bg-white">
        <div className="page-container">
          <div className="overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-rh-stone bg-white">
            {/* Left Column: Architectural Imagery + Welcome Editorial Presentation */}
            <div className="lg:col-span-6 relative min-h-[260px] sm:min-h-[360px] lg:min-h-[620px] flex flex-col justify-between p-6 sm:p-10 lg:p-12 text-white bg-rh-forest overflow-hidden">
              <img
                src={ACCESS_EDITORIAL_IMAGE}
                alt="Redhill contemporary boutique high-rise residence in Bengaluru"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#16291E]/95 via-[#16291E]/75 to-[#16291E]/55" />

              <div className="relative z-10 flex items-center justify-between gap-4">
                <Logo light />
                <span className="eyebrow text-[#E3CFA3] border border-white/30 bg-rh-forest/40 px-2.5 sm:px-3 py-1 rounded-xs text-[10px] sm:text-xs">
                  Bengaluru
                </span>
              </div>

              <div className="relative z-10 space-y-3 sm:space-y-5 my-auto py-5 sm:py-8">
                <p className="eyebrow text-[#E3CFA3] flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
                  <span className="w-6 sm:w-8 h-px bg-[#E3CFA3]" />
                  02 — Private Investor Portal
                </p>
                <h2 className="font-serif text-[clamp(1.5rem,2.8vw,2.75rem)] text-white font-normal leading-[1.12]">
                  Contemporary residential communities, transparently managed.
                </h2>
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-md font-light line-clamp-3 sm:line-clamp-none">
                  Review your property allocations, allotted square footage, project milestones, documents, and capital ledger statements in one dedicated place.
                </p>
              </div>

              <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 sm:gap-4 pt-4 sm:pt-6 border-t border-white/20 text-xs">
                <div>
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.12em] sm:tracking-[0.16em] text-[#E3CFA3]">Developments</p>
                  <p className="text-white font-medium text-xs sm:text-sm mt-0.5">2 – 5 Acres</p>
                </div>
                <div>
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.12em] sm:tracking-[0.16em] text-[#E3CFA3]">Architecture</p>
                  <p className="text-white font-medium text-xs sm:text-sm mt-0.5">12+ Storeys</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.12em] sm:tracking-[0.16em] text-[#E3CFA3]">Support</p>
                  <p className="text-white font-medium text-xs sm:text-sm mt-0.5">Relationship Desk</p>
                </div>
              </div>
            </div>

            {/* Right Column: Minimal Login / Registration / Recovery Form */}
            <div ref={inlineFormRef} className="lg:col-span-6 p-6 sm:p-10 lg:p-14 flex flex-col justify-center bg-white">
              <div className="max-w-md w-full mx-auto">
                <div className="mb-7">
                  <p className="eyebrow text-rh-champagne mb-2">Investor Access</p>
                  <h3 className="font-serif text-2xl sm:text-3xl text-rh-botanical font-normal tracking-tight">
                    {panelHeading.title}
                  </h3>
                  <p className="text-sm text-redhill-muted mt-1.5 leading-relaxed">
                    {panelHeading.sub}
                  </p>
                </div>
                {renderAuthForm('inline')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us */}
      <section id="contact" className="bg-rh-ivory border-t border-rh-stone py-16 sm:py-20">
        <div className="page-container">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-xl">
              <p className="eyebrow text-rh-champagne">03 — Contact Us</p>
              <h2 className="font-serif text-[clamp(1.75rem,3vw,2.5rem)] text-rh-botanical font-light tracking-tight">
                Speak with the Redhill Bengaluru Desk
              </h2>
              <p className="text-sm text-redhill-muted">
                Questions about developments, investor onboarding, or scheduling a private site walkthrough? Reach our team directly.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 shrink-0 text-sm">
              <div className="border-l border-rh-stone pl-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-redhill-muted">Email</p>
                <a href="mailto:invest@redhillinfra.com" className="font-medium text-rh-botanical hover:text-rh-forest underline-offset-4 hover:underline transition-colors mt-0.5 block">
                  invest@redhillinfra.com
                </a>
              </div>
              <div className="border-l border-rh-stone pl-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-redhill-muted">Telephone</p>
                <a href="tel:+918041239000" className="font-medium text-rh-botanical hover:text-rh-forest underline-offset-4 hover:underline transition-colors tabular-nums mt-0.5 block">
                  +91 80 4123 9000
                </a>
              </div>
              <div className="border-l border-rh-stone pl-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-redhill-muted">Office Hours</p>
                <p className="font-medium text-rh-botanical mt-0.5">Mon–Sat · 9:30–18:30 IST</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-rh-ivory border-t border-rh-stone py-8" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
        <div className="page-container flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <Logo />
          <p className="text-xs text-redhill-muted">
            © {new Date().getFullYear()} Redhill Infra Pvt Ltd. Contemporary Boutique High-Rise Living · Bengaluru, India.
          </p>
        </div>
      </footer>

      {/* Post-login hand-off */}
      <AnimatePresence>
        {entering && (
          <motion.div
            className="fixed inset-0 z-[100] bg-redhill-ivory flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            aria-live="polite"
          >
            <span className="sr-only">Signing you in</span>
            <Logo />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
