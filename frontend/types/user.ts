export type Role = 'BUYER' | 'FACTORY' | 'ADMIN';

export type BuyerTheme = 'default' | 'light' | 'dark';

export type AdminRole =
  | 'SUPER_ADMIN'
  | 'VERIFICATION_ADMIN'
  | 'OPERATIONS_ADMIN'
  | 'FINANCE_ADMIN'
  | 'SUPPORT_ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  adminRole?: AdminRole;
  photoURL?: string;
  theme?: BuyerTheme;
}

export interface BuyerProfileDetails {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  buyerType: string;
  country: string;
  website: string;
  photoURL?: string;
  theme?: BuyerTheme;
}

export interface FactoryProfileDetails {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  country: string;
  city: string;
  website: string;
  photoURL?: string;
  coverPhotoURL?: string;
  theme?: BuyerTheme;
  monthlyCapacity: number;
  moq: number;
  processes: string[];
  products: string[];
  workerCount?: number;
  productionLines?: number;
  machineInformation?: string;
}

export interface AdminProfileDetails {
  fullName: string;
  email: string;
  phone: string;
  department: string;
  website: string;
  adminRole: AdminRole;
  photoURL?: string;
  theme?: BuyerTheme;
}

export interface AdminPlatformSettings {
  commissionRate: number;
  autoVerifyCompleteFactories: boolean;
  defaultCurrency: 'USD' | 'EUR' | 'GBP';
  maintenanceBanner: string;
  updatedAt?: string;
}
