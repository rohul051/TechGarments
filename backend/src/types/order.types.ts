export type OrderStatus =
  | 'DRAFT'
  | 'PENDING_QUOTE'
  | 'PENDING_FACTORY_CONFIRMATION'
  | 'QUOTE_RECEIVED'
  | 'IN_NEGOTIATION'
  | 'CONFIRMED'
  | 'SAMPLE_DEVELOPMENT'
  | 'IN_PRODUCTION'
  | 'QUALITY_CHECK'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface OrderSpecification {
  fabricType?: string;
  gsm?: number;
  sizes?: string[];
  colors?: string[];
  techPackUrl?: string;
  additionalNotes?: string;
}

export interface Order {
  id: string;
  title: string;
  buyerId: string;
  buyerName: string;
  factoryId?: string;
  factoryName?: string;
  productType: string;
  quantity: number;
  targetPricePerUnit?: number;
  totalBudget?: number;
  currency: string;
  targetDeliveryDate?: string;
  status: OrderStatus;
  specifications: OrderSpecification;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  orderId: string;
  factoryId: string;
  factoryName: string;
  pricePerUnit: number;
  totalPrice: number;
  currency: string;
  estimatedLeadTimeDays: number;
  sampleTimeDays?: number;
  termsAndConditions?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
}
