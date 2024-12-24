import {
  IS_KLINE_START_TIME_TO_NOW,
  KLINE_INTERVAL,
  KLINE_LIMIT,
  KLINE_START_TIME,
  SYMBOL
} from "../configs/trade-config.js";
import { klineDataAPI, fundingRateHistoryAPI } from "./api.js";

let cachedKlineData = [];
let cachedFundingRateHistory = [];

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

const getOriginalFundingRateHistory = async () => {
  const now = Date.now();
  let originalFundingRateHistory = [];
  let startTime = KLINE_START_TIME;
  do {
    const params = {
      symbol: SYMBOL,
      limit: 1000,
      startTime
    };
    const fundingRateHistory = await fundingRateHistoryAPI(params);
    originalFundingRateHistory =
      originalFundingRateHistory.concat(fundingRateHistory);
    if (fundingRateHistory.length > 0) {
      startTime =
        fundingRateHistory[fundingRateHistory.length - 1].fundingTime + 1;
    }
    if (!IS_KLINE_START_TIME_TO_NOW) break;
  } while (startTime && startTime + 60 * 60 * 8 * 1000 < now);
  return originalFundingRateHistory;
};

const getFundingRateHistory = async () => {
  const originalFundingRateHistory = await getOriginalFundingRateHistory();
  const cachedKlineData = await getCachedKlineData();
  const fundingRateHistory = originalFundingRateHistory.map(
    (fundingRateItem) => {
      const foundPrice = cachedKlineData.find(
        (kline) =>
          kline.openTime <= fundingRateItem.fundingTime &&
          kline.closeTime >= fundingRateItem.fundingTime
      ).openPrice;
      return {
        ...fundingRateItem,
        fundingRate: Number(fundingRateItem.fundingRate),
        markPrice: foundPrice
      };
    }
  );
  return fundingRateHistory;
};

const shouldGetLatestFundingRateHistory = () => {
  const noCachedData = cachedFundingRateHistory.length === 0;
  const isCachedDataExpired =
    cachedFundingRateHistory.length > 0 &&
    Date.now() >
      cachedFundingRateHistory[cachedFundingRateHistory.length - 1]
        .fundingTime +
        60 * 60 * 8 * 1000;
  if (process.env.NODE_SCRIPT === "backtest") {
    return noCachedData;
  }
  return noCachedData || isCachedDataExpired;
};

export const getCachedFundingRateHistory = async () => {
  if (shouldGetLatestFundingRateHistory()) {
    const fundingRateHistory = await getFundingRateHistory();
    cachedFundingRateHistory = fundingRateHistory;
  }
  return cachedFundingRateHistory;
};
