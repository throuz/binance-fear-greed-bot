import {
  IS_KLINE_START_TIME_TO_NOW,
  KLINE_INTERVAL,
  KLINE_LIMIT,
  KLINE_START_TIME,
  SYMBOL
} from "../configs/trade-config.js";
import { klineDataAPI, fearAndGreedHistoryAPI } from "./api.js";

let cachedKlineData = [];
let cachedFearAndGreedHistory = [];

const getOriginalKlineData = async () => {
  const now = Date.now();
  let originalKlineData = [];
  let startTime = KLINE_START_TIME;
  do {
    const params = {
      symbol: SYMBOL,
      interval: KLINE_INTERVAL,
      limit: KLINE_LIMIT,
      startTime
    };
    const klineData = await klineDataAPI(params);
    originalKlineData = originalKlineData.concat(klineData);
    if (klineData.length > 0) {
      startTime = klineData[klineData.length - 1][6] + 1;
    }
    if (!IS_KLINE_START_TIME_TO_NOW) break;
  } while (startTime && startTime < now);
  return originalKlineData;
};

const getKlineData = async () => {
  const klineData = await getOriginalKlineData();
  const results = klineData.map((kline) => ({
    openPrice: Number(kline[1]),
    highPrice: Number(kline[2]),
    lowPrice: Number(kline[3]),
    closePrice: Number(kline[4]),
    volume: Number(kline[5]),
    openTime: kline[0],
    closeTime: kline[6]
  }));
  return results;
};

const shouldGetLatestKlineData = () => {
  const noCachedData = cachedKlineData.length === 0;
  const isCachedDataExpired =
    cachedKlineData.length > 0 &&
    Date.now() > cachedKlineData[cachedKlineData.length - 1].closeTime;
  if (process.env.NODE_SCRIPT === "backtest") {
    return noCachedData;
  }
  return noCachedData || isCachedDataExpired;
};

export const getCachedKlineData = async () => {
  if (shouldGetLatestKlineData()) {
    const klineData = await getKlineData();
    cachedKlineData = klineData;
  }
  return cachedKlineData;
};

const getFearAndGreedHistory = async () => {
  const originalFearAndGreedHistory = await fearAndGreedHistoryAPI({
    limit: 5000
  });
  const cachedKlineData = await getCachedKlineData();

  const klineLookup = cachedKlineData.reduce((acc, kline) => {
    acc[kline.openTime] = kline.openPrice;
    return acc;
  }, {});

  const fearAndGreedHistory = originalFearAndGreedHistory.data.map(
    (fearAndGreedItem) => {
      const fngTimestamp = fearAndGreedItem.timestamp * 1000;

      const foundPrice =
        klineLookup[fngTimestamp] ||
        cachedKlineData.find(
          (kline) =>
            kline.openTime <= fngTimestamp && kline.closeTime >= fngTimestamp
        )?.openPrice;

      return {
        value: Number(fearAndGreedItem.value),
        timestamp: fngTimestamp,
        markPrice: foundPrice
      };
    }
  );

  return fearAndGreedHistory
    .filter((fearAndGreedItem) => !!fearAndGreedItem.markPrice)
    .sort((a, b) => a.timestamp - b.timestamp);
};

const shouldGetLatestFearAndGreedHistory = () => {
  const noCachedData = cachedFearAndGreedHistory.length === 0;
  const isCachedDataExpired =
    cachedFearAndGreedHistory.length > 0 &&
    Date.now() >
      cachedFearAndGreedHistory[cachedFearAndGreedHistory.length - 1]
        .timestamp +
        60 * 60 * 24 * 1000;
  if (process.env.NODE_SCRIPT === "backtest") {
    return noCachedData;
  }
  return noCachedData || isCachedDataExpired;
};

export const getCachedFearAndGreedHistory = async () => {
  if (shouldGetLatestFearAndGreedHistory()) {
    const fearAndGreedHistory = await getFearAndGreedHistory();
    cachedFearAndGreedHistory = fearAndGreedHistory;
  }
  return cachedFearAndGreedHistory;
};
