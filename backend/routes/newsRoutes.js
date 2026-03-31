const express = require('express');
const router = express.Router();
const { 
  getNews, 
  getNewsBySlug, 
  createNews, 
  updateNews, 
  deleteNews,
  getAdminNews
} = require('../controllers/newsController');
const { adminProtect } = require('../middleware/adminMiddleware');
const { uploadNewsImage } = require('../config/multer');

/**
 * @route   GET /api/v1/news
 * @desc    Retrieve all published news artifacts
 * @access  Public
 */
router.get('/', getNews);

/**
 * @route   GET /api/v1/news/:slug
 * @desc    Retrieve news details by unique slug designation
 * @access  Public
 */
router.get('/:slug', getNewsBySlug);

/**
 * @route   GET /api/v1/news/admin/all
 * @desc    Administrative overview of all news (including drafts)
 * @access  Private/Admin
 */
router.get('/admin/all', adminProtect, getAdminNews);

/**
 * @route   POST /api/v1/news
 * @desc    Initialize a new news artifact
 * @access  Private/Admin
 */
router.post('/', adminProtect, createNews);

/**
 * @route   PUT /api/v1/news/:slug
 * @desc    Modify an existing news artifact
 * @access  Private/Admin
 */
router.put('/:slug', adminProtect, updateNews);

/**
 * @route   DELETE /api/v1/news/:slug
 * @desc    Eradicate a news artifact from the registry
 * @access  Private/Admin
 */
router.delete('/:slug', adminProtect, deleteNews);

/**
 * @route   POST /api/v1/news/admin/upload-image
 * @desc    Upload news imagery to the central asset repository
 * @access  Private/Admin
 * @protocol Manages file size constraints and storage destination via Multer.
 */
router.post('/admin/upload-image', adminProtect, (req, res) => {
    uploadNewsImage.single('image')(req, res, (error) => {
        if (error) {
            // Error Mapping: Convert Multer signals to detailed technical English
            const message = error.message === 'File too large'
                ? 'Image asset exceeds maximum scale threshold (4MB limit).'
                : error.message || 'Error occurred during image asset transmission.';
            return res.status(400).json({ error: message });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Null payload detected: No asset file received.' });
        }

        return res.status(201).json({
            imageUrl: `/news/${req.file.filename}`
        });
    });
});

module.exports = router;
