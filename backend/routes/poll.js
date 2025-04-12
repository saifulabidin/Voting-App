const express = require('express');
const Poll = require('../models/Poll');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { validate } = require('../middleware/validate');
const router = express.Router();

// Middleware to authenticate user
const protect = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Create Poll (Authenticated)
router.post('/', protect, validate('createPoll'), async (req, res) => {
  const { title, options } = req.body;

  try {
    const poll = new Poll({
      title,
      options: options.map(opt => ({ option: opt })),
      createdBy: req.user._id
    });

    const createdPoll = await poll.save();
    res.status(201).json(createdPoll);
  } catch (err) {
    console.error('Poll creation error:', err);
    res.status(500).json({ 
      message: 'Failed to create poll',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get all Polls (Authenticated/Unauthenticated)
router.get('/', async (req, res) => {
  try {
    const polls = await Poll.find().populate('createdBy', 'username');
    res.json(polls);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch polls' });
  }
});

// Update vote endpoint with transaction
router.post('/:pollId/vote', protect, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { pollId } = req.params;
    const { optionId } = req.body;

    const poll = await Poll.findOne({ 
      _id: pollId,
      voters: { $ne: req.user._id }
    }).session(session);

    if (!poll) {
      throw new Error('Poll not found or already voted');
    }

    const option = poll.options.id(optionId);
    if (!option) {
      throw new Error('Option not found');
    }

    option.votes += 1;
    poll.voters.push(req.user._id);
    
    await poll.save({ session });
    await session.commitTransaction();
    
    res.json(poll);
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ message: err.message });
  } finally {
    session.endSession();
  }
});

// ✅ Add new option to a poll (Authenticated)
router.post('/:pollId/options', protect, async (req, res) => {
  const { pollId } = req.params;
  const { newOption } = req.body;

  try {
    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });

    poll.options.push({ option: newOption });
    await poll.save();

    res.json(poll);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add new option' });
  }
});

// Delete Poll (Authenticated)
router.delete('/:pollId', protect, async (req, res) => {
  const { pollId } = req.params;
  try {
    const poll = await Poll.findById(pollId);
    if (!poll || poll.createdBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized or poll not found' });
    }

    await Poll.findByIdAndDelete(pollId);
    res.json({ message: 'Poll deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete poll' });
  }
});

module.exports = router;
