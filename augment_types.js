const fs = require('fs');
const path = 'D:/BACKUP/AM/aya/webaya/lib/api/types.ts';

let content = fs.readFileSync(path, 'utf8');

// Add weight to ApiProduct
content = content.replace(
  '  base_price: number;\n  stock?: number;',
  '  base_price: number;\n  weight?: number;\n  stock?: number;'
);

// Add weight to ApiProductVariant
content = content.replace(
  '  effective_price: number;\n  stock: number;',
  '  effective_price: number;\n  weight?: number | null;\n  effective_weight?: number;\n  stock: number;'
);

// Add weight to ApiOrderItem
content = content.replace(
  '  unit_price: number;\n  quantity: number;',
  '  unit_price: number;\n  weight?: number;\n  quantity: number;'
);

// Add shipping types
const shippingRateTypes = `
export interface ShippingRateOption {
  courier: string;
  courier_name: string;
  service_code: string;
  service_name: string;
  shipping_method: string;
  cost: number;
  etd: string;
  total_weight: number;
  weight_kg: number;
}

export interface CalculateShippingResponse {
  destination: {
    province: string;
    city: string | null;
  };
  total_weight: number;
  weight_kg: number;
  rates: ShippingRateOption[];
}
`;

// Insert shippingRateTypes before Stage 13E
content = content.replace('// Stage 13E: Checkout preparation types', shippingRateTypes + '\n// Stage 13E: Checkout preparation types');

// Augment CheckoutShippingMethod and PreparedCheckoutPayload
content = content.replace(
  'export type CheckoutShippingMethod = "jnt" | "jne";',
  'export type CheckoutShippingMethod = "jnt" | "jne" | string;'
);

content = content.replace(
  `export interface PreparedCheckoutPayload {
  address_id: number;
  shipping_method: CheckoutShippingMethod;
  notes: string | null;
  items: PreparedCheckoutItem[];
}`,
  `export interface PreparedCheckoutPayload {
  address_id: number;
  shipping_method?: string;
  shipping_courier?: string;
  shipping_service?: string;
  notes: string | null;
  tracking_number?: string | null;
  items: PreparedCheckoutItem[];
}`
);

// Augment ApiOrder
content = content.replace(
  '  shipping_method: string;',
  `  shipping_method: string;
  shipping_courier?: string;
  shipping_service?: string;
  shipping_etd?: string;
  total_weight?: number;
  total_weight_kg?: number;
  tracking_number?: string | null;`
);

fs.writeFileSync(path, content, 'utf8');
console.log('types.ts augmented successfully');
