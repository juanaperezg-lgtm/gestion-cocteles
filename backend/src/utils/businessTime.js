const DEFAULT_BUSINESS_TIMEZONE = 'America/Bogota';
const BUSINESS_TIMEZONE_PATTERN = /^[A-Za-z0-9_\/+\-]+$/;

const configuredTimezone = process.env.BUSINESS_TIMEZONE?.trim();

export const BUSINESS_TIMEZONE = configuredTimezone && BUSINESS_TIMEZONE_PATTERN.test(configuredTimezone)
  ? configuredTimezone
  : DEFAULT_BUSINESS_TIMEZONE;

export const BUSINESS_NOW_AT_TZ_SQL = `CURRENT_TIMESTAMP AT TIME ZONE '${BUSINESS_TIMEZONE}'`;
export const BUSINESS_DATE_SQL = `(${BUSINESS_NOW_AT_TZ_SQL})::date`;
export const BUSINESS_TIME_SQL = `(${BUSINESS_NOW_AT_TZ_SQL})::time`;
export const BUSINESS_MONTH_START_SQL = `DATE_TRUNC('month', ${BUSINESS_NOW_AT_TZ_SQL})::date`;
export const BUSINESS_NEXT_MONTH_START_SQL = `(DATE_TRUNC('month', ${BUSINESS_NOW_AT_TZ_SQL}) + INTERVAL '1 month')::date`;
