const Group = require("../model/creategroup");
const AuthPage = require("../model/authpage");

// ── CREATE GROUP ────────────────────────────────────────────────────────────
exports.createGroup = async (req, res) => {
  console.log("🎯 createGroup function started");
  try {
    console.log("📦 req.body:", req.body);
    console.log("👤 req.user:", req.user);

    // ── Step 1: Get the Alajo ID from JWT (sent by middleware) ──────────────
    const alajoId = req.user.id; // Your JWT uses 'id', not '_id'
    console.log("✅ alajoId:", alajoId);

    // ── Step 2: Get form data from frontend ──────────────────────────────────
    // Added commissionAmount straight from your frontend's form payload
    const { name, cycleType, amount, cycleDuration, startDate, description, contributors, commissionAmount } =
      req.body;

    // ── Step 3: Validate all required fields ────────────────────────────────
    if (!name || !cycleType || !amount || !cycleDuration || !startDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Check if amount is positive
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    // Check if cycle duration is positive
    if (cycleDuration <= 0) {
      return res.status(400).json({
        success: false,
        message: "Cycle duration must be greater than 0",
      });
    }

    // ── Step 4: Convert startDate string to Date object ─────────────────────
    const groupStartDate = new Date(startDate);

    // Check if start date is valid
    if (isNaN(groupStartDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date",
      });
    }

    // ── Step 5: Calculate end date based on cycle type ──────────────────────
    let groupEndDate = new Date(groupStartDate);

    if (cycleType === "daily") {
      // Add X days
      groupEndDate.setDate(groupEndDate.getDate() + cycleDuration);
    } else if (cycleType === "weekly") {
      // Add X weeks (1 week = 7 days)
      groupEndDate.setDate(groupEndDate.getDate() + cycleDuration * 7);
    } else if (cycleType === "monthly") {
      // Add X months
      groupEndDate.setMonth(groupEndDate.getMonth() + cycleDuration);
    }

    // ── Step 6: Calculate current cycle progress ────────────────────────────
    let currentProgress = "";
    if (cycleType === "daily") {
      currentProgress = `Day 1 of ${cycleDuration}`;
    } else if (cycleType === "weekly") {
      currentProgress = `Week 1 of ${cycleDuration}`;
    } else if (cycleType === "monthly") {
      currentProgress = `Month 1 of ${cycleDuration}`;
    }

    // ── Step 7: Create the group in database ───────────────────────────────
    const newGroup = await Group.create({
      name: name.trim(),
      description: description ? description.trim() : null,
      cycleType: cycleType,
      amount: amount,
      cycleDuration: cycleDuration,
      startDate: groupStartDate,
      endDate: groupEndDate,
      currentCycleProgress: 1, // Start at 1 (Day 1, Week 1, Month 1)
      commissionAmount: Number(commissionAmount || 0),
      totalCollected: 0, // Nothing collected yet
      alajo: alajoId, // The Alajo who created this group
      contributors: contributors || [], // Use provided contributors or empty array
      status: "active",
    });

    // ── ADDED PIPELINE: Save the flat commission amount directly ──
    if (commissionAmount !== undefined && commissionAmount !== null) {
      try {
        const Commission = require("../model/commission"); // Ensure this path matches your directory

        await Commission.create({
          groupId: newGroup._id,
          alajoId: alajoId,
          commissionAmount: Number(commissionAmount), // Using the raw Naira value directly
          isActive: true
        });
        console.log(`⚡ Linked Commission pipeline saved directly: ₦${commissionAmount}`);
      } catch (commErr) {
        console.warn("⚠️ Automatic commission creation skipped or failed:", commErr.message);
      }
    }

    // ── Step 8: Update the Alajo's user record ─────────────────────────────
    await AuthPage.findByIdAndUpdate(
      alajoId,
      {
        $push: { groupsCreated: newGroup._id }, // Add group ID to array
      },
      { new: true }
    );

    // ── Step 9: Send success response back to frontend ─────────────────────
    res.status(201).json({
      success: true,
      message: "Group created successfully",
      group: newGroup,
    });
  } catch (error) {
    // If something goes wrong, send error message
    console.error("Error creating group:", error);
    res.status(500).json({
      success: false,
      message: "Error creating group",
      error: error.message,
    });
  }
};

// ── GET ALL GROUPS FOR AN ALAJO ────────────────────────────────────────────
exports.getMyGroups = async (req, res) => {
  try {
    // Get the Alajo ID from JWT (your JWT uses 'id', not '_id')
    const alajoId = req.user.id;

    // Find all groups where alajo = alajoId
    const groups = await Group.find({ alajo: alajoId })
      .populate("contributors", "name phone") // Get contributor details
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({
      success: true,
      count: groups.length,
      groups: groups,
    });
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching groups",
      error: error.message,
    });
  }
};

// ── GET SINGLE GROUP DETAILS ───────────────────────────────────────────────
exports.getGroupById = async (req, res) => {
  try {
    const groupId = req.params.id;

    // Find the group by ID 
    const group = await Group.findById(groupId)
      .populate("alajo", "name phone") // Get Alajo details
      .populate("contributors", "name phone address"); // Get all contributors

    // Check if group exists
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    res.status(200).json({
      success: true,
      group: group,
    });
  } catch (error) {
    console.error("Error fetching group:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching group",
      error: error.message,
    });
  }
};

// ── UPDATE GROUP STATUS (Mark as completed) ────────────────────────────────
exports.updateGroupStatus = async (req, res) => {
  try {
    const groupId = req.params.id;
    const { status } = req.body; // "active", "completed", or "paused"

    // Check if status is valid
    if (!["active", "completed", "paused"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Use: active, completed, or paused",
      });
    }

    // Update the group status
    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { status: status },
      { new: true } // Return the updated document
    );

    // Check if group exists
    if (!updatedGroup) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Group status updated to ${status}`,
      group: updatedGroup,
    });
  } catch (error) {
    console.error("Error updating group:", error);
    res.status(500).json({
      success: false,
      message: "Error updating group",
      error: error.message,
    });
  }
};

// ── GET CONTRIBUTORS ────────────────────────────────────────────────────────
// Fetches list of all users/contributors for quick-add feature
// Returns: Array of users with _id, name, phone, address

exports.getContributors = async (req, res) => {
  try {

    // Get all users except the current one (don't show yourself)
    const alajo = req.user.id;

    const contributors = await AuthPage.find({ _id: { $ne: alajo } })
      .select("_id name phone address")
      .limit(50)
      .sort({ name: 1 }); // Sort alphabetically by name

    console.log("✅ Fetched contributors:", contributors.length);

    res.status(200).json(contributors);
  } catch (error) {
    console.error("❌ Error fetching contributors:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching contributors",
      error: error.message,
    });
  }
};

