export const getSignal = ({
  positionType,
  curFearAndGreed,
  fearAndGreedLongLevel,
  fearAndGreedShortLevel
}) => {
  // OPEN_LONG
  if (positionType === "NONE") {
    if (curFearAndGreed < fearAndGreedLongLevel) {
      return "OPEN_LONG";
    }
  }
  // CLOSE_LONG
  if (positionType === "LONG") {
    if (curFearAndGreed > fearAndGreedShortLevel) {
      return "CLOSE_LONG";
    }
  }
  return "NONE";
};
