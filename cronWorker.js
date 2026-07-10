const cron = require('node-cron');
const mongoose = require('mongoose');

// 1. Import your MongoDB Group/Ajo Schema Model
// Adjust the path below to point to where your Group model file is located
const Group = require('./src/model/creategroup'); // <-- Update this path as needed

// 2. Connect to MongoDB (you can reuse your existing connection code or config)

const startCronJobs = () => {
    // ─────────────────────────────────────────────────────────────────────────
    // TASK 1: RUNS EVERY MIDNIGHT (00:00) 
    // This automatically increments the day counter for all active daily groups
    // ─────────────────────────────────────────────────────────────────────────
    cron.schedule('0 0 * * * ', async () => {
        // 0 0 * * *
        // */1 * * * *
        console.log('⏰ Midnight Clock: Updating active daily savings groups...');

        try {
            // Find all active groups with a 'daily' cycle
            // Using a case-insensitive regex check so "Daily", "daily", or "DAILY" all match
            const result = await Group.updateMany(
                {
                    cycleType: { $regex: /^daily$/i },
                    status: 'active'
                },
                {
                    $inc: { currentCycleProgress: 1 }
                }
            );

            console.log(`✅ Success: Updated ${result.modifiedCount} daily groups.`);

            // OPTIONAL: Automatically close groups that hit their max limit
            await checkAndCloseCompletedGroups();

        } catch (error) {
            console.error('❌ Error running daily cron job:', error);
        }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // TASK 2: RUNS EVERY SUNDAY MIDNIGHT (00:00)
    // Increments week counter for active weekly groups
    // ─────────────────────────────────────────────────────────────────────────
    cron.schedule('0 0 * * 0', async () => {
        console.log('⏰ Sunday Clock: Updating active weekly savings groups...');
        try {
            await Group.updateMany(
                {
                    cycleType: { $regex: /^weekly$/i },
                    status: 'active'
                },
                {
                    $inc: { currentCycleProgress: 1 }
                }
            );
            console.log('✅ Success: Updated weekly groups.');
            await checkAndCloseCompletedGroups();
        } catch (error) {
            console.error('❌ Error running weekly cron job:', error);
        }
    });
};

// Helper function to turn off groups that have finished their lifecycle
const checkAndCloseCompletedGroups = async () => {
    try {
        // Find groups where progress has equaled or passed total cycle duration
        const groups = await Group.find({ status: 'active' });

        for (let group of groups) {
            if (group.currentCycleProgress >= group.cycleDuration) {
                group.status = 'completed';
                await group.save();
                console.log(`🎉 Group "${group.name || group.groupName}" has reached maturity and is marked completed!`);
                // Here is where you can later trigger your payout/disbursement code!
            }
        }
    } catch (err) {
        console.error('❌ Error closing completed groups:', err);
    }
};

module.exports = startCronJobs;