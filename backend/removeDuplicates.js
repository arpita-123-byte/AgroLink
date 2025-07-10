const mongoose = require('mongoose');
const Crop = require('./models/Crop');

mongoose.connect('mongodb://localhost:27017/agrolink');

mongoose.connection.once('open', async () => {
  console.log('MongoDB connected.');

  try {
    const allCrops = await Crop.find();
    const uniqueMap = new Map();

    for (const crop of allCrops) {
      const key = `${crop.name}|${crop.category}|${crop.price}|${crop.location}`;
      if (uniqueMap.has(key)) {
        // Duplicate found: delete this one
        await Crop.findByIdAndDelete(crop._id);
        console.log(`🗑️ Deleted duplicate: ${crop.name}`);
      } else {
        uniqueMap.set(key, true);
        console.log(`✅ Kept: ${crop.name}`);
      }
    }

    console.log('✅ Duplicate removal complete.');
  } catch (err) {
    console.error('❌ Error cleaning crops:', err);
  } finally {
    mongoose.connection.close();
  }
});
