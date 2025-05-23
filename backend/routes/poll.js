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
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        req.user = null;
        return next();
      }

      req.user = user;
      next();
    } catch (jwtError) {
      req.user = null;
      next();
    }
  } catch (err) {
    req.user = null;
    next();
  }
};

// Middleware to require authentication
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'No auth token' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      return res.status(401).json({ 
        message: 'Invalid or expired token',
        error: process.env.NODE_ENV === 'development' ? jwtError.message : undefined
      });
    }
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
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const search = req.query.search || '';

    // Create search query
    const searchQuery = search 
      ? { title: { $regex: search, $options: 'i' } }
      : {};

    const [totalPolls, polls] = await Promise.all([
      Poll.countDocuments(searchQuery),
      Poll.find(searchQuery)
        .populate('createdBy', 'username')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec()
    ]);

    res.json({
      polls,
      currentPage: page,
      totalPages: Math.ceil(totalPolls / limit),
      totalPolls
    });
  } catch (err) {
    console.error('Fetch polls error:', err);
    res.status(500).json({ 
      message: 'Failed to fetch polls',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined 
    });
  }
});

// Get single poll with analytics tracking
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    // Validate ObjectId first
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid poll ID format' });
    }

    const poll = await Poll.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('voters', 'username')
      .lean();  // Use lean() for better performance
      
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    // Ensure voterIPs array exists
    if (!poll.voterIPs) {
      poll.voterIPs = [];
    }

    // Track view asynchronously without waiting
    Analytics.trackEvent(poll._id, 'view').catch(err => {
      console.error('View tracking error:', err);
    });
    
    res.json(poll);
  } catch (err) {
    console.error('Error fetching poll:', err);
    res.status(500).json({ 
      message: 'Error fetching poll',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Modified vote endpoint to support IP-based voting
router.post('/:pollId/vote', optionalAuth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { pollId } = req.params;
    const { optionId } = req.body;
    const voterIP = req.ip; // Get voter's IP address

    const poll = await Poll.findById(pollId).session(session);
    
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    // Check if IP has already voted
    if (poll.voterIPs.includes(voterIP)) {
      return res.status(400).json({ 
        message: 'Anda sudah memberikan suara di polling ini!',
        code: 'DUPLICATE_VOTE'
      });
    }

    // If user is authenticated, also check user-based voting
    if (req.user) {
      const hasVoted = poll.voters.some(voter => 
        voter.toString() === req.user._id.toString()
      );

      if (hasVoted) {
        return res.status(400).json({ 
          message: 'Anda sudah memberikan suara di polling ini!',
          code: 'DUPLICATE_VOTE'
        });
      }
    }

    const option = poll.options.id(optionId);
    if (!option) {
      return res.status(400).json({ message: 'Opsi tidak valid' });
    }

    // Record the vote
    option.votes += 1;
    poll.voterIPs.push(voterIP);
    
    // If user is authenticated, also record their user ID
    if (req.user) {
      poll.voters.push(req.user._id);
    }
        
    await poll.save({ session });
    await Analytics.trackEvent(pollId, 'vote');
    await session.commitTransaction();
    
    // Return updated poll
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
    const ip = req.ip;
    await Analytics.trackEvent(pollId, 'share', ip);
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
    
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
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

// Modified view tracking endpoint
router.post('/:pollId/view', async (req, res) => {
  try {
    const { pollId } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(pollId)) {
      return res.status(400).json({ message: 'Invalid poll ID format' });
    }

    // Check if poll exists
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    // Track view event
    await Analytics.trackEvent(pollId, 'view');
    res.json({ success: true });
  } catch (err) {
    console.error('View tracking error:', err);
    res.status(500).json({ 
      message: 'Failed to track view',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

router.post('/:pollId/share', async (req, res) => trackEvent(req, res, 'share'));

module.exports = router;
