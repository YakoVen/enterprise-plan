export type StaffRole = 'owner' | 'manager' | 'agent' | 'support';

export interface UserAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  wilaya: string;
  commune: string;
  address: string;
  isDefault?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  role: 'customer' | 'admin' | StaffRole;
  addresses?: UserAddress[];
  wishlist?: string[];
  loyaltyPoints?: number;
  totalSpend?: number;
  vipTier?: string;
  createdAt: string;
  updatedAt?: string;
}
