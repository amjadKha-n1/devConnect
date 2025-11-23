const path = require("path");
const express = require("express");
const dotenv = require('dotenv').config();
const expressLayouts = require("express-ejs-layouts");

const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

const blogRoutes = require("./routes/blog");
const db = require("./data/database");
const app = express();

const store = new MongoDBStore({
  uri: process.env.MONGODB_URI,
  collection: "sessions",
});


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.set("layout", "layout");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.use(function (req, res, next) {
  res.locals.user = req.session ? req.session.user : null;
  next();
});

app.use(expressLayouts);
app.use(blogRoutes);

// db.connectToDatabase().then(function () {
//   app.listen(3000);
// });

db.connectToDatabase().then(function () {
  const port = process.env.PORT || 3000;
  app.listen(port, function () {
    console.log("Server running on port " + port);
  });
});
