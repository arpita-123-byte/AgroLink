const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  customer: {
    fullName: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
  },
  items: [
    {
      id: String,
      name: String,
      quantity: Number,
      price: Number,
      image: String,
    },
  ],
  totalAmount: Number,
  gst: Number,
  delivery: Number,
  placedAt: {
    type: Date,
    default: Date.now
  },

  // ✅ NEW FIELD: Order progress status
  status: {
    type: String,
    enum: ["Confirmed", "Packed", "Shipped", "Out for Delivery", "Delivered"],
    default: "Confirmed"
  },

  // ✅ NEW FIELD: Expected delivery date
  expectedDeliveryDate: {
    type: Date,
    required: false // optional, but useful for email notifications
  }
});

module.exports = mongoose.model("Order", orderSchema);

