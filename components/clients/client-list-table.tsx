'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { deleteClientAction } from '@/app/actions/clients';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Pencil,
  Trash2,
  Filter,
  User,
  UserCheck,
  Calendar,
  AlertTriangle,
  Building2,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClientStatus, ClientSource } from '@prisma/client';

export interface ClientRowData {
  id: string;
  companyName: string;
  industry?: string | null;
  status: ClientStatus;
  source: ClientSource;
  assignedToId: string;
  assignedTo: {
    id: string;
    name: string;
    role: string;
  };
  contacts: {
    id: string;
    name: string;
    designation?: string | null;
    email?: string | null;
    phone?: string | null;
    isPrimary: boolean;
  }[];
  createdAt: Date | string;
}

interface SalesRepOption {
  id: string;
  name: string;
  role: string;
}

interface ClientListTableProps {
  initialClients: ClientRowData[];
  salesReps: SalesRepOption[];
  currentUser: {
    id: string;
    name?: string | null;
    role: string;
  };
}

type SortField = 'companyName' | 'createdAt';
type SortDirection = 'asc' | 'desc';

function getStatusBadge(status: ClientStatus) {
  switch (status) {
    case 'ACTIVE':
      return <Badge variant="success">Active</Badge>;
    case 'PROSPECT':
      return <Badge variant="info">Prospect</Badge>;
    case 'INACTIVE':
      return <Badge variant="inactive">Inactive</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function ClientListTable({
  initialClients,
  salesReps,
  currentUser,
}: ClientListTableProps) {
  const router = useRouter();

  // Search, filter, sort, pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [assignedFilter, setAssignedFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Delete modal state
  const [clientToDelete, setClientToDelete] = useState<ClientRowData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isAdminOrManager = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';
  const isSupportAgent = currentUser.role === 'SUPPORT_AGENT';

  // Toggle column sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Filter and sort clients
  const filteredAndSortedClients = useMemo(() => {
    return initialClients
      .filter((client) => {
        // Search by companyName or primary contact name
        if (searchTerm.trim() !== '') {
          const term = searchTerm.toLowerCase();
          const matchCompany = client.companyName.toLowerCase().includes(term);
          const primaryContact = client.contacts.find((c) => c.isPrimary) || client.contacts[0];
          const matchContact = primaryContact?.name.toLowerCase().includes(term);
          if (!matchCompany && !matchContact) return false;
        }

        // Filter by Status
        if (statusFilter !== 'ALL' && client.status !== statusFilter) {
          return false;
        }

        // Filter by Source
        if (sourceFilter !== 'ALL' && client.source !== sourceFilter) {
          return false;
        }

        // Filter by Assigned To (only for Admin/Manager)
        if (isAdminOrManager && assignedFilter !== 'ALL' && client.assignedToId !== assignedFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortField === 'companyName') {
          const compA = a.companyName.toLowerCase();
          const compB = b.companyName.toLowerCase();
          return sortDirection === 'asc' ? compA.localeCompare(compB) : compB.localeCompare(compA);
        } else {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        }
      });
  }, [
    initialClients,
    searchTerm,
    statusFilter,
    sourceFilter,
    assignedFilter,
    sortField,
    sortDirection,
    isAdminOrManager,
  ]);

  // Pagination calculation
  const totalItems = filteredAndSortedClients.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedClients = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredAndSortedClients.slice(startIdx, startIdx + pageSize);
  }, [filteredAndSortedClients, currentPage, pageSize]);

  // Execute delete action
  const confirmDelete = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    const res = await deleteClientAction(clientToDelete.id);
    if (res.error) {
      setDeleteError(res.error);
      setIsDeleting(false);
    } else {
      setIsDeleting(false);
      setClientToDelete(null);
      router.refresh();
    }
  };

  const selectFilterClass =
    'h-9 rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <div className="space-y-4">
      {/* Search, Filter, and Controls Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by company or contact name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <Filter className="h-3.5 w-3.5" />
              <span>Filters:</span>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={selectFilterClass}
              aria-label="Filter by Status"
            >
              <option value="ALL">All Statuses</option>
              <option value="PROSPECT">Prospect</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={selectFilterClass}
              aria-label="Filter by Source"
            >
              <option value="ALL">All Sources</option>
              <option value="WEBSITE">Website</option>
              <option value="REFERRAL">Referral</option>
              <option value="COLD_CALL">Cold Call</option>
              <option value="SOCIAL_MEDIA">Social Media</option>
              <option value="EVENT">Event</option>
              <option value="OTHER">Other</option>
            </select>

            {/* Assigned To Filter (Admin / Manager only) */}
            {isAdminOrManager && (
              <select
                value={assignedFilter}
                onChange={(e) => {
                  setAssignedFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={selectFilterClass}
                aria-label="Filter by Assigned Representative"
              >
                <option value="ALL">All Representatives</option>
                {salesReps.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.name}
                  </option>
                ))}
              </select>
            )}

            {/* Reset Filters button */}
            {(searchTerm || statusFilter !== 'ALL' || sourceFilter !== 'ALL' || assignedFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setSourceFilter('ALL');
                  setAssignedFilter('ALL');
                  setCurrentPage(1);
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline px-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-2xs overflow-hidden">
        {paginatedClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3 shadow-2xs">
              <Building2 className="h-6 w-6" />
            </div>
            <h4 className="text-base font-bold text-gray-900">No matching clients found</h4>
            <p className="mt-1 max-w-sm text-xs text-gray-500">
              Try adjusting your search criteria, clearing active filters, or add a new client to your directory.
            </p>
            {!isSupportAgent && (
              <Link
                href="/dashboard/clients/new"
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4 inline-flex items-center gap-1.5')}
              >
                <Plus className="h-4 w-4" />
                Add Client
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/80 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200 select-none">
                <tr>
                  {/* Company Name (Sortable) */}
                  <th scope="col" className="px-6 py-3.5 font-semibold">
                    <button
                      onClick={() => handleSort('companyName')}
                      className="inline-flex items-center gap-1.5 hover:text-gray-900 transition-colors"
                      title="Sort by Company Name"
                    >
                      <span>Company Name</span>
                      {sortField === 'companyName' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
                      )}
                    </button>
                  </th>

                  {/* Primary Contact */}
                  <th scope="col" className="px-6 py-3.5 font-semibold">
                    Primary Contact
                  </th>

                  {/* Status */}
                  <th scope="col" className="px-6 py-3.5 font-semibold">
                    Status
                  </th>

                  {/* Assigned To */}
                  <th scope="col" className="px-6 py-3.5 font-semibold">
                    Assigned To
                  </th>

                  {/* Created Date (Sortable) */}
                  <th scope="col" className="px-6 py-3.5 font-semibold">
                    <button
                      onClick={() => handleSort('createdAt')}
                      className="inline-flex items-center gap-1.5 hover:text-gray-900 transition-colors"
                      title="Sort by Created Date"
                    >
                      <span>Created Date</span>
                      {sortField === 'createdAt' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
                      )}
                    </button>
                  </th>

                  {/* Actions */}
                  <th scope="col" className="px-6 py-3.5 font-semibold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedClients.map((client) => {
                  const primaryContact = client.contacts.find((c) => c.isPrimary) || client.contacts[0];
                  const createdDateFormatted = new Intl.DateTimeFormat('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }).format(new Date(client.createdAt));

                  // Role permission calculation for this specific row
                  const canEdit =
                    isAdminOrManager ||
                    (currentUser.role === 'SALES_EXECUTIVE' && client.assignedToId === currentUser.id);
                  const canDelete = isAdminOrManager;

                  return (
                    <tr key={client.id} className="hover:bg-gray-50/60 transition-colors group">
                      {/* Company Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-semibold text-sm">
                            {client.companyName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/dashboard/clients/${client.id}`}
                              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate block"
                            >
                              {client.companyName}
                            </Link>
                            <p className="text-xs text-gray-500 truncate">
                              {client.industry || client.source.replace('_', ' ') || 'Client'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Primary Contact */}
                      <td className="px-6 py-4">
                        {primaryContact ? (
                          <div>
                            <p className="font-medium text-gray-900 truncate flex items-center gap-1.5">
                              <UserCheck className="h-3.5 w-3.5 text-gray-400" />
                              {primaryContact.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {primaryContact.designation || primaryContact.email || primaryContact.phone || 'Primary'}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No contact assigned</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">{getStatusBadge(client.status)}</td>

                      {/* Assigned To */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-600">
                            <User className="h-3 w-3" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-900">
                              {client.assignedTo?.name || 'Unassigned'}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {client.assignedTo?.role?.replace('_', ' ') || ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                        <div className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          {createdDateFormatted}
                        </div>
                      </td>

                      {/* Row Actions */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* View Action (All Roles) */}
                          <Link
                            href={`/dashboard/clients/${client.id}`}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title="View Client Details"
                            aria-label={`View ${client.companyName}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          {/* Edit Action (Admin, Manager, or assigned Sales Exec) */}
                          {canEdit && (
                            <Link
                              href={`/dashboard/clients/${client.id}/edit`}
                              className="rounded-lg p-1.5 text-gray-500 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                              title="Edit Client"
                              aria-label={`Edit ${client.companyName}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                          )}

                          {/* Delete Action (Admin & Manager only) */}
                          {canDelete && (
                            <button
                              onClick={() => {
                                setClientToDelete(client);
                                setDeleteError(null);
                              }}
                              className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Delete Client"
                              aria-label={`Delete ${client.companyName}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-7 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-700"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>
                Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)} to{' '}
                {Math.min(currentPage * pageSize, totalItems)} of {totalItems} clients
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="h-7 px-2.5"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Prev
              </Button>
              <span className="px-2 font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="h-7 px-2.5"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Client Confirmation Modal */}
      <Dialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle>Delete Client Profile</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete <strong className="text-gray-900">{clientToDelete?.companyName}</strong>?
            This will also delete all associated contacts. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {deleteError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            {deleteError}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setClientToDelete(null)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={confirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Confirm Delete'
            )}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
