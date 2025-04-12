const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  pollId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll',
    required: true
  },
  totalViews: {
    type: Number,
    default: 0
  },
  totalVotes: {
    type: Number,
    default: 0
  },
  totalShares: {
    type: Number,
    default: 0
  },
  totalOptionsAdded: {
    type: Number,
    default: 0
  },
  viewsOverTime: [Number],
  votesOverTime: [Number],
  sharesOverTime: [Number],
  optionsAddedOverTime: [Number],
  uniqueShareIPs: [String]
});

analyticsSchema.statics.trackEvent = async function(pollId, eventType, ip) {
  try {
    const now = Date.now();
    let updateQuery = {};

    switch (eventType) {
      case 'view':
        updateQuery = {
          $inc: { totalViews: 1 },
          $push: { viewsOverTime: now }
        };
        break;
      case 'vote':
        updateQuery = {
          $inc: { totalVotes: 1 },
          $push: { votesOverTime: now }
        };
        break;
      case 'share':
        // Only increment share count if IP is not already in uniqueShareIPs
        updateQuery = {
          $addToSet: { uniqueShareIPs: ip },
          $push: { sharesOverTime: now }
        };
        break;
      case 'optionAdd':
        updateQuery = {
          $inc: { totalOptionsAdded: 1 },
          $push: { optionsAddedOverTime: now }
        };
        break;
      default:
        throw new Error(`Invalid event type: ${eventType}`);
    }

    const analytics = await this.findOneAndUpdate(
      { pollId },
      {
        ...updateQuery,
        $setOnInsert: {
          pollId,
          totalViews: eventType === 'view' ? 1 : 0,
          totalVotes: eventType === 'vote' ? 1 : 0,
          totalShares: 0,
          totalOptionsAdded: eventType === 'optionAdd' ? 1 : 0
        }
      },
      {
        upsert: true,
        new: true
      }
    );

    // For share events, update totalShares based on unique IPs
    if (eventType === 'share') {
      await this.findOneAndUpdate(
        { pollId },
        { $set: { totalShares: analytics.uniqueShareIPs.length } }
      );
    }

    return analytics;
  } catch (error) {
    console.error('Error tracking event:', error);
    throw error;
  }
};

const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics;