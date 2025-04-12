const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

module.exports = function(passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'username' }, async (username, password, done) => {
      try {
        const user = await User.findOne({ username });
        if (!user) {
          return done(null, false, { message: 'Username not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect password' });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: 'https://voting-app-production-3a8c.up.railway.app/auth/google/callback',
        proxy: true
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });
          
          if (!user) {
            // Cek jika email sudah terdaftar
            user = await User.findOne({ username: profile.emails[0].value });
            
            if (user) {
              // Update existing user dengan Google ID
              user.googleId = profile.id;
              await user.save();
            } else {
              // Buat user baru
              user = new User({
                googleId: profile.id,
                username: profile.emails[0].value,
                // Tidak perlu password untuk user Google
              });
              await user.save();
            }
          }
          
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};
