export interface Product {
  id: string;
  factoryId: string;
  factoryName: string;
  name: string;
  category: 'Men' | 'Women' | 'Kids' | 'Activewear' | 'Workwear' | 'Accessories' | string;
  productType: 'T-shirt' | 'Polo shirt' | 'Shirt' | 'Jeans' | 'Jacket' | 'Sweater' | 'Hoodie' | string;
  description: string;
  images: string[];
  materials: string[];
  minOrderQuantity: number;
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
  leadTimeDays: number;
  availableSizes: string[];
  availableColors: string[];
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}
