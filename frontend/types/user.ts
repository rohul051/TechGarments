export type Role = 'BUYER' | 'FACTORY' | 'ADMIN';

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
}
