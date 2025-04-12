const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password hanya required jika bukan login Google
    },
    minlength: [6, 'Password must be at least 6 characters']
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  }
});

// Hanya hash password jika password diubah dan bukan user Google
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || this.googleId) return next();
  
  try {
    if (this.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPassword.test(this.password)) {
      throw new Error('Password must contain uppercase, lowercase, number and special character');
    }
    
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Add method to handle failed login attempts
userSchema.methods.incLoginAttempts = async function() {
  if (this.lockUntil && this.lockUntil > Date.now()) {
    return;
  }
  
  const updates = {
    $inc: { loginAttempts: 1 },
    $set: { lockUntil: Date.now() + 1800000 } // Lock for 30 minutes
  };
  
  await this.updateOne(updates);
};

module.exports = mongoose.model('User', userSchema);
