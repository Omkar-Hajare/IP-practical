// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/libraryDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Book Schema
const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String, required: true, unique: true },
  available: { type: Boolean, default: true },
  borrowedBy: { type: String, default: null }
});

const Book = mongoose.model('Book', bookSchema);

// Routes

// User signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    const user = new User({ name, email, password });
    await user.save();
    res.status(201).json({ message: 'User created', user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// User login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ message: 'Login successful', user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all books
app.get('/api/books', async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a book
app.post('/api/books', async (req, res) => {
  try {
    const book = new Book(req.body);
    await book.save();
    res.status(201).json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update book
app.put('/api/books/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete book
app.delete('/api/books/:id', async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: 'Book deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Borrow book
app.post('/api/books/:id/borrow', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book.available) {
      return res.status(400).json({ error: 'Book not available' });
    }
    book.available = false;
    book.borrowedBy = req.body.borrower;
    await book.save();
    res.json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Return book
app.post('/api/books/:id/return', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    book.available = true;
    book.borrowedBy = null;
    await book.save();
    res.json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Seed sample data
const seedData = async () => {
  const count = await Book.countDocuments();
  if (count === 0) {
    const sampleBooks = [
      { title: 'The Lean Startup', author: 'Eric Ries', isbn: '978-0307887894', available: true },
      { title: 'Zero to One', author: 'Peter Thiel', isbn: '978-0804139298', available: false, borrowedBy: 'John Doe' },
      { title: 'The Innovators Dilemma', author: 'Clayton Christensen', isbn: '978-1633691780', available: true },
      { title: 'Thinking Fast and Slow', author: 'Daniel Kahneman', isbn: '978-0374533557', available: true },
      { title: 'The Black Swan', author: 'Nassim Taleb', isbn: '978-0812973815', available: false, borrowedBy: 'Jane Smith' },
      { title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '978-0062316097', available: true }
    ];
    await Book.insertMany(sampleBooks);
    console.log('Sample data seeded');
  }
};

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  seedData();
});