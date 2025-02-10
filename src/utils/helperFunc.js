import PaytmChecksum from "paytmchecksum";

// ✅ Generate Checksum using Paytm’s official method
export const generatePaytmChecksum = async (params, merchantKey) => {
  return await PaytmChecksum.generateSignature(params, merchantKey);
};
export const verifyPaytmChecksum = async (params, merchantKey, receivedChecksum) => {
  // ✅ Create a copy of the object to prevent accidental modifications
  let paramsCopy = { ...params };

  // ✅ Remove CHECKSUMHASH only for verification, NOT BEFORE
  const checksum = paramsCopy.CHECKSUMHASH;
  delete paramsCopy.CHECKSUMHASH; 

  try {
    const isValid = await PaytmChecksum.verifySignature(paramsCopy, merchantKey, checksum);
    return isValid;
  } catch (error) {
    console.error("❌ Error Verifying Checksum:", error);
    return false;
  }
};