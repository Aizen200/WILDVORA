require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const User       = require('../models/User');
const Experience = require('../models/Experience');
const Booking    = require('../models/Booking');
const Review     = require('../models/Review');
const Payout     = require('../models/Payout');

// Emails created by the seed script — only listings owned by these accounts are removed.
const DEMO_EMAILS = [
  'operator@wildvora.com',
  'host2@wildvora.com',
];

async function run() {
  await mongoose.connect(process.env.mongo_uri);
  console.log('Connected to MongoDB');

  const demoOperators = await User.find({ email: { $in: DEMO_EMAILS } }, '_id');
  const demoOperatorIds = demoOperators.map(u => u._id);

  if (demoOperatorIds.length === 0) {
    console.log('No demo operator accounts found — nothing to delete.');
    await mongoose.disconnect();
    return;
  }

  // Find only experiences owned by demo operators
  const demoExperiences = await Experience.find({ host: { $in: demoOperatorIds } }, '_id');
  const demoExpIds = demoExperiences.map(e => e._id);

  if (demoExpIds.length === 0) {
    console.log('No demo experiences found — nothing to delete.');
    await mongoose.disconnect();
    return;
  }

  const [expResult, bookResult, revResult, payResult] = await Promise.all([
    Experience.deleteMany({ _id: { $in: demoExpIds } }),
    Booking.deleteMany({ experience: { $in: demoExpIds } }),
    Review.deleteMany({ experience: { $in: demoExpIds } }),
    Payout.deleteMany({ operator: { $in: demoOperatorIds } }),
  ]);

  console.log(`Deleted ${expResult.deletedCount} demo experiences`);
  console.log(`Deleted ${bookResult.deletedCount} demo bookings`);
  console.log(`Deleted ${revResult.deletedCount} demo reviews`);
  console.log(`Deleted ${payResult.deletedCount} demo payouts`);
  console.log('Done. Only demo data was cleared; real operator listings are untouched.');

  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
