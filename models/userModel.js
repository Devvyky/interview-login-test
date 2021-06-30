const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const slugify = require('slugify');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  slug: String,
  firstName: {
    type: String,
    required: [true, 'Please input your first name'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Please input your last name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please input your email address!'],
    unique: [true, 'A user already exists with that email address!'],
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  organization: {
    type: String,
    required: [true, 'Please input your organization!'],
    trim: true,
  },
  password: {
    type: String,
    minlength: 8,
    required: [true, 'Please input a password with at least 8 characters!'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Password confirm should match password!'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same',
    },
  },
  role: {
    type: String,
    default: 'user',
    enum: {
      values: ['user', 'admin'],
      message: ['Role is either user or admin'],
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
});

// MIDDLEWARES

userSchema.pre('save', function (next) {
  this.slug = slugify(`${this.firstName}-${this.lastName}`, { lower: true });
  next();
});

// INSTANCE METHOD TO HASH PASSWORD DURING USER SIGNUP

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete the password confirm field
  this.passwordConfirm = undefined;

  next();
});

// Instance method to check if incoming password matches existing user password during user login
userSchema.methods.correctPassword = async function (
  incomingPassword,
  userPassword
) {
  return await bcrypt.compare(incomingPassword, userPassword);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
