const mongoose = require("mongoose");
const Crop = require("./models/Crop");

mongoose.connect("mongodb://localhost:27017/agrolink")
  .then(async () => {
    console.log("Connected to MongoDB");

    const result = await Crop.updateMany(
      { sellerEmail: "arpita.bansal.23cse@bmu.edu.in" }, // Only update those previously set
      { $set: { sellerEmail: "sudesh6787@gmail.com" } } // <-- New correct email
    );

    console.log(`✅ Updated ${result.modifiedCount} crops.`);
    mongoose.disconnect();
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));
