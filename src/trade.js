import { ORDER_AMOUNT_PERCENT, SYMBOL } from "../configs/trade-config.js";
import { changeInitialLeverageAPI, newOrderAPI } from "./api.js";
import { nodeCache } from "./cache.js";
import { logWithTime, sendLineNotify } from "./common.js";
import {
  formatBySize,
  getOrderQuantity,
  getPositionInformation,
  getStepSize
} from "./helpers.js";

const changeToMaxLeverage = async () => {
  const leverage = nodeCache.get("leverage");
  const params = {
    symbol: SYMBOL,
    leverage: leverage,
    recvWindow: 60000,
    timestamp: Date.now()
  };
  await changeInitialLeverageAPI(params);
  await sendLineNotify(`Change To Max Leverage! ${SYMBOL} ${leverage}`);
};

const newOrder = async (params) => {
  await newOrderAPI(params);
  const { symbol, side, quantity } = params;
  await sendLineNotify(`New order! ${symbol} ${side} ${quantity}`);
};

const newOpenOrder = async ({ orderAmountPercent, side }) => {
  try {
    const [orderQuantity, stepSize] = await Promise.all([
      getOrderQuantity(orderAmountPercent),
      getStepSize()
    ]);
    await newOrder({
      symbol: SYMBOL,
      side,
      type: "MARKET",
      quantity: formatBySize(orderQuantity, stepSize),
      recvWindow: 60000,
      timestamp: Date.now()
    });
  } catch (error) {
    if (error.response && error.response.data.code === -2019) {
      console.log("orderAmountPercent:", orderAmountPercent);
      logWithTime(error.response.data.msg);
      await newOpenOrder({ orderAmountPercent: orderAmountPercent - 1, side });
    } else {
      throw error;
    }
  }
};

export const openPosition = async (side) => {
  await changeToMaxLeverage();
  await newOpenOrder({ orderAmountPercent: ORDER_AMOUNT_PERCENT, side });
  await sendLineNotify("Open position!");
};

export const closePosition = async (side) => {
  const positionInformation = await getPositionInformation();
  if (positionInformation) {
    const amount = Math.abs(positionInformation.positionAmt);
    await newOrder({
      symbol: SYMBOL,
      side,
      type: "MARKET",
      quantity: amount,
      recvWindow: 60000,
      timestamp: Date.now()
    });
    await sendLineNotify("Close position!");
  }
};
