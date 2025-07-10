const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  name: String,
  email: String,
  subscribedAt: {
    type: Date,
    default: Date.now,
  },
  plan: {
    type: String,
    default: "Monthly",
  },
  price: {
    type: Number,
    default: 199,
  },
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
