const express = require("express");
const cors = require("cors");
const yahooFinance = require("yahoo-finance2");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

// Set up rate limiter
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute windowa
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after a minute",
});

const app = express();

app.use(cors());
app.use(limiter);

// Configure Yahoo Finance
// yahooFinance.setOptions({
//   modules: ["quote"],
//   range: "1d",
// });

// Generate a JWT token
function generateToken(username) {
  return jwt.sign({ username }, "secret_key", { expiresIn: "1h" });
}

// Verify a JWT token
function verifyToken(req, res, next) {
  const token = req.header("Authorization").replace("Bearer ", "");
  if (!token) return res.status(401).send("Access denied.");

  try {
    const decoded = jwt.verify(token, "secret_key");
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).send("Invalid token.");
  }
}

// Get stock quote
app.get("/quote/:symbol", verifyToken, async (req, res) => {
  const symbol = req.params.symbol;

  try {
    const quote = await yahooFinance.quote({ symbol });
    res.json(quote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Generate a new token
app.post("/token", (req, res) => {
  const username = req.body.username;
  const token = generateToken(username);
  res.json({ token });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
