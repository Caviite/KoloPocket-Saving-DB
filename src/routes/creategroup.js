console.log("✅ ROUTES LOADED: creategroup routes are now active");
const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/token");
const {
  createGroup,
  getMyGroups,
  getGroupById,
  updateGroupStatus,
  getContributors
} = require("../controller/creategroup");
console.log("🔍 Imported controller functions:", { createGroup, getMyGroups, getGroupById, updateGroupStatus });


// ── CREATE GROUP ────────────────────────────────────────────────────────────
// POST /api/groups
// Creates a new group for the logged-in Alajo
// Requires: Authentication token
router.post("/", authenticate, createGroup);
console.log("🚀 POST / route hit!");

// / ── GET ALL CONTRIBUTORS ────────────────────────────────────────────────────
// GET /creategroup/contributors
// Gets list of all users to quick-add to groups
// Requires: Authentication token
router.get("/contributors", authenticate, getContributors);

// ── GET ALL MY GROUPS ───────────────────────────────────────────────────────
// GET /api/groups
// Gets all groups for the logged-in Alajo
// Requires: Authentication token
router.get("/getMyGroups", authenticate, getMyGroups);
console.log("🚀 GET / route hit!");

// ── GET SINGLE GROUP ────────────────────────────────────────────────────────
// GET /api/groups/:id
// Gets one group's full details (with all contributors)
// Requires: Authentication token
router.get("/:id", authenticate, getGroupById);

// ── UPDATE GROUP STATUS ─────────────────────────────────────────────────────
// PUT /api/groups/:id
// Updates group status (active, completed, paused)
// Requires: Authentication token, status in body
router.put("/:id", authenticate, updateGroupStatus);

module.exports = router;