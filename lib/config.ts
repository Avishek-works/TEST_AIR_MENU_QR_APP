const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const REQUIRED_CLIENT_ID = "cb7e5df2-ece4-413f-967e-1e1556622ea7";
const DEFAULT_UPI_ID = "cafecoffearoma@upi";
const DEFAULT_UPI_MERCHANT_NAME = "Cafe Coffee Aroma";

export const isValidUuid = (value: string | undefined | null): value is string =>
  typeof value === "string" && UUID_PATTERN.test(value.trim());

export const getConfiguredClientId = (): string | null => {
  const configuredClientId =
    process.env.RESTAURANT_CLIENT_ID ??
    process.env.CLIENT_ID ??
    process.env.NEXT_PUBLIC_CLIENT_ID ??
    null;

  if (!isValidUuid(REQUIRED_CLIENT_ID)) {
    return null;
  }

  if (isValidUuid(configuredClientId) && configuredClientId.trim() !== REQUIRED_CLIENT_ID) {
    console.warn("[config] ignoring mismatched client id from environment", {
      configuredClientId: configuredClientId.trim(),
      requiredClientId: REQUIRED_CLIENT_ID,
    });
  }

  return REQUIRED_CLIENT_ID;
};

export const getUpiPaymentConfig = () => ({
  upiId: process.env.NEXT_PUBLIC_UPI_ID?.trim() || DEFAULT_UPI_ID,
  merchantName: process.env.NEXT_PUBLIC_UPI_MERCHANT_NAME?.trim() || DEFAULT_UPI_MERCHANT_NAME,
  qrImageUrl: process.env.NEXT_PUBLIC_UPI_QR_IMAGE_URL?.trim() || "",
});
