const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const Crop = require('./models/Crop');

const app = express();
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(__dirname));

// ✅ Corrected GET route
app.get('/api/crops', async (req, res) => {
  try {
    const crops = await Crop.find();

    // Fix backslashes in image paths
    const fixedCrops = crops.map(crop => ({
      ...crop._doc,
      image: crop.image?.replace(/\\/g, '/')
    }));

    res.json(fixedCrops);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch crops' });
  }
});

// ✅ Multer storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// ✅ MongoDB connection
mongoose.connect('mongodb://localhost:27017/agrolink');

mongoose.connection.once('open', async () => {
  console.log("MongoDB connected");

  // Optional: One-time fix to permanently update paths in DB
  try {
    const crops = await Crop.find();
    for (const crop of crops) {
      if (crop.image.includes('\\')) {
        const fixedPath = crop.image.replace(/\\/g, '/');
        await Crop.updateOne({ _id: crop._id }, { $set: { image: fixedPath } });
        console.log(`✅ Fixed path for: ${crop.name}`);
      }
    }
    console.log("✔️ Image paths cleaned");
  } catch (err) {
    console.error("❌ Error fixing image paths:", err);
  }
});

// ✅ Crop submission endpoint
app.post('/api/crops', upload.single('image'), async (req, res) => {
  try {
    const { name, category, price, quantity, location, description } = req.body;

    const newCrop = new Crop({
      name,
      category,
      price,
      quantity,
      location,
      description,
      image: req.file ? req.file.path.replace(/\\/g, "/") : ''
    });

    await newCrop.save();
    res.status(201).json({ message: 'Crop listed successfully' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
