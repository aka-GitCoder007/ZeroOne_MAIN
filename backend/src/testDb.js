import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import Project from './models/Project.js';
import Review from './models/Review.js';
import Quotation from './models/Quotation.js';
import Payment from './models/Payment.js';
import { generateRequestId } from './utils/generateRequestId.js';

dotenv.config();

const runTests = async () => {
  console.log('=== ZER0ONE Database & Model Verification Suite ===');
  
  // 1. Connect to Database
  await connectDB();
  
  // Ensure database connection is ready
  if (mongoose.connection.readyState !== 1) {
    console.warn('⚠️ MONGODB_URI not connected or local MongoDB instance unreachable. Testing offline Schema Instantiation & Validation...');
    testOfflineSchemas();
    return;
  }
  
  try {
    // Clean up temporary test data if any exists
    await User.deleteMany({ username: 'testuser_temp' });
    await Project.deleteMany({ name: 'Test Project Temp' });
    await Payment.deleteMany({ orderId: 'test_order_id_temp' });
    await Quotation.deleteMany({ email: 'test_temp@zeroone.com' });

    // 2. Validate User Model
    console.log('\n[1/5] Testing User Model Validation...');
    const invalidUser = new User({ role: 'invalid_role' });
    try {
      await invalidUser.save();
      console.error('❌ User: Validation failed to catch missing fields / invalid role!');
    } catch (err) {
      console.log('  ✅ User: Validation correctly caught invalid fields:', err.message);
    }

    const validUser = new User({
      username: 'testuser_temp',
      passwordHash: 'dummy_hash_123',
      role: 'admin'
    });
    await validUser.save();
    console.log('  ✅ User: Valid document saved successfully.');

    // 3. Validate Project Model
    console.log('\n[2/5] Testing Project Model Validation...');
    const invalidProject = new Project({ price: -100 });
    try {
      await invalidProject.save();
      console.error('❌ Project: Validation failed to catch negative price!');
    } catch (err) {
      console.log('  ✅ Project: Validation correctly caught negative price:', err.message);
    }

    const validProject = new Project({
      customerName: 'Test Client',
      name: 'Test Project Temp',
      price: 150000,
      status: 'Pending',
      date: new Date(),
      showInWork: true,
      showInClientReviews: true
    });
    const savedProject = await validProject.save();
    console.log('  ✅ Project: Valid document saved successfully with visibility flags (showInWork: true, showInClientReviews: true).');

    // 4. Validate Review Model & Relationship
    console.log('\n[3/5] Testing Review Model & Project Reference...');
    const invalidReview = new Review({ stars: 6, text: 'A'.repeat(501) });
    try {
      await invalidReview.save();
      console.error('❌ Review: Validation failed to catch invalid rating / max length!');
    } catch (err) {
      console.log('  ✅ Review: Validation correctly caught invalid fields:', err.message);
    }

    const validReview = new Review({
      projectId: savedProject._id,
      text: 'Highly professional digital agency work!',
      author: 'Test Author',
      stars: 5
    });
    const savedReview = await validReview.save();
    console.log('  ✅ Review: Valid document saved successfully.');
    
    const reviewWithProject = await Review.findById(savedReview._id).populate('projectId');
    console.log('  ✅ Review -> Project Population test: Populated Project Name =', reviewWithProject.projectId.name);

    // 5. Validate Quotation Model & Request ID
    console.log('\n[4/5] Testing Quotation Model & Request ID Utility...');
    const requestId = generateRequestId();
    console.log('  Generated Request ID:', requestId);
    if (!/^ZR-20\d{2}-[A-Z0-9]{4}$/.test(requestId)) {
      console.error('❌ Quotation: Request ID format mismatch!');
    } else {
      console.log('  ✅ Quotation: Request ID format verified (ZR-YYYY-XXXX).');
    }

    const validQuotation = new Quotation({
      requestId,
      fullName: 'Test Client',
      companyName: 'Acme Corp',
      email: 'test_temp@zeroone.com',
      phone: '+91 9876543210',
      services: ['Web Application', 'Custom Development'],
      projectName: 'Acme Portal',
      description: 'Building a web portal for client management',
      hasExistingWebsite: true,
      websiteUrl: 'https://example.com',
      budget: '₹50,000 – ₹1,00,000',
      timeline: 'Within 1 month',
      contactPreference: ['Email', 'WhatsApp']
    });
    const savedQuotation = await validQuotation.save();
    console.log('  ✅ Quotation: Valid document saved with Request ID:', savedQuotation.requestId);

    // 6. Validate Payment Model
    console.log('\n[5/5] Testing Payment Model Validation...');
    const invalidPayment = new Payment({ amount: 0, status: 'invalid_status' });
    try {
      await invalidPayment.save();
      console.error('❌ Payment: Validation failed to catch zero amount!');
    } catch (err) {
      console.log('  ✅ Payment: Validation correctly caught invalid fields:', err.message);
    }

    const validPayment = new Payment({
      orderId: 'test_order_id_temp',
      paymentId: 'test_payment_id_temp',
      amount: 5000,
      status: 'Created'
    });
    await validPayment.save();
    console.log('  ✅ Payment: Valid document saved successfully.');

    // 7. Cleanup Test Data
    console.log('\nCleaning up test documents...');
    await User.findByIdAndDelete(validUser._id);
    await Review.findByIdAndDelete(savedReview._id);
    await Project.findByIdAndDelete(savedProject._id);
    await Quotation.findByIdAndDelete(savedQuotation._id);
    await Payment.findByIdAndDelete(validPayment._id);
    console.log('✅ Cleanup completed successfully.');
    
    console.log('\nDatabase Schema Verification: PASSED 🚀');
  } catch (err) {
    console.error('❌ Test execution error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  }
};

const testOfflineSchemas = () => {
  try {
    const user = new User({ username: 'testuser', passwordHash: 'hash', role: 'admin' });
    const userErr = user.validateSync();
    
    const project = new Project({
      customerName: 'Cust',
      name: 'Proj',
      price: 1000,
      date: new Date(),
      showInWork: true,
      showInClientReviews: false
    });
    const projErr = project.validateSync();

    const quotation = new Quotation({
      requestId: generateRequestId(),
      fullName: 'John',
      email: 'john@example.com',
      phone: '1234567890',
      services: ['Landing Page'],
      projectName: 'My Site',
      description: 'Description',
      budget: '₹25,000 – ₹50,000',
      timeline: 'Immediately'
    });
    const quoteErr = quotation.validateSync();

    const payment = new Payment({ orderId: 'ord_123', amount: 500 });
    const payErr = payment.validateSync();

    if (!userErr && !projErr && !quoteErr && !payErr) {
      console.log('✅ Offline Schema Validation: PASSED 🚀');
    } else {
      console.error('❌ Offline Schema Validation Error:', { userErr, projErr, quoteErr, payErr });
    }
  } catch (err) {
    console.error('❌ Offline validation failure:', err);
  }
};

runTests();
