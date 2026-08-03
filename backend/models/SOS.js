const mongoose = require('mongoose');

const SOSSchema = new mongoose.Schema({
    seeker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['Medical', 'Car Problem', 'Fire', 'Gas Leak', 'Threat', 'General'],
        required: true
    },
    modalData: {
        carMake: String,
        carModel: String,
        licensePlate: String,
        medicalDescription: String,
        generalDescription: String,
        bloodGroup: String
    },
    location: {
        lat: Number,
        lng: Number
    },
    status: {
        type: String,
        enum: ['active', 'responding', 'resolved', 'cancelled'],
        default: 'active'
    },
    responders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    firstResponseGuidance: String,
    resolutionSummary: String,
    chatLog: [{
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: String,
        timestamp: { type: Date, default: Date.now }
    }],
    isFlagged: {
        type: Boolean,
        default: false
    },
    flaggedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    resolvedAt: Date,
    responseTimeSeconds: Number,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SOS', SOSSchema);
