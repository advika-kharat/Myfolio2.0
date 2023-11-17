const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;

const GOOGLE_CLIENT_ID = "6699294550-hhm3oni219g3m1llgv1kjhr2svtmkiuj.apps.googleusercontent.com"
const GOOGLE_CLIENT_SECRET = "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";

passport.use(new GoogleStrategy({
  clientID: "6699294550-hhm3oni219g3m1llgv1kjhr2svtmkiuj.apps.googleusercontent.com",
  clientSecret: "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",
  callbackURL: "http://localhost:3000/auth/google/callback",
  passReqToCallback: true,
},
function(request, accessToken, refreshToken, profile, done) {
  return done(null, profile);
}));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});