import dotenv from 'dotenv';

dotenv.config({ path: "../../.env" });
export const config = {

    
    MID: process.env.PAYTM_MID,
    MERCHANT_KEY: process.env.PAYTM_MERCHANT_KEY,
    WEBSITE: process.env.PAYTM_WEBSITE,
    CHANNEL_ID: process.env.PAYTM_CHANNEL_ID,
    INDUSTRY_TYPE_ID: process.env.PAYTM_INDUSTRY_TYPE_ID,
    TXN_URL: process.env.PAYTM_TXN_URL,
    CALLBACK_URL: "http://locahost:9000/api/paytm/payment-callback"
  };
  