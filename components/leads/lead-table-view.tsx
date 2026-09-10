'use client';

import { useState, useMemo } from 'react';
import {
  type LeadData,
  LEAD_STATUS_CONFIG,
  LEAD_SOURCE_LABELS,
} from '@/types/lead';
import { formatINR, cn } from '@/lib/utils';
import {
  Building2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  UserCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LeadTableViewProps {
  leads: LeadData[];
  currentUser: {
    id: string;
    name?: string | null;
    role: string;
  };
  onSelectLead: (lead: LeadData) => void;
  onConvertRequest: (lead: LeadData) => void;
  onDeleteRequest: (lead: LeadData) => void;
}

type SortField = 'name' | 'company' | 'value' | 'date';
type SortOrder = 'asc' | 'desc';

export function LeadTableView({
  leads,
  currentUser,
  onSelectLead,
  onConvertRequest,
  onDeleteRequest,
}: LeadTableViewProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const sortedLeads = useMemo(() => {
    const sorted = [...leads];
    sorted.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'company') {
        comparison = (a.companyName || '').localeCompare(b.companyName || '');
      } else if (sortField === 'value') {
        comparison = (a.estimatedValue || 0) - (b.estimatedValue || 0);
      } else if (sortField === 'date') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [leads, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedLeads.length / pageSize) || 1;
  const paginatedLeads = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedLeads.slice(start, start + pageSize);
  }, [sortedLeads, page, pageSize]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-gray-400" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-blue-600" />
    ) : (
      <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-blue-600" />
    );
  };

  const canDelete = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50/80 text-xs font-semibold uppercase text-gray-500 border-b border-gray-200">
            <tr>
              <th
                scope="col"
                className="py-3.5 pl-6 pr-3 cursor-pointer select-none hover:text-gray-900 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Lead / Contact
                  {renderSortIcon('name')}
                </div>
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 cursor-pointer select-none hover:text-gray-900 transition-colors"
                onClick={() => handleSort('company')}
              >
                <div className="flex items-center">
                  Company
                  {renderSortIcon('company')}
                </div>
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 cursor-pointer select-none hover:text-gray-900 transition-colors"
                onClick={() => handleSort('value')}
              >
                <div className="flex items-center">
                  Deal Value
                  {renderSortIcon('value')}
                </div>
              </th>
              <th scope="col" className="px-3 py-3.5">
                Status
              </th>
              <th scope="col" className="px-3 py-3.5">
                Source
              </th>
              <th scope="col" className="px-3 py-3.5">
                Assigned Rep
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 cursor-pointer select-none hover:text-gray-900 transition-colors"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center">
                  Created Date
                  {renderSortIcon('date')}
                </div>
              </th>
              <th scope="col" className="py-3.5 pl-3 pr-6 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedLeads.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400 text-sm">
                  No leads found matching your criteria.
                </td>
              </tr>
            ) : (
              paginatedLeads.map((lead) => {
                const statusConf = LEAD_STATUS_CONFIG[lead.status];
                const isConverted = lead.status === 'CONVERTED';
                const isLost = lead.status === 'LOST';
                const dateStr = new Date(lead.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <tr
                    key={lead.id}
                    className="hover:bg-gray-50/70 transition-colors group cursor-pointer"
                    onClick={() => onSelectLead(lead)}
                  >
                    {/* Contact Name & Email */}
                    <td className="py-3.5 pl-6 pr-3">
                      <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {lead.name}
                      </div>
                      {lead.email ? (
                        <div className="text-xs text-gray-500">{lead.email}</div>
                      ) : (
                        <div className="text-xs text-gray-400">{lead.phone || 'No phone/email'}</div>
                      )}
                    </td>

                    {/* Company */}
                    <td className="px-3 py-3.5 text-gray-800">
                      {lead.companyName ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span>{lead.companyName}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">None</span>
                      )}
                    </td>

                    {/* Deal Value */}
                    <td className="px-3 py-3.5">
                      <span className="font-bold text-gray-900 text-sm">
                        {lead.estimatedValue !== null ? formatINR(lead.estimatedValue) : '—'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3.5">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
                          statusConf.badgeBg
                        )}
                      >
                        {statusConf.label}
                      </span>
                    </td>

                    {/* Source */}
                    <td className="px-3 py-3.5 text-xs text-gray-600">
                      {LEAD_SOURCE_LABELS[lead.source] || lead.source}
                    </td>

                    {/* Rep */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                          {lead.assignedTo?.name
                            ? lead.assignedTo.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)
                            : 'U'}
                        </div>
                        <span className="text-gray-700 font-medium truncate max-w-[110px]">
                          {lead.assignedTo?.name || 'Unassigned'}
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-3 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                      {dateStr}
                    </td>

                    {/* Actions */}
                    <td
                      className="py-3.5 pl-3 pr-6 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                          title="View Details"
                          onClick={() => onSelectLead(lead)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {!isConverted && !isLost && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                            title="Convert to Client"
                            onClick={() => onConvertRequest(lead)}
                          >
                            <UserCheck className="h-3.5 w-3.5 mr-1" />
                            Convert
                          </Button>
                        )}

                        {canDelete && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-rose-600"
                            title="Delete Lead"
                            onClick={() => onDeleteRequest(lead)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-3 text-xs text-gray-500">
          <span>
            Showing {(page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, sortedLeads.length)} of {sortedLeads.length} leads
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="h-7 px-2"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="font-semibold text-gray-800 px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className="h-7 px-2"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
