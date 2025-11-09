export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type UserRole = 'Farmer' | 'Distributor' | 'Investor' | 'Admin' | 'Logistics';
export type KycStatus = 'Not Submitted' | 'Pending' | 'Verified' | 'Rejected';
export type OrderStatus = 'Placed' | 'Paid' | 'LogisticsPickedUp' | 'Shipped' | 'Delivered' | 'Disputed' | 'Cancelled';
export interface User {
  id: string; // email address
  name: string;
  role: UserRole;
  kycStatus: KycStatus;
  location: string;
  avatarUrl?: string;
  passwordHash?: string;
  passwordSalt?: string;
}
export interface Listing {
  id: string;
  farmerId: string;
  name: string;
  description: string;
  category: string;
  price: number; // per unit
  unit: string; // e.g., 'kg', 'tonne'
  quantity: number;
  grade: 'A' | 'B' | 'C';
  harvestDate: string; // ISO 8601
  imageUrl: string;
}
export interface Order {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  quantity: number;
  total: number;
  fees: number;
  status: OrderStatus;
  createdAt: string; // ISO 8601
  statusHistory: { status: OrderStatus; timestamp: string }[];
  disputeReason?: string;
  disputeEvidenceUrl?: string;
}
export interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  type: 'payment' | 'payout' | 'refund';
  status: 'pending' | 'completed' | 'failed';
  timestamp: string; // ISO 8601
}
export interface CropHealthAnalysis {
  disease: string;
  confidence: number;
  recommendation: string;
}
export interface AuthResponse {
  token: string;
  user: User;
}
// Legacy types from template, can be removed later
export interface Chat {
  id: string;
  title: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number; // epoch millis
}