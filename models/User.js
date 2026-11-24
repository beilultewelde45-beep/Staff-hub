import mongoose from 'mongoose';
import { ROLE_KEYS } from '../config/roles.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email is not valid'],
    },
    // Shown in the top bar/greeting. For staff it mirrors the Employee name;
    // pure admin accounts have no Employee record.
    displayName: { type: String, required: [true, 'Name is required'], trim: true },
    passwordHash: { type: String, required: true, select: false },
    roles: {
      type: [{ type: String, enum: ROLE_KEYS }],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'A user needs at least one role',
      },
    },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

userSchema.methods.setPassword = async function setPassword(plain) {
  this.passwordHash = await hashPassword(plain);
};

/** Requires the doc to be loaded with `.select('+passwordHash')`. */
userSchema.methods.checkPassword = function checkPassword(plain) {
  return verifyPassword(plain, this.passwordHash);
};

userSchema.methods.hasRole = function hasRole(...roles) {
  return roles.some((r) => this.roles.includes(r));
};

userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.passwordHash;
    return ret;
  },
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
