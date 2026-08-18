export const PAYMENT_STATUS_VALUES = ["PAGO", "PENDENTE", "PARCIAL"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS_VALUES)[number];

export const GIFT_TYPE_VALUES = ["SOMENTE_CONVITE", "CONVITE_CAMISA_CANECA"] as const;
export type GiftType = (typeof GIFT_TYPE_VALUES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PAGO: "Pago",
  PENDENTE: "Pendente",
  PARCIAL: "Parcial",
};

export const GIFT_TYPE_LABELS: Record<GiftType, string> = {
  SOMENTE_CONVITE: "Somente convite",
  CONVITE_CAMISA_CANECA: "Convite + camisa e caneca",
};

export const PAYMENT_METHOD_OPTIONS = [
  "Dinheiro",
  "Pix",
  "Cartão de crédito",
  "Cartão de débito",
  "Transferência",
] as const;
