import  Paytm  from 'paytm-pg-node-sdk';
import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

// For Staging Environment
// const environment = Paytm.LibraryConstants.STAGING_ENVIRONMENT;
const environment = Paytm.LibraryConstants.PRODUCTION_ENVIRONMENT;


// For Production Environment
// const environment = Paytm.LibraryConstants.PRODUCTION_ENVIRONMENT;

const mid ="MAKEMY09422872921500" ;
const key = "Wi%SmC%mkRR%jP8M";
const website ="DEFAULT";


const callbackUrl = 'http://localhost:9000/callback';
Paytm.MerchantProperties.setCallbackUrl(callbackUrl);

Paytm.MerchantProperties.initialize(environment, mid, key, website);

export default  Paytm;
