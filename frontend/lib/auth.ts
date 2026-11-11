import type { User } from '@/types/user';

const demoAccounts: Record<string, { password: string; fullName: string; role: User['role'] }> = {
  'buyer@threadline.demo': {
    password: 'buyer1234',
    fullName: 'Alex Morgan',
    role: 'BUYER',
  },
  'factory@threadline.demo': {
    password: 'factory1234',
    fullName: 'Samira Rahman',
    role: 'FACTORY',
  },
};

export async function login(email: string, password: string): Promise<User> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const account = demoAccounts[email.trim().toLowerCase()];
  if (!account || password !== account.password) {
    throw new Error('The email or password you entered is incorrect.');
  }

  const user: User = {
    id: crypto.randomUUID(),
    email: email.trim().toLowerCase(),
    fullName: account.fullName,
    role: account.role,
  };

  localStorage.setItem('user', JSON.stringify(user));
  return user;
}

export function logout(): void {
  localStorage.removeItem('user');
}

export function getUser(): User | null {
  const user = localStorage.getItem('user');
  return user ? (JSON.parse(user) as User) : null;
}
