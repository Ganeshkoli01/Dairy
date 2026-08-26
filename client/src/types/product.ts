export interface Product {
  _id: string;
  nameEn: string;
  nameMr: string;
  category: 'Milk' | 'Fresh Dairy' | 'Specialty' | 'Beverages' | 'Cheese' | 'Frozen Dairy';
  description?: string;
  price: number;
  cogs: number;
  plantTransferPrice: number;
  unit: string;
  stock: number;
  lowStockThreshold?: number;
  imageUrl: string;
  isAvailable: boolean;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface OrderItem {
  product: string; // Product ID
  nameEn: string;
  nameMr: string;
  price: number;
  quantity: number;
  unit: string;
}

export interface Order {
  _id?: string;
  user?: string;
  customerDetails: {
    name: string;
    phone: string;
    address: string;
  };
  items: OrderItem[];
  totalAmount: number;
  status: 'Pending' | 'Processing' | 'Delivered' | 'Cancelled' | 'Received';
  paymentStatus?: 'Pending' | 'Completed' | 'Failed';
  paymentMethod: 'Cash on Delivery' | 'Pay at Branch' | 'Online Payment';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  createdAt?: string;
  updatedAt?: string;
}
