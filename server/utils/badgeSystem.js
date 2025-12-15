const User = require("../models/User");
const Plantation = require("../models/Plantation"); //

// Define Badge Rules (Ordered from easiest to hardest)
const BADGES = [
    { name: "First Sprout", condition: (count, points) => count >= 1, description: "Planted your first tree" },
    { name: "Nature Watcher", condition: (count, points) => count >= 5, description: "Uploaded 5 verification photos" },
    { name: "Forest King", condition: (count, points) => points >= 100, description: "Earned 100 Eco Points" },
    { name: "Earth Guardian", condition: (count, points) => count >= 10 && points >= 200, description: "Planted 10 trees & 200 pts" }
];

async function checkBadges(userId) {
    try {
        const user = await User.findById(userId);
        const treeCount = await Plantation.countDocuments({ userId: userId });
        
        let newBadges = [];

        for (const badge of BADGES) {
            const alreadyHas = user.badges.some(b => b.badgeName === badge.name);
            
            if (!alreadyHas && badge.condition(treeCount, user.points)) {
                
                // 1. Add to history
                user.badges.push({
                    badgeName: badge.name,
                    dateEarned: new Date()
                });

                // 2. UPDATE MAIN DISPLAY TITLE (The Fix)
                user.badge = badge.name; 
                
                newBadges.push(badge.name);
            }
        }

        if (newBadges.length > 0) {
            await user.save();
        }

        return newBadges.length > 0 ? newBadges[newBadges.length - 1] : null; // Return highest earned

    } catch (error) {
        console.error("Badge Check Error:", error);
        return null;
    }
}

module.exports = checkBadges;