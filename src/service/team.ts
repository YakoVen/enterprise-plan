import { StaffRole } from '../interfaces/user';

export type StaffArea = 'orders' | 'articles' | 'marketing' | 'customers' | 'settings';

const ROLE_RANK: Record<string, number> = {
  support: 1,
  agent: 2,
  manager: 3,
  owner: 4,
  admin: 4,
  customer: 0,
};

const AREA_MIN_RANK: Record<StaffArea, number> = {
  orders: 1, // support+
  articles: 3, // manager+
  marketing: 3, // manager+
  customers: 2, // agent+
  settings: 4, // owner only
};

export function canAccess(role: string | undefined, area: StaffArea): boolean {
  return (ROLE_RANK[role || 'customer'] ?? 0) >= AREA_MIN_RANK[area];
}

export function isStaff(role: string | undefined): boolean {
  return (ROLE_RANK[role || 'customer'] ?? 0) >= 1;
}

export const STAFF_ROLES: StaffRole[] = ['owner', 'manager', 'agent', 'support'];

export const ROLE_LABELS: Record<string, string> = {
  owner: 'Propriétaire',
  manager: 'Manager',
  agent: 'Agent expédition',
  support: 'Support client',
  admin: 'Admin (legacy)',
  customer: 'Client',
};
