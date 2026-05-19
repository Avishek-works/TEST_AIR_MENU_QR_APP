const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isValidUuid = (value: string | undefined | null): value is string =>
  Boolean(value) && UUID_PATTERN.test(value.trim());

export const getConfiguredClientId = (): string | null => {
  const configuredClientId =
    process.env.RESTAURANT_CLIENT_ID ??
    process.env.CLIENT_ID ??
    process.env.NEXT_PUBLIC_CLIENT_ID ??
    null;

  if (!isValidUuid(configuredClientId)) {
    return null;
  }

  return configuredClientId.trim();
};
