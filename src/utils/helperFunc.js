import crypto from "crypto";

import PaytmChecksum from "paytmchecksum";

export const generatePaytmChecksum = (params, merchantKey) => {
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


// ✅ Generate Checksum using Paytm's Official Library
// export const generatePaytmChecksum = async (params, merchantKey) => {
//   return await PaytmChecksum.generateSignature(params, merchantKey);
// };

// ✅ Verify Checksum using Paytm's Official Library
export const verifyPaytmChecksum = async (params, merchantKey, receivedChecksum) => {
  return await PaytmChecksum.verifySignature(params, merchantKey, receivedChecksum);
};

export  default { generatePaytmChecksum, verifyPaytmChecksum };
