const mongoose = require('mongoose');

const WelfareCheckSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sos: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SOS',
        required: true
    },
    scheduledFor: {
        type: Date,
        required: true
    },
    sent: {
        type: Boolean,
        default: false
    },
    response: {
        type: String, // e.g. "okay", "need_help"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('WelfareCheck', WelfareCheckSchema);
