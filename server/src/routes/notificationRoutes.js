const express = require('express');
const { protect } = require('../middleware/auth');
const c = require('../controllers/notificationController');

const router = express.Router();

// Every notification belongs to one person; none of this is public.
router.use(protect);

// Declared before '/:id/read' so 'read-all' is never read as an id.
router.patch('/read-all', c.markAllRead);

router.get('/', c.listMine);
router.patch('/:id/read', c.markRead);

module.exports = router;
