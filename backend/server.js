require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

connectDB();

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', require('./routes/books'));
app.use('/api/borrows', require('./routes/borrows'));
app.use('/api/waiting', require('./routes/waiting'));
app.use('/api/inquiries', require('./routes/inquiries'));
app.use('/api/damages', require('./routes/damages'));
app.use('/api/ebooks', require('./routes/ebooks'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/recommendations', require('./routes/recommendations'));

app.get('/', (req, res) => res.json({ message: 'Smart Library API Running' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Auto-expire overdue waiting list claims every 15 minutes
  const WaitingList = require('./models/WaitingList');
  const { notifyNext } = require('./controllers/waitingController');
  setInterval(async () => {
    try {
      const overdue = await WaitingList.find({
        status: 'notified',
        claimDeadline: { $lt: new Date() },
      });
      for (const entry of overdue) {
        entry.status = 'expired';
        await entry.save();
        await notifyNext(entry.book);
        console.log(`[WaitingList] Expired entry ${entry._id}, notified next in queue`);
      }
    } catch (e) {
      console.error('[WaitingList cron] Error:', e.message);
    }
  }, 15 * 60 * 1000); // every 15 minutes
});
