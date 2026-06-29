const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded media files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/upload', require('./routes/upload.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/experiences', require('./routes/experience.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/messages', require('./routes/message.routes'));
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/operator', require('./routes/operator.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/ai', require('./routes/ai.routes'));
app.use('/api/inquiries', require('./routes/inquiry.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Wildvora API is running' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server error' });
});

// Connect to MongoDB and start server
mongoose
  .connect(process.env.mongo_uri)
  .then(async () => {
    console.log('MongoDB connected');
    
    // Seed destinations if empty
    try {
      const Destination = require('./models/Destination');
      const count = await Destination.countDocuments();
      if (count === 0) {
        console.log('Seeding initial destinations...');
        await Destination.create([
          {
            title: 'Spiti Valley',
            state: 'Himachal Pradesh',
            region: 'Northern Himalayas',
            coverImage: 'http://localhost:3000/uploads/spiti_valley.png',
            status: 'Weather Alert',
            bestSeason: 'June - September',
            roadStatus: 'Kunzum Pass Closed',
            permitRequirements: 'Inner Line Permit (ILP) required for foreign nationals near Tabo & Khab.',
            emergencyContact: 'Kaza District Hospital: +91 1906 222218'
          },
          {
            title: 'Munnar',
            state: 'Kerala',
            region: 'Western Ghats',
            coverImage: 'http://localhost:3000/uploads/munnar_hills.png',
            status: 'Peak Season',
            bestSeason: 'September - March',
            roadStatus: 'All Routes Open',
            permitRequirements: 'Eravikulam National Park passes required; online booking mandatory.',
            emergencyContact: 'Adimali Govt Hospital: +91 4864 222111'
          },
          {
            title: 'Coorg',
            state: 'Karnataka',
            region: 'Western Ghats',
            coverImage: '',
            status: 'Moderate Rain',
            bestSeason: 'October - March',
            roadStatus: 'All Routes Open',
            permitRequirements: 'No special permits required.',
            emergencyContact: 'Madikeri District Hospital: +91 8272 222211'
          },
          {
            title: 'Leh Ladakh',
            state: 'Ladakh',
            region: 'Trans-Himalayas',
            coverImage: '',
            status: 'Heavy Snow',
            bestSeason: 'June - September',
            roadStatus: 'Khardung La Closed',
            permitRequirements: 'Protected Area Permit (PAP) required for foreign nationals.',
            emergencyContact: 'SNM Hospital Leh: +91 1982 252014'
          }
        ]);
        console.log('Destinations seeded successfully!');
      }
    } catch (e) {
      console.error('Seeding destinations failed:', e);
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

