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

// Public routes
router.get('/', getNews);
router.get('/:slug', getNewsBySlug);

// Admin routes
router.get('/admin/all', adminProtect, getAdminNews);
router.post('/', adminProtect, createNews);
router.put('/:slug', adminProtect, updateNews);
router.delete('/:slug', adminProtect, deleteNews);

// Admin Image upload
router.post('/admin/upload-image', adminProtect, (req, res) => {
    uploadNewsImage.single('image')(req, res, (error) => {
        if (error) {
            const message = error.message === 'File too large'
                ? 'Immagine troppo grande (max 4MB).'
                : error.message || 'Errore upload immagine.';
            return res.status(400).json({ error: message });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Nessun file ricevuto.' });
        }

        return res.status(201).json({
            imageUrl: `/news/${req.file.filename}`
        });
    });
});

module.exports = router;
