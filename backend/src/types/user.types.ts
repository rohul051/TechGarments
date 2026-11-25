export type Role = 'BUYER' | 'FACTORY' | 'ADMIN';

export interface User {
  uid: string;
  email: string;
  fullName: string;
  role: Role;
  phoneNumber?: string;
  photoURL?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BuyerProfile {
  id: string; // matches User.uid
  fullName: string;
  email: string;
  phone?: string;
  companyName: string;
  buyerType: 'Clothing Brand' | 'Retailer' | 'Wholesaler' | 'Importer / Exporter' | 'Individual / Startup' | string;
  country: string;
  website?: string;
  photoURL?: string;
  theme?: 'default' | 'light' | 'dark';
  createdAt: string;
  updatedAt: string;
}

export interface FactoryProfile {
  id: string; // matches User.uid
  fullName: string;
  email: string;
  phone?: string;
  companyName: string;
  country: string;
  city?: string;
  address?: string;
  website?: string;
  processes: string[]; // e.g. ["Cutting", "Sewing", "Knitting", "Dyeing", "Washing", "Printing", "Embroidery", "Finishing"]
  products: string[]; // e.g. ["T-shirt", "Polo shirt", "Shirt", "Jeans", "Jacket", "Sweater"]
  monthlyCapacity?: string | number;
  certifications?: string[]; // e.g. ["OEKO-TEX", "WRAP", "BSCI", "GOTS"]
  moq?: number; // Minimum Order Quantity
  verified?: boolean;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}
