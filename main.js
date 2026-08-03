const express = require('express');
const jwt = require('jsonwebtoken');
const connectDB = require('./src/config/db');
const app = express();
const cors = require('cors');
const startCronJobs = require('./cronWorker');
const authpageRoute = require('./src/routes/authpage');
const groupRoutes = require('./src/routes/creategroup');
const contributionRoutes = require('./src/routes/contribution');
const commissionRoutes = require('./src/routes/commission');
const receiptRoutes = require('./src/routes/receipt');
const payoutRoutes = require('./src/routes/payout');
const allowedOrigins = [
  'http://localhost:5173',
  'https://kolopocket.vercel.app'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());
app.use("/auth", authpageRoute);
app.use("/creategroup", groupRoutes);
app.use("/api/contributions", contributionRoutes);
app.use("/api/commissions", commissionRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/payouts", payoutRoutes);


app.get('/', (req, res) => {
  res.json('Welcome to kolo pocket where contribution saves lives!');
});

const PORT = process.env.PORT || 4000;

connectDB().then(() => {

  // 🚀 START THE BACKGROUND CRON ALARM RUNNER HERE:
  startCronJobs();
  console.log('🤖 Background Automation Scheduler is alive and listening!');

  const startupToken = jwt.sign(
    { source: 'server-startup', note: 'token visible on restart' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.EXPIRE_IN || '1h' }
  );

  // console.log('🔐 Startup JWT token:', startupToken);

  app.listen(PORT, () => {
    console.log(`🚀 Server is running smoothly on port ${PORT}`);
  });
}).catch((err) => {
  console.error('❌ Failed to connect to DB, server not started:', err);
  process.exit(1);
});


