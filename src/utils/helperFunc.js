import crypto from "crypto";
// ✅ Function to Generate Paytm Checksum
const generatePaytmChecksum = (params, merchantKey) => {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});

  const paramsString = Object.values(sortedParams).join("|");
  return crypto
    .createHmac("sha256", merchantKey)
    .update(paramsString)
    .digest("hex");
};

// ✅ Function to Verify Paytm Checksum
const verifyPaytmChecksum = (params, merchantKey, receivedChecksum) => {
  const generatedChecksum = generatePaytmChecksum(params, merchantKey);
  return generatedChecksum === receivedChecksum;
};

module.exports = { generatePaytmChecksum, verifyPaytmChecksum };
