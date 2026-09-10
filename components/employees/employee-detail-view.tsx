'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  KeyRound,
  UserX,
  UserCheck,
  Building,
  Phone,
  Mail,
  Calendar,
  Clock,
  Briefcase,
  TrendingUp,
  LifeBuoy,
  Users,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Save,
  X,
  Shield,
} from 'lucide-react';
import {
  updateEmployeeAction,
  toggleEmployeeStatusAction,
  resetEmployeePasswordAction,
} from '@/app/actions/employees';
import { TempPasswordModal } from '@/components/employees/temp-password-modal';
import { ROLE_CONFIG, type EmployeeData, type PerformanceSnapshotData } from '@/types/employee';
import type { UserRole } from '@/lib/auth/rbac';

interface EmployeeDetailViewProps {
  employee: EmployeeData;
  snapshot: PerformanceSnapshotData;
  currentUserId: string;
}

export function EmployeeDetailView({
  employee: initialEmployee,
  snapshot,
  currentUserId,
}: EmployeeDetailViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEditMode = searchParams.get('edit') === 'true';

  const [employee, setEmployee] = useState<EmployeeData>(initialEmployee);
  const [isEditing, setIsEditing] = useState(initialEditMode);

  // Edit form state
  const [name, setName] = useState(employee.name);
  const [email, setEmail] = useState(employee.email);
  const [role, setRole] = useState<UserRole>(employee.role);
  const [department, setDepartment] = useState(employee.department || '');
  const [phone, setPhone] = useState(employee.phone || '');
  const [joiningDate, setJoiningDate] = useState(
    employee.joiningDate ? new Date(employee.joiningDate).toISOString().split('T')[0] : ''
  );

  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Password reset state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [newTempPassword, setNewTempPassword] = useState<string | null>(null);

  // Status toggle state
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const isSelf = employee.id === currentUserId;
  const roleConfig = ROLE_CONFIG[employee.role] || {
    label: employee.role,
    badgeClass: 'bg-gray-100 text-gray-700',
  };

  // Handle profile update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveError(null);

    try {
      const res = await updateEmployeeAction({
        id: employee.id,
        name,
        email,
        role,
        department: department || null,
        phone: phone || null,
        joiningDate: joiningDate || null,
      });

      if (res.error) {
        setSaveError(res.error);
        return;
      }

      setEmployee((prev) => ({
        ...prev,
        name,
        email,
        role,
        department: department || null,
        phone: phone || null,
        joiningDate: joiningDate || null,
      }));
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      setSaveError('Failed to update employee details.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async () => {
    setResetLoading(true);
    setResetError(null);

    try {
      const res = await resetEmployeePasswordAction({ id: employee.id });
      if (res.error) {
        setResetError(res.error);
        return;
      }

      if (res.success && res.tempPassword) {
        setNewTempPassword(res.tempPassword);
        setShowResetConfirm(false);
      }
    } catch (err) {
      console.error(err);
      setResetError('Failed to reset employee password.');
    } finally {
      setResetLoading(false);
    }
  };

  // Handle status toggle
  const handleToggleStatus = async () => {
    setStatusLoading(true);
    setStatusError(null);

    try {
      const nextStatus = !employee.isActive;
      const res = await toggleEmployeeStatusAction({
        id: employee.id,
        isActive: nextStatus,
      });

      if (res.error) {
        setStatusError(res.error);
        return;
      }

      setEmployee((prev) => ({ ...prev, isActive: nextStatus }));
      setShowStatusConfirm(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      setStatusError('Failed to change status.');
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Breadcrumb & Actions Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/employees"
            className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {employee.name}
              </h1>
              {employee.employeeId && (
                <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                  {employee.employeeId}
                </span>
              )}
              {isSelf && (
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  Your Account
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{employee.email}</p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-muted transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-muted-foreground shadow-sm hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              <span>Cancel Edit</span>
            </button>
          )}

          {/* Reset Password Button */}
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-muted transition-colors"
          >
            <KeyRound className="h-3.5 w-3.5 text-amber-500" />
            <span>Reset Password</span>
          </button>

          {/* Status Toggle Button */}
          {employee.isActive ? (
            <button
              type="button"
              disabled={isSelf}
              onClick={() => !isSelf && setShowStatusConfirm(true)}
              title={
                isSelf
                  ? 'You cannot deactivate your own account'
                  : 'Deactivate this employee account'
              }
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-sm transition-colors ${
                isSelf
                  ? 'cursor-not-allowed opacity-40 bg-muted text-muted-foreground border border-border'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900'
              }`}
            >
              <UserX className="h-3.5 w-3.5" />
              <span>Deactivate Account</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowStatusConfirm(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900 px-3.5 py-2 text-xs font-semibold shadow-sm transition-colors"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Reactivate Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Profile Info & Performance Snapshot */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Employee Profile (Display or Edit Form) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">
                Employee Profile Details
              </h2>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${roleConfig.badgeClass}`}
                >
                  {roleConfig.label}
                </span>
                {employee.isActive ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                    Inactive
                  </span>
                )}
              </div>
            </div>

            {isEditing ? (
              /* Edit Form */
              <form onSubmit={handleSaveProfile} className="mt-5 space-y-5">
                {saveError && (
                  <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                    {saveError}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Role *
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                    >
                      <option value="SALES_EXECUTIVE">Sales Executive</option>
                      <option value="SUPPORT_AGENT">Support Agent</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Department
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Sales, Enterprise, Support"
                      className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Joining Date
                    </label>
                    <input
                      type="date"
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                      className="w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {saveLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Read-only View */
              <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Work Email
                  </span>
                  <p className="mt-1 text-sm font-medium text-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {employee.email}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Department
                  </span>
                  <p className="mt-1 text-sm font-medium text-foreground flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    {employee.department || 'Not specified'}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Phone Number
                  </span>
                  <p className="mt-1 text-sm font-medium text-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {employee.phone || 'Not specified'}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Joining Date
                  </span>
                  <p className="mt-1 text-sm font-medium text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {employee.joiningDate
                      ? new Date(employee.joiningDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'Not recorded'}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Last Portal Login
                  </span>
                  <p className="mt-1 text-sm font-medium text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {employee.lastLoginAt
                      ? new Date(employee.lastLoginAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'No login activity recorded'}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Account Created
                  </span>
                  <p className="mt-1 text-sm font-medium text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {new Date(employee.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Performance Snapshot */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-4 border-b border-border">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">
                Performance Snapshot
              </h2>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Live operational metrics pulled directly from active CRM records.
            </p>

            <div className="mt-5 space-y-4">
              {employee.role === 'SALES_EXECUTIVE' && (
                <>
                  <div className="rounded-xl border border-border bg-muted/30 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Assigned Clients
                      </span>
                    </div>
                    <span className="text-base font-bold text-foreground">
                      {snapshot.assignedClientsCount}
                    </span>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Briefcase className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Active Leads
                      </span>
                    </div>
                    <span className="text-base font-bold text-foreground">
                      {snapshot.activeLeadsCount}
                    </span>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Open Deals
                      </span>
                    </div>
                    <span className="text-base font-bold text-foreground">
                      {snapshot.openDealsCount}
                    </span>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-emerald-600">₹</span>
                      <span className="text-xs font-medium text-muted-foreground">
                        Pipeline Value
                      </span>
                    </div>
                    <span className="text-base font-bold text-foreground">
                      ₹{snapshot.openDealsValue.toLocaleString('en-IN')}
                    </span>
                  </div>
                </>
              )}

              {employee.role === 'SUPPORT_AGENT' && (
                <>
                  <div className="rounded-xl border border-border bg-muted/30 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <LifeBuoy className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Assigned Open Tickets
                      </span>
                    </div>
                    <span className="text-base font-bold text-foreground">
                      {snapshot.assignedOpenTicketsCount}
                    </span>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Briefcase className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Total Tickets Assigned
                      </span>
                    </div>
                    <span className="text-base font-bold text-foreground">
                      {snapshot.totalAssignedTicketsCount}
                    </span>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Resolved Tickets
                      </span>
                    </div>
                    <span className="text-base font-bold text-foreground">
                      {snapshot.resolvedTicketsCount}
                    </span>
                  </div>
                </>
              )}

              {(employee.role === 'ADMIN' || employee.role === 'MANAGER') && (
                <>
                  <div className="rounded-xl border border-border bg-muted/30 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Clients Registered
                      </span>
                    </div>
                    <span className="text-base font-bold text-foreground">
                      {snapshot.createdClientsCount}
                    </span>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <LifeBuoy className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Support Tickets Created
                      </span>
                    </div>
                    <span className="text-base font-bold text-foreground">
                      {snapshot.createdTicketsCount}
                    </span>
                  </div>

                  <div className="rounded-xl bg-primary/5 p-3.5 text-xs text-primary leading-relaxed border border-primary/10">
                    <p className="font-semibold flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5" />
                      {roleConfig.label} Role
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {roleConfig.description}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Password Reset */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl border border-border">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 mb-4">
              <KeyRound className="h-6 w-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground">
                Reset Employee Password
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                This will generate a new temporary password for{' '}
                <span className="font-semibold text-foreground">
                  {employee.name}
                </span>{' '}
                ({employee.email}). Their existing password will be invalidated immediately.
              </p>
            </div>

            {resetError && (
              <div className="mt-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                {resetError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  setResetError(null);
                }}
                disabled={resetLoading}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resetLoading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {resetLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Generate New Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Status Toggle */}
      {showStatusConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl border border-border">
            <div
              className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full mb-4 ${
                employee.isActive
                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                  : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
              }`}
            >
              {employee.isActive ? (
                <AlertTriangle className="h-6 w-6" />
              ) : (
                <UserCheck className="h-6 w-6" />
              )}
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground">
                {employee.isActive ? 'Deactivate Employee' : 'Reactivate Employee'}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {employee.isActive ? (
                  <>
                    Are you sure you want to deactivate{' '}
                    <span className="font-semibold text-foreground">
                      {employee.name}
                    </span>{' '}
                    ({employee.email})? They will immediately be prevented from logging into the portal. Historical assignments and records will remain preserved.
                  </>
                ) : (
                  <>
                    Are you sure you want to reactivate{' '}
                    <span className="font-semibold text-foreground">
                      {employee.name}
                    </span>{' '}
                    ({employee.email})? They will immediately regain portal login access.
                  </>
                )}
              </p>
            </div>

            {statusError && (
              <div className="mt-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                {statusError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowStatusConfirm(false);
                  setStatusError(null);
                }}
                disabled={statusLoading}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={statusLoading}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors disabled:opacity-50 ${
                  employee.isActive
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {statusLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {employee.isActive ? 'Yes, Deactivate' : 'Yes, Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Temp Password Reveal Modal (on password reset) */}
      {newTempPassword && (
        <TempPasswordModal
          isOpen={true}
          onClose={() => setNewTempPassword(null)}
          employeeName={employee.name}
          employeeEmail={employee.email}
          employeeId={employee.employeeId}
          tempPassword={newTempPassword}
          isPasswordReset={true}
        />
      )}
    </div>
  );
}
