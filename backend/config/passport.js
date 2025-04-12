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
          const email = profile.emails[0].value;
          
          // Coba cari user berdasarkan googleId atau email
          let user = await User.findOne({ 
            $or: [
              { googleId: profile.id },
              { username: email }
            ]
          });
          
          if (!user) {
            // Buat user baru jika tidak ditemukan
            user = new User({
              username: email,
              googleId: profile.id,
              // Password tidak diperlukan untuk login Google
              // tambahkan field lain yang mungkin berguna
              // displayName: profile.displayName,
              // firstName: profile.name.givenName,
              // lastName: profile.name.familyName
            });
            await user.save();
          } else if (!user.googleId) {
            // Update existing user dengan googleId jika belum ada
            user.googleId = profile.id;
            await user.save();
          }
          
          return done(null, user);
        } catch (err) {
          console.error('Google auth error:', err);
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
