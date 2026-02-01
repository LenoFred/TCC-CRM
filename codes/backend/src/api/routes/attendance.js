/**
 * Attendance Routes
 * Defines all attendance-related endpoints
 */

const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate, requirePermission } = require('../../middlewares/auth');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { validate, schemas } = require('../../utils/validation');

/**
 * @route   GET /api/attendance/stats
 * @desc    Get attendance statistics
 * @access  Private
 */
router.get(
  '/stats',
  authenticate,
  requirePermission('can_view_attendance'),
  asyncHandler(attendanceController.getStats.bind(attendanceController))
);

/**
 * @route   GET /api/attendance/gathering/:gatheringID
 * @desc    Get attendance for a specific gathering
 * @access  Private (temporarily disabled for testing)
 */
router.get(
  '/gathering/:gatheringID',
  authenticate,
  requirePermission('can_view_attendance'),
  asyncHandler(attendanceController.getByGathering.bind(attendanceController))
);

/**
 * @route   GET /api/attendance/member/:memberID
 * @desc    Get attendance for a specific member
 * @access  Private (temporarily disabled for testing)
 */
router.get(
  '/member/:memberID',
  authenticate,
  requirePermission('can_view_attendance'),
  asyncHandler(attendanceController.getByMember.bind(attendanceController))
);

/**
 * @route   GET /api/attendance
 * @desc    Get all attendance records
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  requirePermission('can_view_attendance'),
  asyncHandler(attendanceController.getAll.bind(attendanceController))
);

/**
 * @route   GET /api/attendance/:id
 * @desc    Get single attendance record by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('can_view_attendance'),
  asyncHandler(attendanceController.getById.bind(attendanceController))
);

/**
 * @route   POST /api/attendance/check-in
 * @desc    Check-in member to gathering
 * @access  Private
 */
router.post(
  '/check-in',
  authenticate,
  requirePermission('can_add_attendance'),
  validate(schemas.attendance.create),
  asyncHandler(attendanceController.checkIn.bind(attendanceController))
);

/**
 * @route   POST /api/attendance
 * @desc    Create attendance record
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  requirePermission('can_add_attendance'),
  validate(schemas.attendance.create),
  asyncHandler(attendanceController.create.bind(attendanceController))
);

/**
 * @route   PATCH /api/attendance/:id/check-out
 * @desc    Check-out member from gathering
 * @access  Private
 */
router.patch(
  '/:id/check-out',
  authenticate,
  requirePermission('can_edit_attendance'),
  asyncHandler(attendanceController.checkOut.bind(attendanceController))
);

/**
 * @route   PATCH /api/attendance/:id
 * @desc    Update attendance record
 * @access  Private
 */
router.patch(
  '/:id',
  authenticate,
  requirePermission('can_edit_attendance'),
  validate(schemas.attendance.update),
  asyncHandler(attendanceController.update.bind(attendanceController))
);

/**
 * @route   DELETE /api/attendance/:id
 * @desc    Delete attendance record
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('can_delete_attendance'),
  asyncHandler(attendanceController.delete.bind(attendanceController))
);

module.exports = router;
