'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  addContactAction,
  deleteContactAction,
  setPrimaryContactAction,
  deleteClientAction,
} from '@/app/actions/clients';
import {
  addContactSchema,
  type AddContactInput,
} from '@/lib/schemas/client';
import {
  Building2,
  MapPin,
  Tag,
  UserCheck,
  UserCog,
  Globe,
  Mail,
  Phone,
  Pencil,
  Trash2,
  Plus,
  ArrowLeft,
  Clock,
  Star,
  AlertTriangle,
  Loader2,
  FileText,
  Calendar,
  Briefcase,
  Receipt,
  LifeBuoy,
} from 'lucide-react';
import { QuickFollowUpModal } from '@/components/follow-ups/quick-follow-up-modal';
import { cn } from '@/lib/utils';
import type { ClientStatus, ClientSource } from '@prisma/client';

export interface ClientDetailData {
  id: string;
  companyName: string;
  industry?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  status: ClientStatus;
  source: ClientSource;
  notes?: string | null;
  assignedToId: string;
  createdById: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  assignedTo: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  createdBy: {
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
    createdAt: Date | string;
  }[];
}

interface ClientDetailViewProps {
  client: ClientDetailData;
  currentUser: {
    id: string;
    name?: string | null;
    role: string;
  };
}

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

export function ClientDetailView({ client, currentUser }: ClientDetailViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'activity'>('overview');

  // Add contact modal state
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  // Delete client modal state
  const [isDeleteClientOpen, setIsDeleteClientOpen] = useState(false);
  const [isDeletingClient, setIsDeletingClient] = useState(false);
  const [deleteClientError, setDeleteClientError] = useState<string | null>(null);

  // Follow-up modal state
  const [isAddFollowUpOpen, setIsAddFollowUpOpen] = useState(false);

  // Contact action loading states
  const [loadingContactId, setLoadingContactId] = useState<string | null>(null);

  const isAdminOrManager = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';
  const canEdit =
    isAdminOrManager ||
    (currentUser.role === 'SALES_EXECUTIVE' && client.assignedToId === currentUser.id);
  const canDelete = isAdminOrManager;

  // Form for Add Contact
  const {
    register: registerContact,
    handleSubmit: handleContactSubmit,
    reset: resetContactForm,
    formState: { errors: contactErrors },
  } = useForm<AddContactInput>({
    resolver: zodResolver(addContactSchema),
    defaultValues: {
      clientId: client.id,
      name: '',
      designation: '',
      email: '',
      phone: '',
      isPrimary: false,
    },
  });

  const onAddContactSubmit = async (data: AddContactInput) => {
    setIsSubmittingContact(true);
    setContactError(null);

    const result = await addContactAction(data);
    if (result.error) {
      setContactError(result.error);
      setIsSubmittingContact(false);
    } else {
      setIsSubmittingContact(false);
      setIsAddContactOpen(false);
      resetContactForm();
      router.refresh();
    }
  };

  const handleSetPrimary = async (contactId: string) => {
    setLoadingContactId(contactId);
    await setPrimaryContactAction(client.id, contactId);
    setLoadingContactId(null);
    router.refresh();
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to remove this contact?')) return;
    setLoadingContactId(contactId);
    await deleteContactAction(client.id, contactId);
    setLoadingContactId(null);
    router.refresh();
  };

  const confirmDeleteClient = async () => {
    setIsDeletingClient(true);
    setDeleteClientError(null);

    const res = await deleteClientAction(client.id);
    if (res.error) {
      setDeleteClientError(res.error);
      setIsDeletingClient(false);
    } else {
      router.push('/dashboard/clients');
      router.refresh();
    }
  };

  const createdDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(new Date(client.createdAt));

  const updatedDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(new Date(client.updatedAt));

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/dashboard/clients" className="hover:text-blue-600 transition-colors">
              Clients
            </Link>
            <span>/</span>
            <span className="font-medium text-gray-800">{client.companyName}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-xl shadow-md shadow-blue-500/20">
              {client.companyName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                {client.companyName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {getStatusBadge(client.status)}
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  {client.industry || 'General Business'}
                </span>
                <span className="text-xs text-gray-400">• Source: {client.source.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/dashboard/clients"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'inline-flex items-center gap-1.5')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Directory
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddFollowUpOpen(true)}
            className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-800 hover:bg-blue-50 border-blue-200"
          >
            <Calendar className="h-4 w-4 text-blue-600" />
            Schedule Follow-up
          </Button>

          {currentUser.role !== 'SUPPORT_AGENT' && (
            <Link
              href={`/dashboard/pipeline/new?clientId=${client.id}`}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'inline-flex items-center gap-1.5 text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50 border-indigo-200'
              )}
            >
              <Briefcase className="h-4 w-4 text-indigo-600" />
              Create Deal
            </Link>
          )}

          {currentUser.role !== 'SUPPORT_AGENT' && (
            <Link
              href={`/dashboard/invoices/new?clientId=${client.id}`}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200'
              )}
            >
              <Receipt className="h-4 w-4 text-emerald-600" />
              New Invoice
            </Link>
          )}

          {currentUser.role !== 'SALES_EXECUTIVE' && (
            <Link
              href={`/dashboard/tickets/new?clientId=${client.id}`}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'inline-flex items-center gap-1.5 text-cyan-700 hover:text-cyan-800 hover:bg-cyan-50 border-cyan-200'
              )}
            >
              <LifeBuoy className="h-4 w-4 text-cyan-600" />
              Raise Ticket
            </Link>
          )}

          {canEdit && (
            <Link
              href={`/dashboard/clients/${client.id}/edit`}
              className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'inline-flex items-center gap-1.5')}
            >
              <Pencil className="h-4 w-4" />
              Edit Client
            </Link>
          )}

          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteClientOpen(true)}
              className="inline-flex items-center gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            'flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer',
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
          )}
        >
          <Building2 className="h-4 w-4" />
          Overview
        </button>

        <button
          onClick={() => setActiveTab('contacts')}
          className={cn(
            'flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer',
            activeTab === 'contacts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
          )}
        >
          <UserCheck className="h-4 w-4" />
          Contacts
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-700">
            {client.contacts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={cn(
            'flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer',
            activeTab === 'activity'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
          )}
        >
          <Clock className="h-4 w-4" />
          Activity & History
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 animate-in fade-in duration-150">
          {/* Main Info Column (2 cols) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Company Profile Details */}
            <Card>
              <CardHeader className="border-b border-gray-100 pb-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Building2 className="h-4 w-4" />
                    <CardTitle className="text-base font-bold text-gray-900">
                      Company Profile
                    </CardTitle>
                  </div>
                  {canEdit && (
                    <Link
                      href={`/dashboard/clients/${client.id}/edit`}
                      className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Company Name</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{client.companyName}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 font-medium">Industry</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {client.industry || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 font-medium">Company Email</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5 flex items-center gap-1.5">
                    {client.email ? (
                      <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline inline-flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {client.email}
                      </a>
                    ) : (
                      '—'
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 font-medium">Company Phone</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5 flex items-center gap-1.5">
                    {client.phone ? (
                      <a href={`tel:${client.phone}`} className="text-gray-900 hover:text-blue-600 inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        {client.phone}
                      </a>
                    ) : (
                      '—'
                    )}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-500 font-medium">Website</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {client.website ? (
                      <a
                        href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        {client.website}
                      </a>
                    ) : (
                      '—'
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Address Details */}
            <Card>
              <CardHeader className="border-b border-gray-100 pb-3.5">
                <div className="flex items-center gap-2 text-blue-600">
                  <MapPin className="h-4 w-4" />
                  <CardTitle className="text-base font-bold text-gray-900">
                    Location & Address
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-500 font-medium">Street Address</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {client.addressLine || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 font-medium">City</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{client.city || '—'}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 font-medium">State / Province</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{client.state || '—'}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 font-medium">Postal / Zip Code</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {client.postalCode || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 font-medium">Country</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {client.country || 'India'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Account Notes */}
            <Card>
              <CardHeader className="border-b border-gray-100 pb-3.5">
                <div className="flex items-center gap-2 text-blue-600">
                  <FileText className="h-4 w-4" />
                  <CardTitle className="text-base font-bold text-gray-900">
                    Account Notes
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                {client.notes ? (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                    {client.notes}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 italic">No notes provided for this account.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info Column (1 col) */}
          <div className="space-y-6">
            {/* Account Ownership Card */}
            <Card>
              <CardHeader className="border-b border-gray-100 pb-3.5">
                <div className="flex items-center gap-2 text-blue-600">
                  <UserCog className="h-4 w-4" />
                  <CardTitle className="text-base font-bold text-gray-900">
                    Account Assignment
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Assigned Representative</p>
                  <div className="mt-1 flex items-center gap-2.5 rounded-xl bg-blue-50/70 p-3 border border-blue-100">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs">
                      {client.assignedTo?.name ? client.assignedTo.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{client.assignedTo?.name}</p>
                      <p className="text-[10px] text-gray-500">
                        {client.assignedTo?.role.replace('_', ' ')} • {client.assignedTo?.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 font-medium">Created By</p>
                  <p className="text-xs font-semibold text-gray-800 mt-1">
                    {client.createdBy?.name} ({client.createdBy?.role.replace('_', ' ')})
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-100 space-y-2 text-xs text-gray-500">
                  <div className="flex items-center justify-between">
                    <span>Created Date:</span>
                    <span className="font-semibold text-gray-800">{createdDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last Updated:</span>
                    <span className="font-semibold text-gray-800">{updatedDate}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {canEdit && (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-blue-700 hover:text-blue-800 hover:bg-blue-50 border-blue-200"
                    onClick={() => setIsAddFollowUpOpen(true)}
                  >
                    <Clock className="mr-2 h-4 w-4 text-blue-600" />
                    Schedule Follow-up
                  </Button>
                )}
                {canEdit && (
                  <Link
                    href={`/dashboard/clients/${client.id}/edit`}
                    className={cn(buttonVariants({ variant: 'outline', className: 'w-full justify-start' }))}
                  >
                    <Pencil className="mr-2 h-4 w-4 text-gray-500" />
                    Edit Company Details
                  </Link>
                )}
                {canEdit && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab('contacts');
                      setIsAddContactOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4 text-gray-500" />
                    Add New Contact
                  </Button>
                )}
                <Link
                  href="/dashboard/pipeline"
                  className={cn(buttonVariants({ variant: 'outline', className: 'w-full justify-start' }))}
                >
                  <Tag className="mr-2 h-4 w-4 text-gray-500" />
                  View Deals Pipeline
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Contacts */}
      {activeTab === 'contacts' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Associated Contacts</h2>
              <p className="text-xs text-gray-500">
                Decision makers and contact persons representing {client.companyName}.
              </p>
            </div>
            {canEdit && (
              <Button
                onClick={() => {
                  setContactError(null);
                  setIsAddContactOpen(true);
                }}
                className="inline-flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Add Contact
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {client.contacts.map((contact) => (
              <Card
                key={contact.id}
                className={cn(
                  'relative transition-all',
                  contact.isPrimary && 'ring-2 ring-blue-500/20 bg-blue-50/20'
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-xl font-bold text-sm shadow-xs',
                          contact.isPrimary
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold text-gray-900">
                          {contact.name}
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-500">
                          {contact.designation || 'No designation'}
                        </CardDescription>
                      </div>
                    </div>

                    {contact.isPrimary && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                        <Star className="h-3 w-3 fill-blue-700" /> Primary
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-2 text-xs text-gray-600 pt-1 pb-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    {contact.email ? (
                      <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline truncate">
                        {contact.email}
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">No email</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    {contact.phone ? (
                      <a href={`tel:${contact.phone}`} className="hover:text-blue-600 truncate">
                        {contact.phone}
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">No phone</span>
                    )}
                  </div>

                  {/* Contact Actions */}
                  {canEdit && (
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-3">
                      {!contact.isPrimary ? (
                        <button
                          onClick={() => handleSetPrimary(contact.id)}
                          disabled={loadingContactId === contact.id}
                          className="text-[11px] font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          <Star className="h-3 w-3" /> Make Primary
                        </button>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">Default contact</span>
                      )}

                      {client.contacts.length > 1 && (
                        <button
                          onClick={() => handleDeleteContact(contact.id)}
                          disabled={loadingContactId === contact.id}
                          className="text-[11px] font-semibold text-red-600 hover:underline inline-flex items-center gap-1 ml-auto"
                        >
                          <Trash2 className="h-3 w-3" /> Remove
                        </button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Activity Timeline Placeholder */}
      {activeTab === 'activity' && (
        <Card className="border-dashed border-2 bg-gray-50/50 p-12 text-center shadow-xs animate-in fade-in duration-150">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mx-auto mb-3 shadow-xs">
            <Clock className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Activity Timeline Coming Soon</h3>
          <p className="mt-1 max-w-md mx-auto text-xs text-gray-500 leading-relaxed">
            Interactions, meeting logs, deal milestones, quotations, and support requests associated with {client.companyName} will automatically stream here once subsequent CRM modules are active.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
              Leads & Pipeline Integration
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
              Invoices & Payments
            </span>
          </div>
        </Card>
      )}

      {/* Add Contact Modal Dialog */}
      <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1 text-blue-600">
            <UserCheck className="h-5 w-5" />
            <DialogTitle>Add Contact Person</DialogTitle>
          </div>
          <DialogDescription>
            Add an additional stakeholder or team member for {client.companyName}.
          </DialogDescription>
        </DialogHeader>

        {contactError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            {contactError}
          </div>
        )}

        <form onSubmit={handleContactSubmit(onAddContactSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="newContactName">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="newContactName"
              placeholder="e.g. Priya Sharma"
              {...registerContact('name')}
              disabled={isSubmittingContact}
            />
            {contactErrors.name && (
              <p className="text-xs text-red-500">{contactErrors.name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="newContactDesignation">Designation / Role</Label>
            <Input
              id="newContactDesignation"
              placeholder="e.g. Procurement Lead / CFO"
              {...registerContact('designation')}
              disabled={isSubmittingContact}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="newContactEmail">Email Address</Label>
              <Input
                id="newContactEmail"
                type="email"
                placeholder="priya@company.com"
                {...registerContact('email')}
                disabled={isSubmittingContact}
              />
              {contactErrors.email && (
                <p className="text-xs text-red-500">{contactErrors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="newContactPhone">Phone Number</Label>
              <Input
                id="newContactPhone"
                type="tel"
                placeholder="+91 98765 43210"
                {...registerContact('phone')}
                disabled={isSubmittingContact}
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-900">Set as Primary Contact</p>
              <p className="text-[11px] text-gray-500">
                Only one contact can be primary. Setting this will unset previous primary.
              </p>
            </div>
            <input
              type="checkbox"
              id="isPrimaryToggle"
              {...registerContact('isPrimary')}
              disabled={isSubmittingContact}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddContactOpen(false)}
              disabled={isSubmittingContact}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmittingContact}>
              {isSubmittingContact ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Contact'
              )}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Client Confirmation Modal */}
      <Dialog open={isDeleteClientOpen} onOpenChange={setIsDeleteClientOpen}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle>Delete Client Profile</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete <strong className="text-gray-900">{client.companyName}</strong>?
            This will also delete all associated contacts. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {deleteClientError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            {deleteClientError}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsDeleteClientOpen(false)}
            disabled={isDeletingClient}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={confirmDeleteClient}
            disabled={isDeletingClient}
          >
            {isDeletingClient ? (
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

      {/* Quick Follow-up Modal */}
      <QuickFollowUpModal
        open={isAddFollowUpOpen}
        onClose={() => setIsAddFollowUpOpen(false)}
        target={{
          type: 'CLIENT',
          id: client.id,
          name: client.companyName,
        }}
        currentUser={currentUser}
      />
    </div>
  );
}
