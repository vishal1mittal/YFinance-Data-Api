const express = require("express");
const cors = require("cors");
const yahooFinance = require("yahoo-finance2").default;
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Set up rate limiter
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute windowa
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after a minute",
});

const app = express();

app.use(cors());
app.use(limiter);

// Generate a Json Web Token(JWT) token
function generateToken(username) {
  return jwt.sign({ username }, process.env.JWT_Token_SECRET_KEY, {
    expiresIn: "365d",
  });
}

// Verify a JWT token
function verifyToken(req, res, next) {
  const token = req.header("Authorization").replace("Bearer ", "");
  if (!token) return res.status(401).send("Access denied.");

  try {
    const decoded = jwt.verify(token, process.env.JWT_Token_SECRET_KEY);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).send("Invalid token.");
  }
}

// Get historical stock data
app.get("/quote/:symbol", verifyToken, async (req, res) => {
  const symbol = req.params.symbol;
  const from = new Date(req.query.from);
  const to = new Date(req.query.to);
  const interval = req.query.interval;
  const queryOptions = { period1: from, period2: to, interval: interval };

  try {
    const data = await yahooFinance.historical(symbol, queryOptions);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Generate a new token
app.post("/generatetoken", (req, res) => {
  const username = req.query.username;
  if (
    typeof username !== "string" ||
    username === undefined ||
    username === null ||
    username.length < 3
  ) {
    return res
      .status(400)
      .json({ message: "Username must be at least 3 characters long." });
  }
  const token = generateToken(username);
  res.json({ token });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
