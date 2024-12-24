export const getSignal = ({
  positionType,
  curFundingRate,
  fundingRateLongLevel,
  fundingRateShortLevel
}) => {
  // OPEN_LONG
  if (positionType === "NONE") {
    if (curFundingRate < fundingRateLongLevel) {
      return "OPEN_LONG";
    }
  }
  // CLOSE_LONG
  if (positionType === "LONG") {
    if (curFundingRate > fundingRateShortLevel) {
      return "CLOSE_LONG";
    }
  }
  return "NONE";
};
