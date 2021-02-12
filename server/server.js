require("dotenv").config();
const path = require("path");
const http = require("http");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const ShareDB = require("sharedb");
const express = require("express");
const ShareDBMingoMemory = require("sharedb-mingo-memory");
const WebSocketJSONStream = require("@teamwork/websocket-json-stream");
const WebSocket = require("ws");
const PORT = process.env.PORT || "8080";

// comfifure passport
var passport = require("passport");
var GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;

console.log(process.env.GOOGLE_CLIENT_ID);
console.log(process.env.GOOGLE_CLIENT_SECRET);

// Use the GoogleStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Google
//   profile), and invoke a callback with a user object.
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.DOMAIN}:${PORT}/auth/google/callback`,
    },
    (accessToken, refreshToken, profile, done) => {
      console.log("accessToken", accessToken);
      const userData = {
        profile: profile,
        token: accessToken,
      };
      done(null, userData);
    }
  )
);

// Start ShareDB
const share = new ShareDB({ db: new ShareDBMingoMemory(), presence: true });

// Create a WebSocket server
const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan("combined"));
app.use(passport.initialize());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server: server });

// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile"],
  })
);

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get(
  "/auth/google/callback",
  passport.authenticate("google"),
  (req, res) => {
    const token = req.user.token;
    console.log("accessToken", token);
    //res.json("redirect");
    res.redirect("/");
  }
);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client", "build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client", "build", "index.html"));
  });
}

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

// Connect any incoming WebSocket connection with ShareDB
wss.on("connection", function (ws) {
  console.log("A client connected to the websocket");

  const stream = new WebSocketJSONStream(ws);
  share.listen(stream);
});

// Create initial documents
const notes = [
  {
    title: "Team Lunch",
    author: "Tony",
    date: "02/08/2021",
    text: "Get lunch with the Wargaming team at Panera Bread.",
  },
  {
    title: "Spend time with my dog",
    author: "Tony",
    date: "02/06/2021",
    text: "Take a walk in the evening with my dog Max at the beach.",
  },
  {
    title: "Note 3",
    author: "Tony",
    date: "02/05/2021",
    text: "Do my laundry",
  },
];
const connection = share.connect();
connection.createFetchQuery("notes", {}, {}, function (err, results) {
  if (err) {
    throw err;
  }

  if (results.length === 0) {
    notes.forEach(function (note, index) {
      const doc = connection.get("notes", `${index}`);
      doc.create(note);
    });
  }
});
