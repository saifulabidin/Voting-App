const express = require('express');
const Poll = require('../models/Poll');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { validate } = require('../middleware/validate');
const router = express.Router();

// Middleware to authenticate user
const protect = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No auth token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ 
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Create Poll route with updated error handling
router.post('/', protect, validate('createPoll'), async (req, res, next) => {
  try {
    const { title, options } = req.body;

    const validOptions = options
      .filter(opt => opt && opt.option?.trim())
      .map(opt => ({
        option: opt.option.trim(),
        votes: 0
      }));

    const poll = new Poll({
      title: title.trim(),
      options: validOptions,
      createdBy: req.user._id // This should now be available
    });

    const createdPoll = await poll.save();
    await createdPoll.populate('createdBy', 'username');
    
    res.status(201).json(createdPoll);
  } catch (err) {
    next(err);
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

// Get Poll by ID
router.get('/:id', async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('voters', 'username');
      
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }
    
    res.json(poll);
  } catch (err) {
    console.error('Error fetching poll:', err);
    // Check if error is due to invalid ObjectId
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid poll ID' });
    }
    res.status(500).json({ 
      message: 'Error fetching poll',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Update vote endpoint with better error messages
router.post('/:pollId/vote', protect, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { pollId } = req.params;
    const { optionId } = req.body;

    // Check if user has already voted
    const existingPoll = await Poll.findOne({
      _id: pollId,
      voters: req.user._id
    });

    if (existingPoll) {
      return res.status(400).json({ 
        message: 'Anda hanya dapat memberikan satu suara untuk setiap polling',
        code: 'DUPLICATE_VOTE'
      });
    }

    const poll = await Poll.findById(pollId).session(session);
    
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    const option = poll.options.id(optionId);
    if (!option) {
      return res.status(400).json({ message: 'Invalid option selected' });
    }

    option.votes += 1;
    poll.voters.push(req.user._id);
        
    await poll.save({ session });
    await session.commitTransaction();
    
    // Return updated poll with user info
    const updatedPoll = await Poll.findById(pollId)
      .populate('createdBy', 'username')
      .populate('voters', 'username');
      
    res.json(updatedPoll);
  } catch (err) {
    await session.abortTransaction();
    console.error('Voting error:', err);
    res.status(400).json({ 
      message: 'Gagal mengirim vote. Silakan coba lagi.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } finally {
    session.endSession();
  }
});

// Add new option to poll
router.post('/:pollId/options', protect, async (req, res) => {
  const { pollId } = req.params;
  const { option } = req.body;

  if (!option?.trim()) {
    return res.status(400).json({ message: 'Option text is required' });
  }

  try {
    const poll = await Poll.findById(pollId);
    
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    // Check if option already exists (case insensitive)
    const optionExists = poll.options.some(opt => 
      opt.option.toLowerCase() === option.trim().toLowerCase()
    );

    if (optionExists) {
      return res.status(400).json({ message: 'This option already exists' });
    }

    // Add new option
    poll.options.push({
      option: option.trim(),
      votes: 0
    });

    await poll.save();
    
    // Return updated poll with populated fields
    const updatedPoll = await Poll.findById(pollId)
      .populate('createdBy', 'username')
      .populate('voters', 'username');
      
    res.json(updatedPoll);
  } catch (err) {
    console.error('Add option error:', err);
    res.status(500).json({ 
      message: 'Failed to add new option',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Delete Poll (Authenticated)
router.delete('/:pollId', protect, async (req, res) => {
  const { pollId } = req.params;
  
  try {
    const poll = await Poll.findById(pollId);
    
    if (!poll) {
      return res.status(404).json({ 
        message: 'Polling tidak ditemukan' 
      });
    }

    // Check if user is the creator of the poll
    if (poll.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Anda tidak memiliki izin untuk menghapus polling ini' 
      });
    }

    await Poll.findByIdAndDelete(pollId);
    
    res.json({ 
      message: 'Polling berhasil dihapus',
      pollId 
    });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ 
      message: 'Gagal menghapus polling',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;
