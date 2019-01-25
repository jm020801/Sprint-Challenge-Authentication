const axios = require('axios');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../database/dbConfig");

const { authenticate } = require('../auth/authenticate');

module.exports = server => {
  server.post('/api/register', register);
  server.post('/api/login', login);
  server.get('/api/jokes', authenticate, getJokes);
};

function generateToken(payload) {
  return jwt.sign(
    payload, process.env.SECRET || "randomString", 
    {
      expiresIn: "1hr"
    }
  )
}


function register(req, res) {
  // implement user registration
  let { username, password } = req.body;

  if (!username || !password)
    return res.json({
      error: true,
      message: "You need BOTH a username and password."
    });

  password = bcrypt.hashSync(password, 3);

  db("users")
    .insert({ username, password })
    .then(([id]) => {
      let token = generateToken({ id });
      res.json({
        error: false,
        message: "User Created Successfully",
        token
      });
    })
    .catch(err => res.json(err));
}


function login(req, res) {
  // implement user login
  let { username, password } = req.body;

  if (!username || !password)
    return res.json({
      error: true,
      message: "You need BOTH a username and a password."
    });

  db("users")
    .where({ username: username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(password, user.password)) {
        let token = generateToken(user);
        res.json({
          error: false,
          message: `Welcome ${username}`,
          token
        });
      } else {
        return register.json({
          error: true,
          message: "Login credentials not working."
        });
      }
    })
    .catch(err => res.json(err));
}
function getJokes(req, res) {
  const requestOptions = {
    headers: { accept: 'application/json' },
  };

  axios
    .get('https://icanhazdadjoke.com/search', requestOptions)
    .then(response => {
      res.status(200).json(response.data.results);
    })
    .catch(err => {
      res.status(500).json({ message: 'Error Fetching Jokes', error: err });
    });
}
