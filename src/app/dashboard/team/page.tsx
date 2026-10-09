'use client';

import { useState, useEffect } from 'react';
import { Users, ShieldCheck, History } from 'lucide-react';
import { UserProfile, StaffRole } from '@/interfaces/user';
import { getUsers, updateUserProfile, getActivityLog, ActivityEntry } from '@/service/firebase/database';
import { STAFF_ROLES, ROLE_LABELS, isStaff } from '@/service/team';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function TeamPage() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filter, setFilter] = useState<'all' | 'staff' | 'customers'>('all');
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [u, a] = await Promise.all([getUsers(), getActivityLog(20)]);
      setUsers(u);
      setActivity(a);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  async function handleRole(user: UserProfile, role: string) {
    try {
      await updateUserProfile(user.id, { role: role as UserProfile['role'] });
      const { logActivity } = await import('@/service/firebase/database');
      await logActivity('role_change', `${user.email}: ${user.role} → ${role}`, currentUser?.email || undefined);
      setUsers((prev) => prev.map((x) => (x.id === user.id ? { ...x, role: role as UserProfile['role'] } : x)));
      toast.success(`Rôle de ${user.email} : ${ROLE_LABELS[role] || role}`);
    } catch {
      toast.error('Erreur de mise à jour');
    }
  }

  const filtered = users.filter((u) => {
    if (filter === 'staff') return isStaff(u.role);
    if (filter === 'customers') return !isStaff(u.role);
    return true;
  });
  const staffCount = users.filter((u) => isStaff(u.role)).length;

  if (loading) {
    return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-md animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Users size={24} /> Équipe &amp; Rôles</h1>
        <span className="text-sm text-gray-500">{staffCount} membre(s) • {users.length} utilisateurs</span>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-800">
        Les membres doivent d&apos;abord créer un compte (connexion), puis un propriétaire leur attribue un rôle ici.
        Rôles : Support (commandes) • Agent (commandes + clients) • Manager (+ articles, marketing) • Propriétaire (tout).
      </div>

      <div className="flex gap-2">
        {(['all', 'staff', 'customers'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${filter === f ? 'bg-cyan-600 text-white' : 'bg-white border hover:bg-gray-50'}`}>
            {f === 'all' ? 'Tous' : f === 'staff' ? 'Équipe' : 'Clients'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-left">
                <th className="px-4 py-3 font-medium">Utilisateur</th>
                <th className="px-4 py-3 font-medium">Rôle actuel</th>
                <th className="px-4 py-3 font-medium">Changer le rôle</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.displayName}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${isStaff(u.role) ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100 text-gray-600'}`}>
                      <ShieldCheck size={12} /> {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select value={isStaff(u.role) ? u.role : ''}
                      onChange={(e) => e.target.value && handleRole(u, e.target.value)}
                      className="border rounded-md px-3 py-1.5 text-sm bg-white">
                      <option value="">— Client —</option>
                      {STAFF_ROLES.map((r: StaffRole) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">Aucun utilisateur.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-md border overflow-hidden">
        <h2 className="font-bold p-6 pb-2 flex items-center gap-2"><History size={18} /> Activité récente</h2>
        <div className="divide-y">
          {activity.map((a) => (
            <div key={a.id} className="px-6 py-2.5 text-sm flex justify-between gap-4">
              <span><span className="font-mono text-xs bg-gray-100 rounded px-1.5 py-0.5 mr-2">{a.action}</span>{a.detail}</span>
              <span className="text-xs text-gray-400 whitespace-nowrap">{a.at ? a.at.slice(0, 16).replace('T', ' ') : ''}</span>
            </div>
          ))}
          {activity.length === 0 && <p className="px-6 py-8 text-center text-sm text-gray-500">Aucune activité enregistrée.</p>}
        </div>
      </div>
    </div>
  );
}
