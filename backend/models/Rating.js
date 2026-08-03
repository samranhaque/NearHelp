const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
    sos: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SOS',
        required: true
    },
    seeker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    responder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    stars: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    review: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Rating', RatingSchema);
