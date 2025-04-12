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
  viewsOverTime: [{
    type: Date,
    default: Date.now
  }],
  votesOverTime: [{
    type: Date,
    default: Date.now
  }],
  sharesOverTime: [{
    type: Date,
    default: Date.now
  }],
  optionsAddedOverTime: [{
    type: Date,
    default: Date.now
  }]
}, {
  timestamps: true
});

// Static method to track various events
analyticsSchema.statics.trackEvent = async function(pollId, eventType) {
  const timeField = eventType + 'sOverTime';
  const totalField = 'total' + eventType.charAt(0).toUpperCase() + eventType.slice(1) + 's';
  
  const update = {
    $inc: { [totalField]: 1 },
    $push: { [timeField]: new Date() }
  };

  await this.findOneAndUpdate(
    { pollId },
    update,
    { upsert: true }
  );
};

const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics;