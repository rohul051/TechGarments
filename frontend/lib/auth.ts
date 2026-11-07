import type { User } from '@/types/user';

export async function login(email: string, password: string): Promise<User> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (password.length < 4) {
    throw new Error('Password must be at least 4 characters long');
  }

  const user: User = {
    id: crypto.randomUUID(),
    email,
    fullName: email.split('@')[0],
    role: email.includes('factory') ? 'FACTORY' : 'BUYER',
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
