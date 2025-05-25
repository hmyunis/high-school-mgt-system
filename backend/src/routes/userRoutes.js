const express = require('express');
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', protect, authorize('ADMIN', 'TEACHER'), userController.getAllUsers);

router.get('/profile', protect, userController.getMyProfile);

router.get('/:id', protect, authorize('ADMIN', 'TEACHER'), userController.getUserById);

router.post('/', protect, authorize('ADMIN'), userController.createUser);

router.put('/:id', protect, userController.updateUser);

router.patch('/:id/archive', protect, authorize('ADMIN'), userController.archiveUser);

router.patch('/:id/restore', protect, authorize('ADMIN'), userController.restoreUser);

router.delete('/:id/permanent', protect, authorize('ADMIN'), userController.permanentDeleteUser);

module.exports = router;
