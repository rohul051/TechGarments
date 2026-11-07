export type Role = 'BUYER' | 'FACTORY';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}
