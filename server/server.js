const path = require("path");
const http = require("http");
const ShareDB = require("sharedb");
const express = require("express");
const ShareDBMingoMemory = require("sharedb-mingo-memory");
const WebSocketJSONStream = require("@teamwork/websocket-json-stream");
const WebSocket = require("ws");
//const PORT = process.env.PORT || "8080";
const PORT = "80";

// Start ShareDB
const share = new ShareDB({ db: new ShareDBMingoMemory(), presence: true });

// Create a WebSocket server
const app = express();
app.use(express.static("static"));
const server = http.createServer(app);
const wss = new WebSocket.Server({ server: server });

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client", "build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client", "build", "index.html"));
  });
}

server.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
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
    date: "02/04/2021",
    text: "Get lunch with the Wargaming team at Panera Bread.",
  },
  {
    title: "Spend time with my dog",
    author: "Tony",
    date: "02/05/2021",
    text: "Take a walk in the evening with my dog Max.",
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
