/**
 * This function rounds float to a desired number of decimals
 * @param {float}   val           The value to round
 * @param {integer} numOfDecimals The number of decimals to round to
 */
const roundToDecimal = (val, numOfDecimals) => {
  const base = 10 ** numOfDecimals;
  return Math.round(val * base) / base;
};

module.exports = { roundToDecimal };
