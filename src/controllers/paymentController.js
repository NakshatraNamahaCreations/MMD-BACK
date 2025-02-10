import Payment from "../models/Payment";
const {
  generatePaytmChecksum,
  verifyPaytmChecksum,
} = require("../utils/paytmHelper");
dotenv.config({ path: "../../.env" });

// ✅ Initiate Paytm Payment
export const initiatePayment = async (req, res) => {
  try {
    const { customerId, amount } = req.body;
    if (!customerId || !amount)
      return res
        .status(400)
        .json({ message: "Customer ID and amount are required." });

    const orderId = "ORDER" + Math.floor(10000 + Math.random() * 90000);

    // Paytm Parameters
    const paytmParams = {
      MID: process.env.PAYTM_MID,
      WEBSITE: process.env.PAYTM_WEBSITE,
      INDUSTRY_TYPE_ID: process.env.PAYTM_INDUSTRY_TYPE,
      CHANNEL_ID: process.env.PAYTM_CHANNEL_ID,
      ORDER_ID: orderId,
      CUST_ID: customerId,
      TXN_AMOUNT: amount,
      CALLBACK_URL: process.env.PAYTM_CALLBACK_URL,
    };

    // Generate Checksum
    paytmParams["CHECKSUMHASH"] = generatePaytmChecksum(
      paytmParams,
      process.env.PAYTM_MERCHANT_KEY
    );

    // Save Transaction in MongoDB
    await new Payment({ orderId, customerId, amount }).save();

    res.json({
      success: true,
      paytmParams,
      paymentUrl: process.env.PAYTM_TRANSACTION_URL,
    });
  } catch (error) {
    console.error("Payment Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Payment initiation failed." });
  }
};

// ✅ Handle Paytm Payment Callback
export const paymentCallback = async (req, res) => {
  try {
    const paytmResponse = req.body;
    const receivedChecksum = paytmResponse.CHECKSUMHASH;
    delete paytmResponse.CHECKSUMHASH;

    // Verify Paytm Checksum
    const isValidChecksum = verifyPaytmChecksum(
      paytmResponse,
      process.env.PAYTM_MERCHANT_KEY,
      receivedChecksum
    );
    if (!isValidChecksum)
      return res
        .status(400)
        .json({ success: false, message: "Invalid checksum" });

    // Update Payment Status in MongoDB
    await Payment.findOneAndUpdate(
      { orderId: paytmResponse.ORDERID },
      { status: paytmResponse.STATUS },
      { new: true }
    );

    res.json({
      success: true,
      message: "Payment status updated successfully.",
    });
  } catch (error) {
    console.error("Payment Callback Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Payment callback processing failed." });
  }
};
