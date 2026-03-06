import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Payment Model
 *
 * Stores all financial transactions:
 * - Wallet recharges
 * - Order payments
 * - Subscription payments
 * - Refunds
 * - Rewards
 */
const PaymentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    subscription: { type: Schema.Types.ObjectId, ref: "Subscription" }, // Add subscription reference
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: [
        "wallet_recharge", 
        "order_payment", 
        "subscription_payment", // Added this
        "refund", 
        "reward", 
        "referral_reward"
      ],
      required: true,
    },
    method: {
      type: String,
      enum: ["wallet", "card", "cash_on_delivery", "sslcommerz"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "success",
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model("Payment", PaymentSchema);

export default Payment;