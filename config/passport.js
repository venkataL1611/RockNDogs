const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
  try {
    const user = await User.findById(id).exec();
    done(null, user);
  } catch (err) {
    done(err);
  }
});

passport.use('local-signup', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, async function (req, email, password, done) {
  try {
    const existing = await User.findOne({ email: email.toLowerCase() }).exec();
    if (existing) {
      return done(null, false, { message: 'Email is already in use.' });
    }
    const user = new User();
    user.email = email.toLowerCase();
    user.name = req.body.name || '';
    user.password = user.encryptPassword(password);
    await user.save();
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.use('local-login', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, async function (req, email, password, done) {
  try {
    const user = await User.findOne({ email: email.toLowerCase() }).exec();
    if (!user) {
      return done(null, false, { message: 'Invalid email or password.' });
    }
    if (!user.validPassword(password)) {
      return done(null, false, { message: 'Invalid email or password.' });
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

module.exports = passport;
