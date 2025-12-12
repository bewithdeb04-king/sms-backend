const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Course = require('../models/Course');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected [web:1][web:8]
router.use(protect);

// @route   GET /api/students
// @desc    Get all students with search and filter
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { search, class: studentClass, course, status } = req.query;
    let query = {};

    // Search by name, studentId, or class
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { class: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by class
    if (studentClass) {
      query.class = studentClass;
    }

    // Filter by course
    if (course) {
      query.enrolledCourses = course;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    const students = await Student.find(query)
      .populate('enrolledCourses', 'courseName courseCode')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error('Get Students Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students'
    });
  }
});

// @route   GET /api/students/:id
// @desc    Get single student
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('enrolledCourses');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Get Student Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student'
    });
  }
});

// @route   POST /api/students
// @desc    Create new student
// @access  Private
router.post('/', async (req, res) => {
  try {
    const {
      studentId,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      class: studentClass,
      section,
      address,
      enrolledCourses,
      status
    } = req.body;

    // Validation
    if (!studentId || !firstName || !lastName || !email || !phone || !dateOfBirth || !studentClass) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if student ID exists
    const existingStudent = await Student.findOne({ studentId });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student ID already exists'
      });
    }

    // Check if email exists
    const existingEmail = await Student.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    const student = await Student.create({
      studentId,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      class: studentClass,
      section,
      address,
      enrolledCourses: enrolledCourses || [],
      status: status || 'active'
    });

    // Update course enrollment if courses provided [web:7]
    if (enrolledCourses && enrolledCourses.length > 0) {
      await Course.updateMany(
        { _id: { $in: enrolledCourses } },
        { $addToSet: { enrolledStudents: student._id } }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student
    });
  } catch (error) {
    console.error('Create Student Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating student'
    });
  }
});

// @route   PUT /api/students/:id
// @desc    Update student
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    let student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get old courses for comparison
    const oldCourses = student.enrolledCourses.map(c => c.toString());
    const newCourses = req.body.enrolledCourses || [];

    // Update student
    student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('enrolledCourses');

    // Update course enrollments [web:7]
    const coursesToAdd = newCourses.filter(c => !oldCourses.includes(c));
    const coursesToRemove = oldCourses.filter(c => !newCourses.includes(c));

    if (coursesToAdd.length > 0) {
      await Course.updateMany(
        { _id: { $in: coursesToAdd } },
        { $addToSet: { enrolledStudents: student._id } }
      );
    }

    if (coursesToRemove.length > 0) {
      await Course.updateMany(
        { _id: { $in: coursesToRemove } },
        { $pull: { enrolledStudents: student._id } }
      );
    }

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });
  } catch (error) {
    console.error('Update Student Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating student'
    });
  }
});

// @route   DELETE /api/students/:id
// @desc    Delete student
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Remove student from all enrolled courses [web:7]
    await Course.updateMany(
      { enrolledStudents: student._id },
      { $pull: { enrolledStudents: student._id } }
    );

    await student.deleteOne();

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Delete Student Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting student'
    });
  }
});

// @route   POST /api/students/:id/enroll
// @desc    Enroll student in course
// @access  Private
router.post('/:id/enroll', async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    const student = await Student.findById(req.params.id);
    const course = await Course.findById(courseId);

    if (!student || !course) {
      return res.status(404).json({
        success: false,
        message: 'Student or Course not found'
      });
    }

    // Check if already enrolled
    if (student.enrolledCourses.includes(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'Student already enrolled in this course'
      });
    }

    // Check capacity
    if (course.enrolledStudents.length >= course.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Course is full'
      });
    }

    // Enroll student [web:7]
    student.enrolledCourses.push(courseId);
    await student.save();

    course.enrolledStudents.push(student._id);
    await course.save();

    res.json({
      success: true,
      message: 'Student enrolled successfully',
      data: student
    });
  } catch (error) {
    console.error('Enroll Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling student'
    });
  }
});

// @route   POST /api/students/:id/unenroll
// @desc    Unenroll student from course
// @access  Private
router.post('/:id/unenroll', async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    const student = await Student.findById(req.params.id);
    const course = await Course.findById(courseId);

    if (!student || !course) {
      return res.status(404).json({
        success: false,
        message: 'Student or Course not found'
      });
    }

    // Unenroll student [web:7]
    student.enrolledCourses = student.enrolledCourses.filter(
      c => c.toString() !== courseId
    );
    await student.save();

    course.enrolledStudents = course.enrolledStudents.filter(
      s => s.toString() !== student._id.toString()
    );
    await course.save();

    res.json({
      success: true,
      message: 'Student unenrolled successfully',
      data: student
    });
  } catch (error) {
    console.error('Unenroll Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unenrolling student'
    });
  }
});

module.exports = router;
