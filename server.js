require("dotenv").config();

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const nodemailer = require("nodemailer");
const fs = require("fs");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const open = require("child_process").exec;

const Crop = require("./models/Crop");
const User = require("./models/User");
const Subscription = require("./models/Subscription");
const Order = require("./models/order");

const app = express();
// app.use(express.static(__dirname));
const PORT = 5000;



// Middleware

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session config
app.use(
  session({
    secret: "agrolink_secret_key",
    resave: false,
    saveUninitialized: false,
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Static folders
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

// HTML Routes
    const pages = [
      "login", "signup", "index", "sell", "crops", "crop-detail",
      "register", "cart", "checkout", "order-confirmation", "update-status", "order-status"
    ];
    pages.forEach((page) => {
      app.get(`/${page}.html`, (req, res) => res.sendFile(path.join(__dirname, `${page}.html`)));
    });
    app.get("/", (req, res) => res.redirect("/login.html"));

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// MongoDB setup
mongoose.set("strictQuery", false);
mongoose.set("bufferCommands", false);

mongoose
  .connect("mongodb://localhost:27017/agrolink")
  .then(() => {
    console.log("MongoDB connected");

    // Passport serialization
    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser(async (id, done) => {
      const user = await User.findById(id);
      done(null, user);
    });

    // Google OAuth Strategy
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          const existingUser = await User.findOne({ email: profile.emails[0].value });
          if (existingUser) return done(null, existingUser);

          const newUser = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            password: "google_oauth",
          });
          await newUser.save();
          done(null, newUser);
        }
      )
    );

    // Facebook Strategy
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: "/auth/facebook/callback",
          profileFields: ["id", "displayName", "emails"],
        },
        async (accessToken, refreshToken, profile, done) => {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(null, false);

          let user = await User.findOne({ email });
          if (user) return done(null, user);

          user = new User({
            name: profile.displayName,
            email,
            password: "facebook_oauth",
          });
          await user.save();
          done(null, user);
        }
      )
    );

    // Auth Routes
    app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
    app.get(
      "/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/login.html" }),
      (req, res) => res.redirect("/index.html")
    );

    app.get("/auth/facebook", passport.authenticate("facebook", { scope: ["email"] }));
    app.get(
      "/auth/facebook/callback",
      passport.authenticate("facebook", { failureRedirect: "/login.html" }),
      (req, res) => res.redirect("/index.html")
    );
    

    

    // API: Get all crops
    app.get("/api/crops", async (req, res) => {
      try {
        const crops = await Crop.find();
        res.json(crops.map(c => ({ ...c._doc, image: c.image?.replace(/\\/g, "/") })));
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch crops" });
      }
    });

    // API: Get crop by ID
    app.get("/api/crops/:id", async (req, res) => {
      try {
        const crop = await Crop.findById(req.params.id);
        if (!crop) return res.status(404).json({ error: "Crop not found" });

        res.json({ ...crop._doc, image: crop.image?.replace(/\\/g, "/") });
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch crop details" });
      }
    });


    // API: Post crop
    app.post("/api/crops", upload.single("image"), async (req, res) => {
      try {
        const { name, category, price, quantity, location, description } = req.body;
        const newCrop = new Crop({
          name,
          category,
          price,
          quantity,
          location,
          sellerEmail,
          description,
          image: req.file ? `/uploads/${req.file.filename}` : "",
        });

        await newCrop.save();
        res.status(201).json({ message: "Crop listed successfully", crop: newCrop });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });
// ✅ API: Stats route for "Our Impact" section (including Delivered Orders)
app.get("/api/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCrops = await Crop.countDocuments();
    const totalOrders = await Order.countDocuments({ status: "Delivered" }); // ✅ Only Delivered

    res.json({ totalUsers, totalCrops, totalOrders });
  } catch (err) {
    console.error("Stats fetch error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});







    // Subscription route
    app.post("/subscribe", async (req, res) => {
      try {
        const { name, email } = req.body;
        const subscription = new Subscription({ name, email });
        await subscription.save();

        res.send(`
          <h2 style="text-align:center;margin-top:2rem;">
            Thank you for subscribing to AgroLink Premium! 🎉<br>
            Enjoy free delivery.
          </h2>
          <p style="text-align:center;"><a href="/index.html">Back to Home</a></p>
        `);
      } catch (error) {
        console.error("Subscription Error:", error);
        res.status(500).send("Error saving subscription. Try again later.");
      }
    });

    // Place Order and Save to DB
    app.post("/api/checkout", async (req, res) => {

      try {
        const { customer, items, totalAmount, gst, delivery } = req.body;

        if (!customer || !items || items.length === 0) {
          return res.status(400).json({ success: false, message: "Missing order data" });
        }

        const order = new Order({
          customer,
          items,
          totalAmount,
          gst,
          delivery,
          placedAt: new Date()
        });

        await order.save();
        res.json({ success: true, orderId: order._id });
      } catch (error) {
        console.error("Order error:", error);
        res.status(500).json({ success: false, message: "Something went wrong" });
      }
    });

    // Signup
    app.post("/signup", async (req, res) => {
      try {
        const { name, email, password, confirmPassword } = req.body;
        if (password !== confirmPassword) return res.status(400).send("Passwords do not match");

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).send("User already exists");

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();

        req.session.userId = user._id;
        res.status(200).json({ success: true });
      } catch (err) {
        res.status(500).send("Error signing up");
      }
    });

    // Login
    app.post("/login", async (req, res) => {
      try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).send("Invalid email or password");

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).send("Invalid email or password");

        req.session.userId = user._id;
        res.status(200).json({ success: true });
      } catch (err) {
        res.status(500).send("Error logging in");
      }
    });

    // Test route
    app.get("/test-users", async (req, res) => {
      try {
        const users = await User.find();
        res.json(users);
      } catch (err) {
        res.status(500).send("User model broken: " + err.message);
      }
    });

    // Logout
    app.get("/logout", (req, res) => {
      req.session.destroy(() => {
        res.redirect("/login.html");
      });
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      open(`start http://localhost:${PORT}`);
    });

// 1. GET order by ID
    app.get("/api/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// 2. PATCH status of order
app.patch("/api/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ success: true, updatedStatus: order.status });
  } catch (err) {
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// Cancel order by ID
app.patch("/api/orders/:id/cancel", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (["Shipped", "Out for Delivery", "Delivered"].includes(order.status)) {
      return res.status(400).json({ success: false, message: "Cannot cancel this order now" });
    }

    order.status = "Cancelled";
    await order.save();
    res.json({ success: true });
  } catch (err) {
    console.error("Cancel order error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// ✅ Return order by ID
app.patch("/api/orders/:id/return", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.status !== "Delivered") {
      return res.status(400).json({ success: false, message: "Only delivered orders can be returned" });
    }

    order.status = "Returned";
    await order.save();
    res.json({ success: true });
  } catch (err) {
    console.error("Return order error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



  })
  .catch((err) => console.error("MongoDB connection error:", err));

    // Example using Express + Mongoose
app.get("/api/crops/search", async (req, res) => {
  const query = req.query.query;
  // console.log("Search query received:", query);  //  Log it

  if (!query) {
    return res.status(400).json({ error: "No crop query provided" });
  }

  try {
    const regex = new RegExp(query, "i");
    const crops = await Crop.find({ name: regex });

    // console.log("Matching crops found:", crops.length);  //  Log how many found

    res.json(crops.map(c => ({ ...c._doc, image: c.image?.replace(/\\/g, "/") })));
  } catch (error) {
    console.error("❌ Error in /api/crops/search:", error.message, error.stack); // More debug info
    res.status(500).json({ error: "Failed to fetch crop details" });
  }
});



// 📦 Checkout Route
app.post("/api/checkout", async (req, res) => {
  try {
    let {
      customer,
      items,
      totalAmount,
      gst,
      delivery,
      expectedDeliveryDate,
    } = req.body;

    // ✅ Validate customer info and items
    if (!customer || !items || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Missing order data" });
    }

    // ✅ Normalize email
    if (customer.email) {
      customer.email = customer.email.trim().toLowerCase();
    }

    // ✅ Parse delivery date safely
    const parsedDate = new Date(expectedDeliveryDate);
    if (isNaN(parsedDate.getTime())) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid delivery date" });
    }

    // ✅ Save Order
    const newOrder = new Order({
      customer,
      items,
      totalAmount,
      gst,
      delivery,
      expectedDeliveryDate: parsedDate,
      placedAt: new Date(),
    });

    const savedOrder = await newOrder.save();

    // ✅ Email setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const cropList = items
      .map((item) => `- ${item.name} x${item.quantity}`)
      .join("\n");

    // 📧 Email to Buyer
    await transporter.sendMail({
      from: '"AgroLink" <your@email>',
      to: customer.email,
      subject: "Your AgroLink Order is Confirmed!",
      text: `Hi ${customer.fullName},\n\nYour order has been confirmed and will be delivered by ${parsedDate.toDateString()}.\n\nOrder Details:\n${cropList}\n\nThank you for using AgroLink! 🌾`
    });

    // 📧 Email to Sellers (based on crop info)
    for (const item of items) {
      const crop = await Crop.findById(item.id);
      if (!crop || !crop.sellerEmail) continue;

      await transporter.sendMail({
        from: '"AgroLink" <your@email>',
        to: crop.sellerEmail,
        subject: "You have a new order on AgroLink!",
        text: `Dear Seller,\n\nYour crop "${crop.name}" has been ordered.\n\nOrder Details:\n- Quantity: ${item.quantity}\n\nDeliver to:\n${customer.fullName}\n${customer.address}, ${customer.city}, ${customer.state} - ${customer.pincode}\nPhone: ${customer.phone}\nExpected Delivery: ${parsedDate.toDateString()}`
      });
    }

    res.json({ success: true, orderId: savedOrder._id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Something went wrong." });
  }
});


app.get("/api/orders", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Email required" });

    const orders = await Order.find({ "customer.email": email }).sort({ placedAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ success: false, message: "Failed to load orders" });
  }
});

