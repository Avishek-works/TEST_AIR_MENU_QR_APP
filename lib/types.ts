export interface MenuCategory {
  id: string;
  name: string;
  sort_order: number;
}

export interface RawMenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  is_veg: boolean;
  is_non_veg: boolean;
  is_bestseller: boolean;
  active: boolean;
}

export interface MenuPresentationItem extends RawMenuItem {
  uiIsVeg: boolean;
  uiIsNonVeg: boolean;
  uiIsBestseller: boolean;
  uiImage: string;
}

export type CategoryFilter = "__all__" | string;
export type MenuImageByIdMap = Record<string, string>;
export type MenuImageBySlugMap = Record<string, string>;
export type MenuImageByCategoryMap = Record<string, string>;

export interface CartLineItem {
  menuItemId: string;
  itemName: string;
  qty: number;
  unitPrice: number;
  imageUrl?: string | null;
}

export interface CustomerDraft {
  name: string;
  phone: string;
  email: string;
  dob: string;
}

export interface PlaceOrderInput {
  tableNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerDob?: string;
  notes?: string;
  items: CartLineItem[];
}

export interface PlaceOrderResult {
  ok: boolean;
  orderId?: string;
  error?: string;
}


export interface CustomerLookupResult {
  found: boolean;
  customer?: {
    id: string;
    name: string;
    email: string;
    dob: string;
  };
}
