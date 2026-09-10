import { auth } from '@/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Shield, Clock } from 'lucide-react';
import { getUserNotificationPreferencesAction } from '@/app/actions/notifications';
import { NotificationPreferencesCard } from '@/components/profile/notification-preferences-card';
import { ChangePasswordCard } from '@/components/profile/change-password-card';
import { UpdateEmailCard } from '@/components/profile/update-email-card';

export const metadata = {
  title: 'My Profile | Pulse CRM',
};

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user;

  const prefRes = await getUserNotificationPreferencesAction();
  const defaultPrefs = {
    notifyOnLeadAssigned: true,
    notifyOnDealUpdates: true,
    notifyOnFollowUps: true,
    notifyOnTickets: true,
    notifyOnPayments: true,
  };

  const preferences = prefRes.preferences
    ? {
        notifyOnLeadAssigned: prefRes.preferences.notifyOnLeadAssigned ?? true,
        notifyOnDealUpdates: prefRes.preferences.notifyOnDealUpdates ?? true,
        notifyOnFollowUps: prefRes.preferences.notifyOnFollowUps ?? true,
        notifyOnTickets: prefRes.preferences.notifyOnTickets ?? true,
        notifyOnPayments: prefRes.preferences.notifyOnPayments ?? true,
      }
    : defaultPrefs;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account credentials, security settings, and notification preferences.
        </p>
      </div>

      {/* Account Overview Card */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-xl font-bold text-white shadow-md">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">
                {user?.name || 'User'}
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                Active Account
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-gray-100">
            <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-3.5 border border-gray-100">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Full Name</p>
                <p className="text-sm font-semibold text-gray-900">{user?.name || '—'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-3.5 border border-gray-100">
              <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Email Address</p>
                <p className="text-sm font-semibold text-gray-900">{user?.email || '—'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-3.5 border border-gray-100">
              <Shield className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Assigned Role</p>
                <p className="text-sm font-semibold text-purple-700">{user?.role || '—'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-3.5 border border-gray-100">
              <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Session Type</p>
                <p className="text-sm font-semibold text-gray-900">JWT (Auth.js)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Security & Credentials Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UpdateEmailCard currentEmail={user?.email || ''} />
        <ChangePasswordCard />
      </div>

      {/* Notification Preferences Card */}
      <NotificationPreferencesCard initialPreferences={preferences} />
    </div>
  );
}
