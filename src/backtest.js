import { Presets, SingleBar } from "cli-progress";
import {
  FEE,
  FUNDING_RATE,
  INITIAL_FUNDING,
  LEVERAGE_SETTING,
  ORDER_AMOUNT_PERCENT,
  RANDOM_SAMPLE_NUMBER
} from "../configs/trade-config.js";
import { getCachedFundingRateHistory } from "./cached-data.js";
import { getSignal } from "./signal.js";
import { getStepSize, formatBySize } from "./helpers.js";

const getReadableTime = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const getLogColor = (pnl) => {
  const logRedColor = "\x1b[31m";
  const logGreenColor = "\x1b[32m";
  return pnl > 0 ? logGreenColor : logRedColor;
};

const toPercentage = (number) => {
  return `${Math.round(number * 100)}%`;
};

const calculateHours = (openTimestamp, closeTimestamp) => {
  const differenceInMilliseconds = closeTimestamp - openTimestamp;
  const hours = differenceInMilliseconds / (1000 * 60 * 60);
  return hours;
};

const logTradeResult = ({
  fund,
  positionFund,
  pnl,
  positionType,
  openPrice,
  closePrice,
  openTimestamp,
  closeTimestamp
}) => {
  const finalFund = fund + positionFund + pnl;
  const logResetColor = "\x1b[0m";
  const logColor = getLogColor(pnl);
  const formatedFund = finalFund.toFixed(2);
  const pnlPercentage = toPercentage(pnl / positionFund);
  const holdTimeHours = calculateHours(openTimestamp, closeTimestamp);
  const startTime = getReadableTime(openTimestamp);
  const endTime = getReadableTime(closeTimestamp);
  console.log(
    `${logColor}Fund: ${formatedFund} ${positionType} [${openPrice} ~ ${closePrice}] (${pnlPercentage}) [${startTime} ~ ${endTime}] (${holdTimeHours} hrs)${logResetColor}`
  );
};

const getFundingFee = ({
  positionAmt,
  closePrice,
  openTimestamp,
  closeTimestamp
}) => {
  const timeDifference = closeTimestamp - openTimestamp;
  const hours = timeDifference / (1000 * 60 * 60);
  const times = Math.floor(hours / 8);
  const fundingFee = positionAmt * closePrice * FUNDING_RATE * times;
  return fundingFee;
};

export const getBacktestResult = ({
  shouldLogResults,
  cachedFundingRateHistory,
  stepSize,
  fundingRateLongLevel,
  fundingRateShortLevel,
  leverage
}) => {
  let fund = INITIAL_FUNDING;
  let positionType = "NONE";
  let positionAmt = null;
  let positionFund = null;
  let openTimestamp = null;
  let openPrice = null;
  let liquidationPrice = null;
  for (let i = 0; i < cachedFundingRateHistory.length; i++) {
    const curFundingRateItem = cachedFundingRateHistory[i];
    const curFundingRate = curFundingRateItem.fundingRate;
    const signal = getSignal({
      positionType,
      curFundingRate,
      fundingRateLongLevel,
      fundingRateShortLevel
    });
    if (signal === "OPEN_LONG") {
      openPrice = curFundingRateItem.markPrice;
      const orderQuantity =
        (fund * (ORDER_AMOUNT_PERCENT / 100) * leverage) / openPrice;
      positionAmt = formatBySize(orderQuantity, stepSize);
      const fee = positionAmt * openPrice * FEE;
      positionFund = (positionAmt * openPrice) / leverage;
      fund = fund - positionFund - fee;
      positionType = "LONG";
      openTimestamp = curFundingRateItem.fundingTime;
      liquidationPrice = openPrice * (1 - 1 / leverage);
    }
    if (signal === "CLOSE_LONG") {
      const closePrice = curFundingRateItem.markPrice;
      const closeTimestamp = curFundingRateItem.fundingTime;
      const fee = positionAmt * closePrice * FEE;
      const fundingFee = getFundingFee({
        positionAmt,
        closePrice,
        openTimestamp,
        closeTimestamp
      });
      const pnl = (closePrice - openPrice) * positionAmt - fee - fundingFee;
      if (shouldLogResults) {
        logTradeResult({
          fund,
          positionFund,
          pnl,
          positionType,
          openPrice,
          closePrice,
          openTimestamp,
          closeTimestamp
        });
      }
      fund = fund + positionFund + pnl;
      positionType = "NONE";
      positionAmt = null;
      positionFund = null;
      openTimestamp = null;
      openPrice = null;
      liquidationPrice = null;
    }
    // Liquidation (More precise logic is needed because there is an 8 hour time difference)
    if (
      positionType === "LONG" &&
      curFundingRateItem.markPrice < liquidationPrice
    ) {
      return null;
    }
  }
  return {
    currentPositionType: positionType,
    fund,
    fundingRateLongLevel,
    fundingRateShortLevel,
    leverage
  };
};

const calculateRoundedSum = ({ base, increment, precision }) => {
  return Number((base + increment).toFixed(precision));
};

const getMaxMinFundingRates = (cachedFundingRateHistory) => {
  let maxFundingRate = -Infinity;
  let minFundingRate = Infinity;
  for (const item of cachedFundingRateHistory) {
    const { fundingRate } = item;
    if (fundingRate > maxFundingRate) maxFundingRate = fundingRate;
    if (fundingRate < minFundingRate) minFundingRate = fundingRate;
  }
  return { maxFundingRate, minFundingRate };
};

const getSettings = (cachedFundingRateHistory) => {
  const settings = [];
  const { maxFundingRate, minFundingRate } = getMaxMinFundingRates(
    cachedFundingRateHistory
  );
  console.log("minFundingRate", minFundingRate);
  console.log("maxFundingRate", maxFundingRate);

  for (
    let leverage = LEVERAGE_SETTING.min;
    leverage <= LEVERAGE_SETTING.max;
    leverage = calculateRoundedSum({
      base: leverage,
      increment: LEVERAGE_SETTING.step,
      precision: 0
    })
  ) {
    for (
      let fundingRateLongLevel = minFundingRate;
      fundingRateLongLevel <= maxFundingRate;
      fundingRateLongLevel = calculateRoundedSum({
        base: fundingRateLongLevel,
        increment: 0.0001,
        precision: 4
      })
    ) {
      for (
        let fundingRateShortLevel = minFundingRate;
        fundingRateShortLevel <= maxFundingRate;
        fundingRateShortLevel = calculateRoundedSum({
          base: fundingRateShortLevel,
          increment: 0.0001,
          precision: 4
        })
      ) {
        settings.push({
          leverage,
          fundingRateLongLevel,
          fundingRateShortLevel
        });
      }
    }
  }
  return settings;
};

const getRandomSettings = (cachedFundingRateHistory) => {
  const settings = getSettings(cachedFundingRateHistory);
  if (RANDOM_SAMPLE_NUMBER) {
    const samples = [];
    for (let i = 0; i < RANDOM_SAMPLE_NUMBER; i++) {
      const randomIndex = Math.floor(Math.random() * settings.length);
      samples.push(settings[randomIndex]);
    }
    return samples;
  }
  return settings;
};

export const getBestResult = async () => {
  let bestResult = { fund: 0 };

  const [cachedFundingRateHistory, stepSize] = await Promise.all([
    getCachedFundingRateHistory(),
    getStepSize()
  ]);

  const settings = getSettings(cachedFundingRateHistory);
  console.log("Total settings length", settings.length);
  const randomSettings = getRandomSettings(cachedFundingRateHistory);
  console.log("Random samples length", randomSettings.length);

  const progressBar = new SingleBar({}, Presets.shades_classic);
  progressBar.start(randomSettings.length, 0);

  for (const setting of randomSettings) {
    const { fundingRateLongLevel, fundingRateShortLevel, leverage } = setting;
    const backtestResult = getBacktestResult({
      shouldLogResults: false,
      cachedFundingRateHistory,
      stepSize,
      fundingRateLongLevel,
      fundingRateShortLevel,
      leverage
    });
    if (backtestResult && backtestResult.fund > bestResult.fund) {
      bestResult = backtestResult;
    }
    progressBar.increment();
  }

  progressBar.stop();

  return bestResult;
};
