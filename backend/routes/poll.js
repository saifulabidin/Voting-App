const express = require('express');
const Poll = require('../models/Poll');
const Analytics = require('../models/Analytics');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { validate } = require('../middleware/validate');
const router = express.Router();

// Middleware to authenticate user if token exists
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      req.user = null;
      return next();
    }

    req.user = user;
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};

// Middleware to require authentication
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

// Protected routes - require authentication
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

// Add option with analytics tracking
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
    
    // Track option add
    await Analytics.trackEvent(pollId, 'optionAdd');
    
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

// Public routes - optional authentication
// Modified get polls route with pagination and search
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    // Create search query
    const searchQuery = search 
      ? { title: { $regex: search, $options: 'i' } }
      : {};

    const totalPolls = await Poll.countDocuments(searchQuery);
    const polls = await Poll.find(searchQuery)
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      polls,
      currentPage: page,
      totalPages: Math.ceil(totalPolls / limit),
      totalPolls
    });
  } catch (err) {
    console.error('Fetch polls error:', err);
    res.status(500).json({ message: 'Failed to fetch polls' });
  }
});

// Get single poll with analytics tracking
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('voters', 'username');
      
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    // Track view
    await Analytics.trackEvent(poll._id, 'view');
    
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

// Modified vote endpoint to support anonymous voting with analytics tracking
router.post('/:pollId/vote', optionalAuth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { pollId } = req.params;
    const { optionId } = req.body;

    // If user is authenticated, check if they've already voted
    if (req.user) {
      const existingPoll = await Poll.findOne({
        _id: pollId,
        voters: req.user._id
      });

      if (existingPoll) {
        return res.status(400).json({ 
          message: 'You can only vote once per poll',
          code: 'DUPLICATE_VOTE'
        });
      }
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
    
    // Only add to voters list if user is authenticated
    if (req.user) {
      poll.voters.push(req.user._id);
    }
        
    await poll.save({ session });
    
    // Track vote
    await Analytics.trackEvent(pollId, 'vote');
    
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
      message: 'Failed to submit vote. Please try again.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } finally {
    session.endSession();
  }
});

// Add remove vote endpoint
router.delete('/:pollId/vote', protect, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { pollId } = req.params;
    const { optionId } = req.body;

    const poll = await Poll.findById(pollId).session(session);
    
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    // Check if user has voted
    if (!poll.voters.includes(req.user._id)) {
      return res.status(400).json({ 
        message: 'You have not voted on this poll',
        code: 'NO_VOTE'
      });
    }

    const option = poll.options.id(optionId);
    if (!option) {
      return res.status(400).json({ message: 'Invalid option selected' });
    }

    // Decrement vote count
    option.votes = Math.max(0, option.votes - 1);
    
    // Remove user from voters list
    poll.voters = poll.voters.filter(
      voterId => voterId.toString() !== req.user._id.toString()
    );
        
    await poll.save({ session });
    await session.commitTransaction();
    
    // Return updated poll with user info
    const updatedPoll = await Poll.findById(pollId)
      .populate('createdBy', 'username')
      .populate('voters', 'username');
      
    res.json(updatedPoll);
  } catch (err) {
    await session.abortTransaction();
    console.error('Remove vote error:', err);
    res.status(400).json({ 
      message: 'Failed to remove vote. Please try again.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } finally {
    session.endSession();
  }
});

// Share tracking endpoint
router.post('/:pollId/share', async (req, res) => {
  try {
    const { pollId } = req.params;
    await Analytics.trackEvent(pollId, 'share');
    res.json({ success: true });
  } catch (err) {
    console.error('Share tracking error:', err);
    res.status(500).json({ message: 'Failed to track share' });
  }
});

// Remove duplicate endpoints and combine analytics routes
router.get('/:pollId/analytics', protect, async (req, res) => {
  try {
    const { pollId } = req.params;
    
    // Check if user is poll creator
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }
    
    if (poll.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view analytics' });
    }

    const analytics = await Analytics.findOne({ pollId });
    
    if (!analytics) {
      return res.json({ 
        pollId, 
        totalViews: 0, 
        totalVotes: 0, 
        totalShares: 0, 
        totalOptionsAdded: 0,
        viewsOverTime: [],
        votesOverTime: [],
        sharesOverTime: [],
        optionsAddedOverTime: []
      });
    }

    // Process time series data for the chart
    const timePoints = [...new Set([
      ...analytics.viewsOverTime,
      ...analytics.votesOverTime,
      ...analytics.sharesOverTime,
      ...analytics.optionsAddedOverTime
    ])].sort((a, b) => a - b);

    res.json({
      ...analytics.toObject(),
      timePoints
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// Optimize event tracking endpoints
const trackEvent = async (req, res, eventType) => {
  try {
    const { pollId } = req.params;
    await Analytics.trackEvent(pollId, eventType);
    res.status(200).json({ message: `${eventType} recorded` });
  } catch (err) {
    console.error(`Error recording ${eventType}:`, err);
    res.status(500).json({ message: 'Server error' });
  }
};

router.post('/:pollId/view', async (req, res) => trackEvent(req, res, 'view'));
router.post('/:pollId/share', async (req, res) => trackEvent(req, res, 'share'));

module.exports = router;
