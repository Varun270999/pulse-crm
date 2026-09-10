'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Eye,
  Pencil,
  UserX,
  UserCheck,
  Shield,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toggleEmployeeStatusAction } from '@/app/actions/employees';
import { ROLE_CONFIG, type EmployeeData } from '@/types/employee';
import type { UserRole } from '@/lib/auth/rbac';

interface EmployeeTableProps {
  initialEmployees: EmployeeData[];
  currentUserId: string;
}

export function EmployeeTable({
  initialEmployees,
  currentUserId,
}: EmployeeTableProps) {
  const [employees, setEmployees] = useState<EmployeeData[]>(initialEmployees);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Toggle status dialog state
  const [statusTarget, setStatusTarget] = useState<EmployeeData | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Extract unique departments for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    for (const e of employees) {
      if (e.department) set.add(e.department);
    }
    return Array.from(set).sort();
  }, [employees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = emp.name.toLowerCase().includes(q);
        const matchesEmail = emp.email.toLowerCase().includes(q);
        const matchesEmpId = emp.employeeId?.toLowerCase().includes(q) || false;
        const matchesDept = emp.department?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesEmail && !matchesEmpId && !matchesDept) {
          return false;
        }
      }

      // Role filter
      if (roleFilter !== 'ALL' && emp.role !== roleFilter) {
        return false;
      }

      // Department filter
      if (departmentFilter !== 'ALL' && emp.department !== departmentFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'ACTIVE' && !emp.isActive) return false;
      if (statusFilter === 'INACTIVE' && emp.isActive) return false;

      return true;
    });
  }, [employees, searchQuery, roleFilter, departmentFilter, statusFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1;
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  // Handle status toggle
  const handleConfirmStatusToggle = async () => {
    if (!statusTarget) return;

    setIsUpdatingStatus(true);
    setStatusError(null);

    try {
      const nextStatus = !statusTarget.isActive;
      const res = await toggleEmployeeStatusAction({
        id: statusTarget.id,
        isActive: nextStatus,
      });

      if (res.error) {
        setStatusError(res.error);
        return;
      }

      // Update state locally
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === statusTarget.id ? { ...e, isActive: nextStatus } : e
        )
      );
      setStatusTarget(null);
    } catch (err) {
      console.error(err);
      setStatusError('An unexpected error occurred. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, employee ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl border border-input bg-card pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-input bg-card px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="SALES_EXECUTIVE">Sales Executive</option>
            <option value="SUPPORT_AGENT">Support Agent</option>
          </select>

          {/* Department Filter */}
          {departments.length > 0 && (
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-input bg-card px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
            >
              <option value="ALL">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-xl border border-input bg-card px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          {/* Add Employee Button */}
          <Link
            href="/dashboard/employees/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Employee</span>
          </Link>
        </div>
      </div>

      {/* Employees Table Card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-3.5">
                  Employee ID
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Name & Email
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Role
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Department
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Phone
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Status
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Joining Date
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Last Login
                </th>
                <th scope="col" className="px-5 py-3.5 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-1">
                        <Shield className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-bold text-gray-900">No employees found</p>
                      <p className="text-xs text-gray-500 max-w-sm">
                        No team members match your current filters. You can onboard new staff members to grant CRM access.
                      </p>
                      <Link
                        href="/dashboard/employees/new"
                        className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Employee</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp) => {
                  const roleConfig = ROLE_CONFIG[emp.role as UserRole] || {
                    label: emp.role,
                    badgeClass: 'bg-gray-100 text-gray-700',
                  };
                  const isSelf = emp.id === currentUserId;

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Employee ID */}
                      <td className="px-5 py-4">
                        <Link
                          href={`/dashboard/employees/${emp.id}`}
                          className="font-mono text-xs font-semibold text-primary hover:underline"
                        >
                          {emp.employeeId || '—'}
                        </Link>
                      </td>

                      {/* Name & Email */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link
                              href={`/dashboard/employees/${emp.id}`}
                              className="font-medium text-foreground hover:text-primary transition-colors block"
                            >
                              {emp.name}
                              {isSelf && (
                                <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                  You
                                </span>
                              )}
                            </Link>
                            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3 inline" />
                              {emp.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${roleConfig.badgeClass}`}
                        >
                          {roleConfig.label}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="px-5 py-4 text-xs font-medium text-foreground">
                        {emp.department || <span className="text-muted-foreground">—</span>}
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {emp.phone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {emp.phone}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {emp.isActive ? (
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
                      </td>

                      {/* Joining Date */}
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {emp.joiningDate ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(emp.joiningDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Last Login */}
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {emp.lastLoginAt ? (
                          new Date(emp.lastLoginAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        ) : (
                          <span className="text-muted-foreground/60">Never</span>
                        )}
                      </td>

                      {/* Row Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View */}
                          <Link
                            href={`/dashboard/employees/${emp.id}`}
                            title="View Employee Profile"
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          {/* Edit */}
                          <Link
                            href={`/dashboard/employees/${emp.id}?edit=true`}
                            title="Edit Employee"
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>

                          {/* Deactivate / Reactivate Toggle */}
                          {emp.isActive ? (
                            <button
                              type="button"
                              onClick={() => !isSelf && setStatusTarget(emp)}
                              disabled={isSelf}
                              title={
                                isSelf
                                  ? 'You cannot deactivate your own account'
                                  : 'Deactivate Employee'
                              }
                              className={`rounded-lg p-1.5 transition-colors ${
                                isSelf
                                  ? 'cursor-not-allowed opacity-40 text-muted-foreground'
                                  : 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                              }`}
                            >
                              <UserX className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setStatusTarget(emp)}
                              title="Reactivate Employee"
                              className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredEmployees.length > pageSize && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3.5 text-xs text-muted-foreground">
            <div>
              Showing{' '}
              <span className="font-semibold text-foreground">
                {(currentPage - 1) * pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-foreground">
                {Math.min(currentPage * pageSize, filteredEmployees.length)}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-foreground">
                {filteredEmployees.length}
              </span>{' '}
              employees
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 font-medium hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              <span className="px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 font-medium hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Deactivate / Reactivate */}
      {statusTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl border border-border">
            <div
              className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full mb-4 ${
                statusTarget.isActive
                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                  : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
              }`}
            >
              {statusTarget.isActive ? (
                <AlertTriangle className="h-6 w-6" />
              ) : (
                <UserCheck className="h-6 w-6" />
              )}
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground">
                {statusTarget.isActive ? 'Deactivate Employee' : 'Reactivate Employee'}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {statusTarget.isActive ? (
                  <>
                    Are you sure you want to deactivate{' '}
                    <span className="font-semibold text-foreground">
                      {statusTarget.name}
                    </span>{' '}
                    ({statusTarget.email})? They will immediately be prevented from logging into the portal. Historical assignments and records will remain preserved.
                  </>
                ) : (
                  <>
                    Are you sure you want to reactivate{' '}
                    <span className="font-semibold text-foreground">
                      {statusTarget.name}
                    </span>{' '}
                    ({statusTarget.email})? They will immediately regain portal login access with their current password.
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
                  setStatusTarget(null);
                  setStatusError(null);
                }}
                disabled={isUpdatingStatus}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusToggle}
                disabled={isUpdatingStatus}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors disabled:opacity-50 ${
                  statusTarget.isActive
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isUpdatingStatus && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {statusTarget.isActive ? 'Yes, Deactivate' : 'Yes, Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
