import schedule from "node-schedule";
import {
  LEVERAGE,
  FEAR_AND_GREED_LONG_LEVEL,
  FEAR_AND_GREED_SHORT_LEVEL
} from "./configs/trade-config.js";
import { nodeCache } from "./src/cache.js";
import { getCachedFearAndGreedHistory } from "./src/cached-data.js";
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
    { key: "fearAndGreedLongLevel", val: FEAR_AND_GREED_LONG_LEVEL, ttl: 0 },
    { key: "fearAndGreedShortLevel", val: FEAR_AND_GREED_SHORT_LEVEL, ttl: 0 },
    { key: "leverage", val: LEVERAGE, ttl: 0 }
  ]);
  await logBalance();
  console.log("============================================================");
};

await setTradeConfigs();

const getTradeSignal = async () => {
  const positionType = await getPositionType();
  const cachedFearAndGreedHistory = await getCachedFearAndGreedHistory();
  const curFearAndGreedItem =
    cachedFearAndGreedHistory[cachedFearAndGreedHistory.length - 1];
  const curFearAndGreed = curFearAndGreedItem.value;
  const fearAndGreedLongLevel = nodeCache.get("fearAndGreedLongLevel");
  const fearAndGreedShortLevel = nodeCache.get("fearAndGreedShortLevel");
  return getSignal({
    positionType,
    curFearAndGreed,
    fearAndGreedLongLevel,
    fearAndGreedShortLevel
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
