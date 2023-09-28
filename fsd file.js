const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost/node-express-auth', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Set up session middleware
app.use(session({ secret: 'your-secret-key', resave: false, saveUninitialized: false }));

// Initialize Passport and session
app.use(passport.initialize());
app.use(passport.session());

// Define User model
const User = mongoose.model('User', {
  username: String,
  password: String,
});

// Configure Passport Local Strategy for authentication
passport.use(
  new LocalStrategy((username, password, done) => {
    User.findOne({ username: username }, (err, user) => {
      if (err) return done(err);
      if (!user) return done(null, false, { message: 'Incorrect username.' });
      if (!bcrypt.compareSync(password, user.password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

// Set up middleware to handle form submissions
app.use(express.urlencoded({ extended: false }));

// Serve static files (e.g., CSS)
app.use(express.static('public'));

// Define routes for signup, login, and dashboard
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

app.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
  })
);

app.get('/dashboard', isAuthenticated, (req, res) => {
  res.sendFile(__dirname + '/public/dashboard.html');
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

// Start the server
app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});