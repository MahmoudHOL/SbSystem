/**
 * إعدادات الجلسة
 */

const session = require('express-session');

function getSessionConfig() {
  return {
    secret: process.env.SESSION_SECRET || 'sb-pos-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 ساعة
      httpOnly: true,
    },
  };
}

module.exports = { getSessionConfig };
