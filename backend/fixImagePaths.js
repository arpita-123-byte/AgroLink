// fixPaths.js
const mongoose = require('mongoose');
const Crop = require('./models/Crop');

mongoose.connect('mongodb://localhost:27017/agrolink');

mongoose.connection.once('open', async () => {
  const crops = await Crop.find();
  for (const crop of crops) {
    if (crop.image.includes('\\')) {
      const cleanPath = crop.image.replace(/\\/g, '/');
      await Crop.updateOne({ _id: crop._id }, { $set: { image: cleanPath } });
      console.log(`✅ Fixed: ${crop.name}`);
    }
  }
  console.log("✔️ All paths cleaned.");
  mongoose.disconnect();
});


