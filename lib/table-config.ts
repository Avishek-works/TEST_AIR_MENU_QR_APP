const DEFAULT_TABLE_COUNT = 4;

const toPositiveInteger = (value: string | undefined): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const normalizeTableOption = (value: string) => value.trim().toUpperCase();

const configuredTableOptions =
  process.env.NEXT_PUBLIC_TABLE_OPTIONS
    ?.split(",")
    .map(normalizeTableOption)
    .filter(Boolean) ?? [];

const configuredTableCount = toPositiveInteger(process.env.NEXT_PUBLIC_TABLE_COUNT);

export const TABLE_OPTIONS =
  configuredTableOptions.length > 0
    ? configuredTableOptions
    : Array.from({ length: configuredTableCount ?? DEFAULT_TABLE_COUNT }, (_, index) => `T${index + 1}`);

export const DEFAULT_TABLE_ID = TABLE_OPTIONS[0] ?? "T1";
export const ORDER_PREPARATION_ETA_LABEL = process.env.NEXT_PUBLIC_ORDER_PREPARATION_ETA?.trim() || "15-20 mins";
