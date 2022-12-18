module.exports = {
  port: process.env.PORT || 8080,
  db: {
    prod:
      process.env.DATABASE_URL ||
      'mongodb+srv://huytu:iJ42tE2H7ztwRMgY@cluster0.do918lu.mongodb.net/?retryWrites=true&w=majority',
    test: 'mongodb://localhost/stackoverflow-test',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true
    }
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'development_secret',
    expiry: '7d'
  }
};
