import { IndexedEntity } from "./core-utils";
import type { User, Chat, ChatMessage, Listing, Order } from "@shared/types";
import { MOCK_USERS, MOCK_LISTINGS, MOCK_ORDERS } from "@shared/mock-data";
// USER ENTITY
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "", role: 'Farmer', kycStatus: 'Not Submitted', location: '' };
  static seedData = MOCK_USERS;
}
// LISTING ENTITY
export class ListingEntity extends IndexedEntity<Listing> {
  static readonly entityName = "listing";
  static readonly indexName = "listings";
  static readonly initialState: Listing = {
    id: "",
    farmerId: "",
    name: "",
    description: "",
    category: "",
    price: 0,
    unit: "",
    quantity: 0,
    grade: 'A',
    harvestDate: "",
    imageUrl: ""
  };
  static seedData = MOCK_LISTINGS;
}
// ORDER ENTITY
export class OrderEntity extends IndexedEntity<Order> {
  static readonly entityName = "order";
  static readonly indexName = "orders";
  static readonly initialState: Order = {
    id: "",
    listingId: "",
    buyerId: "",
    sellerId: "",
    quantity: 0,
    total: 0,
    fees: 0,
    status: 'Placed',
    createdAt: "",
    statusHistory: [],
    disputeReason: undefined,
    disputeEvidenceUrl: undefined,
  };
  static seedData = MOCK_ORDERS;
}
// LEGACY CHAT ENTITY (from template)
export type ChatBoardState = Chat & { messages: ChatMessage[] };
export class ChatBoardEntity extends IndexedEntity<ChatBoardState> {
  static readonly entityName = "chat";
  static readonly indexName = "chats";
  static readonly initialState: ChatBoardState = { id: "", title: "", messages: [] };
  async listMessages(): Promise<ChatMessage[]> {
    const { messages } = await this.getState();
    return messages;
  }
  async sendMessage(userId: string, text: string): Promise<ChatMessage> {
    const msg: ChatMessage = { id: crypto.randomUUID(), chatId: this.id, userId, text, ts: Date.now() };
    await this.mutate(s => ({ ...s, messages: [...s.messages, msg] }));
    return msg;
  }
}