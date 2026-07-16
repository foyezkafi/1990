export type OrderStatus =
  | 'Pending Payment'
  | 'Payment Verified'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Rejected'
  | 'Cancelled';

export interface TimelineEvent {
  status: OrderStatus;
  timestamp: string;
  note: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  images?: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  rating: number;
  reviewsCount: number;
  stock: number;
  isFeatured?: boolean;
  code?: string;
}

export interface CartItem {
  id: string; // combination of productId_size_color
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

export interface Order {
  id: string; // e.g. ORDER-20260709-0001
  customerName: string;
  phone: string;
  email: string;
  shippingAddress: string;
  notes?: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    selectedSize: string;
    selectedColor: string;
    image: string;
  }[];
  totalAmount: number;
  paymentMethod: 'bKash' | 'Nagad' | 'Rocket';
  transactionId: string;
  screenshot?: string; // base64 or URL
  status: OrderStatus;
  statusTimeline: TimelineEvent[];
  createdAt: string;
}

export interface Notification {
  id: string;
  orderId: string;
  title: string;
  message: string;
  status: 'read' | 'unread';
  createdAt: string;
}
