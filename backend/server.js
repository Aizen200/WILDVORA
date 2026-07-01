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

    // Seed guides if empty
    try {
      const Guide = require('./models/Guide');
      const count = await Guide.countDocuments();
      if (count === 0) {
        console.log('Seeding initial guides...');
        await Guide.create([
          { name: 'Arjun Sharma', languages: ['Hindi', 'English'], specialty: 'Alpine Trekking', rating: 4.9, activeTrips: 1, avatar: 'AS' },
          { name: 'Priya Patel', languages: ['English', 'Gujarati'], specialty: 'Desert & Safari', rating: 4.8, activeTrips: 2, avatar: 'PP' },
          { name: 'Vikram Singh', languages: ['Hindi', 'English', 'Punjabi'], specialty: 'Rock Climbing', rating: 5.0, activeTrips: 0, avatar: 'VS' },
          { name: 'Rahul Verma', languages: ['Hindi', 'English'], specialty: 'Camping & Wildlife', rating: 4.7, activeTrips: 1, avatar: 'RV' },
        ]);
        console.log('Guides seeded successfully!');
      }
    } catch (e) {
      console.error('Seeding guides failed:', e);
    }

    // Seed local marketplace services if empty
    try {
      const LocalService = require('./models/LocalService');
      const serviceCount = await LocalService.countDocuments();
      if (serviceCount === 0) {
        console.log('Seeding initial marketplace local services...');
        await LocalService.create([
          {
            name: 'Amit (IMF Certified Alpine Guide)',
            type: 'guide',
            contact: '+91 94180 88776',
            description: 'Specializes in high-altitude glacier routes, certified by Indian Mountaineering Foundation.',
            location: 'Manali',
            price: 2000,
            priceUnit: 'day',
            rating: 4.9,
            reviewsCount: 18
          },
          {
            name: 'Spiti Homestay Association',
            type: 'homestay',
            contact: '+91 94188 11223',
            description: 'Authentic local mud-house homestay network including hot Spitian meals.',
            location: 'Kaza',
            price: 1200,
            priceUnit: 'day',
            rating: 4.8,
            reviewsCount: 22
          },
          {
            name: 'Solang Valley Jeep Transport',
            type: 'transport',
            contact: '+91 98160 12345',
            description: '4x4 Gypsy & camper hire with local drivers experienced in crossing water crossings & snow passes.',
            location: 'Manali',
            price: 2500,
            priceUnit: 'trip',
            rating: 4.7,
            reviewsCount: 14
          },
          {
            name: 'Himalayan Adventure Gear Rentals',
            type: 'rental',
            contact: '+91 98161 54321',
            description: 'High quality double-layered Quechua tents, sleeping bags (-10C rated), hiking poles, and snow boots.',
            location: 'Manali',
            price: 300,
            priceUnit: 'day',
            rating: 4.6,
            reviewsCount: 31
          },
          {
            name: 'Rohan - Outdoor Photographer & Reel Creator',
            type: 'photographer',
            contact: '+91 98055 99887',
            description: 'Professional trek photographer and video maker. Shoots on Sony Alpha & DJI Mavic Mini.',
            location: 'Manali',
            price: 1500,
            priceUnit: 'day',
            rating: 4.9,
            reviewsCount: 9
          },
          {
            name: 'Chandra Homestay & Cafe',
            type: 'cafe',
            contact: '+91 98166 22334',
            description: 'Authentic wooden structure cafe serving locally sourced sea buckthorn tea and Himachali Siddu.',
            location: 'Keylong',
            price: 500,
            priceUnit: 'day',
            rating: 4.5,
            reviewsCount: 11
          }
        ]);
        console.log('Local marketplace services seeded successfully!');
      }
    } catch (e) {
      console.error('Seeding local services failed:', e);
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

