const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Student = require('../models/Student');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected [web:1][web:8]
router.use(protect);

// @route   GET /api/courses
// @desc    Get all courses with search and filter
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { search, department, status, semester } = req.query;
    let query = {};

    // Search by course name, code, or department
    if (search) {
      query.$or = [
        { courseName: { $regex: search, $options: 'i' } },
        { courseCode: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by department
    if (department) {
      query.department = department;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by semester
    if (semester) {
      query.semester = semester;
    }

    const courses = await Course.find(query)
      .populate('enrolledStudents', 'firstName lastName studentId email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    console.error('Get Courses Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses'
    });
  }
});

// @route   GET /api/courses/:id
// @desc    Get single course
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('enrolledStudents', 'firstName lastName studentId email class');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Get Course Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course'
    });
  }
});

// @route   POST /api/courses
// @desc    Create new course
// @access  Private
router.post('/', async (req, res) => {
  try {
    const {
      courseCode,
      courseName,
      description,
      credits,
      instructor,
      department,
      schedule,
      capacity,
      semester,
      academicYear,
      status
    } = req.body;

    // Validation
    if (!courseCode || !courseName || !credits || !department) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if course code exists
    const existingCourse = await Course.findOne({ courseCode });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: 'Course code already exists'
      });
    }

    const course = await Course.create({
      courseCode,
      courseName,
      description,
      credits,
      instructor,
      department,
      schedule,
      capacity: capacity || 30,
      semester,
      academicYear,
      status: status || 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    console.error('Create Course Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating course'
    });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('enrolledStudents', 'firstName lastName studentId');

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    console.error('Update Course Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating course'
    });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Remove course from all enrolled students [web:7]
    await Student.updateMany(
      { enrolledCourses: course._id },
      { $pull: { enrolledCourses: course._id } }
    );

    await course.deleteOne();

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete Course Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting course'
    });
  }
});

module.exports = router;
