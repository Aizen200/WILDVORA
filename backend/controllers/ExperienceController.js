const Experience = require('../models/Experience');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Payout = require('../models/Payout');

// @route GET /api/experiences
const getExperiences = async (req, res) => {
  try {
    const { category, difficulty, minPrice, maxPrice, duration, search, featured, trending, limit = 20, page = 1 } = req.query;

    const query = { isActive: true, status: 'live' };

    if (category && category !== 'All') query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (duration) {
      if (duration === '1 day') query.duration = '1 day';
      else if (duration === '2-3 days') query.duration = { $in: ['2 days', '3 days', '2-3 days'] };
      else if (duration === '1 week+') query.duration = { $regex: /week|7|8|9|10|14/, $options: 'i' };
    }
    if (featured === 'true') query.isFeatured = true;
    if (trending === 'true') query.isTrending = true;
    if (search) query.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Experience.countDocuments(query);
    const experiences = await Experience.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 });

    res.json({ success: true, total, count: experiences.length, experiences });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/experiences/:id
const getExperience = async (req, res) => {
  try {
    const experience = await Experience.findById(req.params.id);
    if (!experience) return res.status(404).json({ success: false, message: 'Experience not found' });
    res.json({ success: true, experience });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route POST /api/experiences  (admin/operator use — seed data)
const createExperience = async (req, res) => {
  try {
    const experience = await Experience.create(req.body);
    res.status(201).json({ success: true, experience });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route POST /api/experiences/seed/demo  — populates demo data
const seedExperiences = async (req, res) => {
  try {
    // 1. Clean up existing data
    await User.deleteMany({});
    await Experience.deleteMany({});
    await Booking.deleteMany({});
    await Review.deleteMany({});
    await Payout.deleteMany({});

    // 2. Create Users
    const customerUser = await User.create({
      name: 'Rahul Customer',
      email: 'customer@wildvora.com',
      password: 'password',
      phone: '9876543210',
      role: 'customer',
      isActive: true,
    });

    const guestUser = await User.create({
      name: 'Pooja Guest',
      email: 'guest@wildvora.com',
      password: 'password',
      phone: '9876543211',
      role: 'customer',
      isActive: true,
    });

    const operatorUser = await User.create({
      name: 'Amit Operator',
      email: 'operator@wildvora.com',
      password: 'password',
      phone: '9988776655',
      role: 'operator',
      kyc: 'approved',
      payoutStatus: 'verified',
      isActive: true,
      bankAccount: {
        holderName: 'Amit Kumar',
        accountNumber: '501004392810',
        bankName: 'HDFC Bank',
        ifscCode: 'HDFC0000124',
      },
    });

    const pendingOperatorUser = await User.create({
      name: 'Sumit Host',
      email: 'host2@wildvora.com',
      password: 'password',
      phone: '9988776644',
      role: 'operator',
      kyc: 'pending',
      payoutStatus: 'pending',
      isActive: true,
    });

    const adminUser = await User.create({
      name: 'Aditya Admin',
      email: 'admin@wildvora.com',
      password: 'password',
      phone: '9000000000',
      role: 'admin',
      isActive: true,
    });

    // 3. Seed Experiences (All associated to Amit Operator)
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const demos = [
      {
        title: 'Glacier Peak Expedition',
        description: 'Embark on a soul-stirring journey into the heart of the Cascades. This 7-day expedition is an immersion into the wild silence of high altitudes. We begin our ascent through ancient evergreen forests, emerging onto sub-alpine meadows before reaching our private basecamp.',
        category: 'Trekking',
        location: { city: 'Cascades', country: 'USA' },
        images: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'],
        price: 240,
        duration: '7 days',
        difficulty: 'Hard',
        maxGroupSize: 12,
        includes: ['All meals', 'Gear', 'Guide'],
        host: operatorUser._id,
        hostName: operatorUser.name,
        hostVerified: true,
        rating: 4.9,
        reviewCount: 1,
        isFeatured: true,
        isTrending: true,
        status: 'live',
        availableDates: [todayStr, tomorrowStr, nextWeekStr],
      },
      {
        title: 'Sunrise Peak Trek & Camping',
        description: 'A beautiful 2-day trek through pine forests and alpine meadows with overnight camping at 3,200m. Witness a stunning sunrise above the clouds on day 2.',
        category: 'Camping',
        location: { city: 'Cascades', country: 'USA' },
        images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80'],
        price: 120,
        duration: '2 days',
        difficulty: 'Moderate',
        maxGroupSize: 8,
        includes: ['Camping gear', 'Breakfast', 'Guide'],
        host: operatorUser._id,
        hostName: operatorUser.name,
        hostVerified: true,
        rating: 4.0,
        reviewCount: 1,
        isFeatured: true,
        isTrending: false,
        status: 'live',
        availableDates: [todayStr, tomorrowStr],
      },
      {
        title: 'Amazon Rainforest Survival',
        description: 'Three days deep in the Amazon learning survival skills, indigenous culture, and jungle navigation with expert local guides.',
        category: 'Jungle',
        location: { city: 'Manaus', country: 'Brazil' },
        images: ['https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=800&q=80'],
        price: 380,
        duration: '3 days',
        difficulty: 'Hard',
        maxGroupSize: 6,
        includes: ['All meals', 'Accommodation', 'Guide', 'Equipment'],
        host: operatorUser._id,
        hostName: operatorUser.name,
        hostVerified: true,
        rating: 0,
        reviewCount: 0,
        isFeatured: false,
        isTrending: true,
        status: 'live',
        availableDates: [tomorrowStr],
      },
      {
        title: 'Iceland Blue Kayaking',
        description: 'Paddle through icy glacial waters and sea caves along Iceland\'s dramatic coastline. Suitable for beginners with full instruction provided.',
        category: 'Water Sports',
        location: { city: 'Reykjavik', country: 'Iceland' },
        images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
        price: 450,
        duration: '1 day',
        difficulty: 'Easy',
        maxGroupSize: 10,
        includes: ['Kayak', 'Wetsuit', 'Instructor', 'Lunch'],
        host: operatorUser._id,
        hostName: operatorUser.name,
        hostVerified: true,
        rating: 0,
        reviewCount: 0,
        isFeatured: false,
        isTrending: false,
        status: 'pending', // Pending approval to populate admin queue
        availableDates: [todayStr],
      },
    ];

    const createdExperiences = await Experience.insertMany(demos);

    // 4. Seed Bookings
    const exp1 = createdExperiences[0]; // Glacier Peak ($240)
    const exp2 = createdExperiences[1]; // Sunrise Peak ($120)

    // Booking 1: Completed, Paid, Settled (payout released)
    const startOfPast = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const pastStr = startOfPast.toISOString().split('T')[0];
    const bookingCompleted = await Booking.create({
      user: customerUser._id,
      experience: exp1._id,
      startDate: pastStr,
      endDate: pastStr,
      adults: 1,
      children: 0,
      totalPrice: 240,
      status: 'completed',
      paymentMethod: 'card',
      paymentStatus: 'paid',
      settled: true,
    });

    // Booking 2: Confirmed, Paid, Unsettled (Active/Upcoming)
    const bookingConfirmed = await Booking.create({
      user: customerUser._id,
      experience: exp1._id,
      startDate: todayStr,
      endDate: todayStr,
      adults: 2,
      children: 0,
      totalPrice: 480,
      status: 'confirmed',
      paymentMethod: 'card',
      paymentStatus: 'paid',
      settled: false,
    });

    // Booking 3: Confirmed, Paid, Disputed, Unsettled
    const bookingDisputed = await Booking.create({
      user: guestUser._id,
      experience: exp2._id,
      startDate: tomorrowStr,
      endDate: tomorrowStr,
      adults: 1,
      children: 0,
      totalPrice: 120,
      status: 'confirmed',
      paymentMethod: 'card',
      paymentStatus: 'paid',
      settled: false,
      disputed: true,
      disputeReason: 'Host refused to include safety helmets.',
    });

    // Booking 4: Cancelled, Refunded
    const bookingCancelled = await Booking.create({
      user: customerUser._id,
      experience: exp2._id,
      startDate: nextWeekStr,
      endDate: nextWeekStr,
      adults: 1,
      children: 0,
      totalPrice: 120,
      status: 'cancelled',
      paymentMethod: 'apple_pay',
      paymentStatus: 'refunded',
      refundStatus: 'approved',
      settled: false,
    });

    // Booking 5: Pending, Unpaid
    const bookingPending = await Booking.create({
      user: customerUser._id,
      experience: exp1._id,
      startDate: nextWeekStr,
      endDate: nextWeekStr,
      adults: 1,
      children: 0,
      totalPrice: 240,
      status: 'pending',
      paymentMethod: 'card',
      paymentStatus: 'pending',
      settled: false,
    });

    // 5. Seed Reviews
    const review1 = await Review.create({
      user: customerUser._id,
      experience: exp1._id,
      booking: bookingCompleted._id,
      rating: 5,
      comment: 'Superb glacier expedition! The host Amit was highly professional and knowledgable.',
      userName: customerUser.name,
      hostReply: 'Thank you Rahul! It was a pleasure hosting you. Hope to see you again soon.',
    });

    const review2 = await Review.create({
      user: customerUser._id,
      experience: exp2._id,
      rating: 4,
      comment: 'Beautiful campsite view, but it got freezing at night. Make sure to carry heavy jackets.',
      userName: customerUser.name,
    });

    // 6. Seed Payouts
    const payout1 = await Payout.create({
      operator: operatorUser._id,
      booking: bookingCompleted._id,
      amount: 240,
      status: 'processed',
      transactionId: 'TXN-DEMO58392019',
      releasedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
    });

    res.json({
      success: true,
      message: 'Demo database seeded successfully with linked customers, hosts, admins, experiences, bookings, reviews, and payouts.',
      seededAccounts: {
        customer: { email: 'customer@wildvora.com', password: 'password' },
        operator: { email: 'operator@wildvora.com', password: 'password' },
        admin: { email: 'admin@wildvora.com', password: 'password' }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getExperiences, getExperience, createExperience, seedExperiences };