const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
    },
    age: {
        type: Number,
    },
    isPhysicallyDisabled: {
        type: Boolean,
        default: false,
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
    },
    healthConditions: {
        type: String,
    },
    skills: [{
        type: String,
        enum: ['Medical', 'Car Diagnosis Skill', 'None'],
    }],
    location: {
        lat: { type: Number, default: 28.6139 },
        lng: { type: Number, default: 77.2090 },
    },
    skillVerificationStatus: {
        Medical: {
            type: String,
            enum: ['pending', 'verified', 'rejected'],
            default: 'pending'
        }
    },
    guardians: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    isActive: {
        type: Boolean,
        default: true,
    },
    isSuspended: {
        type: Boolean,
        default: false,
    },
    falseAlertCount: {
        type: Number,
        default: 0,
    },
    trustScore: {
        type: Number,
        default: 0.0,
    },
    totalRatings: {
        type: Number,
        default: 0,
    },
    ratingSum: {
        type: Number,
        default: 0,
    },
    isOnline: {
        type: Boolean,
        default: false,
    },
    lastSeen: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('User', UserSchema);
