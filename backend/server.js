const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const Crop = require('./models/Crop'); // adjust if different path

const app = express();
app.use(cors());
app.use('/uploads', express.static('uploads'));
app.get('/api/crops', async (req, res) => {
  try {
    const crops = await Crop.find();
    res.json(crops);
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

// ✅ Connect MongoDB
mongoose.connect('mongodb://localhost:27017/agrolink', {
  // `useNewUrlParser` & `useUnifiedTopology` no longer needed in v6+
});
mongoose.connection.once('open', () => console.log("MongoDB connected"));

// ✅ Route to handle crop submission
app.post('/api/crops', upload.single('image'), async (req, res) => {
  try {
    const { name, category, price, quantity, location, description } = req.body;

    console.log('Received fields:', req.body);
    console.log('Received file:', req.file);

    const newCrop = new Crop({
      name,
      category,
      price,
      quantity,
      location,
      description,
      image: req.file ? req.file.path : ''
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
