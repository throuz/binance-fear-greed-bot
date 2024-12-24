export const SYMBOL = "BTCUSDT";
export const QUOTE_ASSET = "USDT";
export const ORDER_AMOUNT_PERCENT = 100; // 100%
export const KLINE_INTERVAL = "1h";
export const KLINE_LIMIT = 1500;
export const FUNDING_RATE_LONG_LEVEL = 69;
export const FUNDING_RATE_SHORT_LEVEL = 46;
export const LEVERAGE = 1;

// Backtest parameters
export const INITIAL_FUNDING = 100;
export const FEE = 0.0005; // 0.05%
export const FUNDING_RATE = 0.0001; // 0.01%
export const LEVERAGE_SETTING = { min: 1, max: 1, step: 1 };
export const RANDOM_SAMPLE_NUMBER = null; // number or null
export const KLINE_START_TIME = getTimestampYearsAgo(10); // timestamp or null
export const IS_KLINE_START_TIME_TO_NOW = true;

function getTimestampYearsAgo(years) {
  const currentDate = new Date();
  const targetYear = currentDate.getFullYear() - years;
  currentDate.setFullYear(targetYear);
  return currentDate.getTime();
}
