import type { ArtisanDeliveryType, ArtisanOrderStatus } from "@/generated/prisma/enums";

export interface ArtisanWorkItem {
  id: string;
  category: string;
  title: string;
  text: string;
  imageUrl: string;
  color: string;
  isAd: boolean;
  order: number;
  tags: string[];
  price: number | null;
  createdAt: string;
}

export interface ArtisanOrderItem {
  id: string;
  status: ArtisanOrderStatus;
  workId: string;
  work: { id: string; title: string; category: string; imageUrl: string };
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  churchName: string | null;
  requestText: string;
  size: string | null;
  referenceFileUrl: string | null;
  referenceLink: string | null;
  shootPreference: string | null;
  shootLocation: string | null;
  shootTime: string | null;
  wantsEditing: boolean;
  quantity: string | null;
  desiredDeadline: string | null;
  deliveryType: ArtisanDeliveryType;
  shippingAddress: string | null;
  draftFileUrl: string | null;
  finalFileUrl: string | null;
  assignedStaffId: string | null;
  assignedStaff: { id: string; name: string | null; email: string } | null;
  createdAt: string;
  updatedAt: string;
}
