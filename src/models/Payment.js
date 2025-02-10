import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  customerId: { type: String, required: true },
  amount: { type: String, required: true },
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now },
});

const Payments=  mongoose.model("Payment", PaymentSchema);
export default Payments;
