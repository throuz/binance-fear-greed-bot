import schedule from "node-schedule";
import {
  LEVERAGE,
  FUNDING_RATE_LONG_LEVEL,
  FUNDING_RATE_SHORT_LEVEL
} from "./configs/trade-config.js";
import { nodeCache } from "./src/cache.js";
import { getCachedFundingRateHistory } from "./src/cached-data.js";
import { errorHandler, sendLineNotify } from "./src/common.js";
import { getAvailableBalance, getPositionType } from "./src/helpers.js";
import { getSignal } from "./src/signal.js";
import { closePosition, openPosition } from "./src/trade.js";

const logBalance = async () => {
  const availableBalance = await getAvailableBalance();
  await sendLineNotify(`Balance: ${availableBalance}`);
};

const setTradeConfigs = async () => {
  console.log(new Date().toLocaleString());
  nodeCache.mset([
    { key: "fundingRateLongLevel", val: FUNDING_RATE_LONG_LEVEL, ttl: 0 },
    { key: "fundingRateShortLevel", val: FUNDING_RATE_SHORT_LEVEL, ttl: 0 },
    { key: "leverage", val: LEVERAGE, ttl: 0 }
  ]);
  await logBalance();
  console.log("============================================================");
};

await setTradeConfigs();

const getTradeSignal = async () => {
  const positionType = await getPositionType();
  const cachedFundingRateHistory = await getCachedFundingRateHistory();
  const curFundingRateItem =
    cachedFundingRateHistory[cachedFundingRateHistory.length - 1];
  const curFundingRate = curFundingRateItem.fundingRate;
  const fundingRateLongLevel = nodeCache.get("fundingRateLongLevel");
  const fundingRateShortLevel = nodeCache.get("fundingRateShortLevel");
  return getSignal({
    positionType,
    curFundingRate,
    fundingRateLongLevel,
    fundingRateShortLevel
  });
};

const executeStrategy = async () => {
  try {
    console.log(new Date().toLocaleString());
    const tradeSignal = await getTradeSignal();
    if (tradeSignal === "NONE") {
      console.log("NONE");
    }
    if (tradeSignal === "OPEN_LONG") {
      await openPosition("BUY");
    }
    if (tradeSignal === "CLOSE_LONG") {
      await closePosition("SELL");
      await logBalance();
    }
    console.log("============================================================");
  } catch (error) {
    await errorHandler(error);
  }
};

schedule.scheduleJob("1 * * * *", executeStrategy);
