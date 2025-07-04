const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Crop = require('./models/Crop');

mongoose.connect('mongodb://localhost:27017/agrolink');

mongoose.connection.once('open', async () => {
  console.log("Connected to MongoDB for cleaning...");

  const crops = await Crop.find();
  for (const crop of crops) {
    const imagePath = path.join(__dirname, crop.image);
    if (!fs.existsSync(imagePath)) {
      console.log(`❌ Removing: ${crop.name} (missing image: ${crop.image})`);
      await Crop.deleteOne({ _id: crop._id });
    } else {
      console.log(`✅ Keeping: ${crop.name}`);
    }
  }

  await mongoose.connection.close();  // ✅ modern async close
  console.log("Cleanup finished.");
});

