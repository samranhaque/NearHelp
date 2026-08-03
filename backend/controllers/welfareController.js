const { recordWelfareResponse } = require('../jobs/welfareCheck');

// @desc    Respond to a welfare check
// @route   POST /api/welfare/respond
// @access  Private
const respondWelfare = async (req, res) => {
    try {
        const { sosId, response } = req.body;
        const userId = req.user.id;

        if (!sosId || !response) {
            return res.status(400).json({ message: 'Please provide sosId and response' });
        }

        await recordWelfareResponse(userId, sosId, response);

        if (response === 'need_help') {
            if (global.io) {
                global.io.to('admin:room').emit('admin:user_needs_help', { userId, sosId, response });
            }
        }

        res.status(200).json({ message: 'Response recorded' });
    } catch (error) {
        console.error("Welfare Respond Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    respondWelfare
};
