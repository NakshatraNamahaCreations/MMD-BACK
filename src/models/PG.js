import mongoose from "mongoose";

const PGchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  custId: { type: String, required: true },
  industryTypeId: { type: String, required: true },
  channelId: { type: String, required: true },
  txnAmount: { type: String, required: true },
  service: { type: String, required: true },
  checksumHash: { type: String, required: true },
  ORDER_ID:{type:String},
  paymentStatus: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now }
});

const PGModel=  mongoose.model("PG", PGchema);
export default PGModel;
