const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Voting API',
    status: 'online',
    version: '1.0.0'
  });
});

module.exports = router;