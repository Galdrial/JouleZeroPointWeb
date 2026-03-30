const News = require('../models/News');
const logger = require('../config/logger');

// @desc    Get all news
// @route   GET /api/v1/news
// @access  Public
const getNews = async (req, res) => {
  try {
    const { limit, category } = req.query;
    const query = { isPublished: true };

    if (category) {
      query.category = category.toString().toLowerCase();
    }

    let newsQuery = News.find(query).sort({ isFeatured: -1, featuredOrder: 1, publishedAt: -1 });

    if (limit) {
      newsQuery = newsQuery.limit(parseInt(limit, 10));
    }

    const news = await newsQuery.select('-content'); // Omit content for listing
    res.json(news);
  } catch (error) {
    logger.error(`ERRORE_NEWS_LIST: ${error.message}`);
    res.status(500).json({ error: 'Errore durante il caricamento delle news.' });
  }
};

// @desc    Get single news by slug
// @route   GET /api/v1/news/:slug
// @access  Public
const getNewsBySlug = async (req, res) => {
  try {
    const news = await News.findOne({ slug: req.params.slug, isPublished: true });

    if (!news) {
      return res.status(404).json({ error: 'Frequenza News non trovata.' });
    }

    res.json(news);
  } catch (error) {
    logger.error(`ERRORE_NEWS_DETAIL: ${error.message}`);
    res.status(500).json({ error: 'Errore nel recupero della news.' });
  }
};

// @desc    Create news (Admin)
// @route   POST /api/v1/news
// @access  Private/Admin
const createNews = async (req, res) => {
  try {
    const news = await News.create(req.body);
    logger.info(`SISTEMA_VIGILE: Nuova news pubblicata: ${news.title}`);
    res.status(201).json(news);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Esiste già una news con questo slug (URL).' });
    }
    logger.error(`ERRORE_NEWS_CREATE: ${error.message}`);
    res.status(400).json({ error: 'Errore nella creazione della news.' });
  }
};

// @desc    Update news (Admin)
// @route   PUT /api/v1/news/:slug
// @access  Private/Admin
const updateNews = async (req, res) => {
  try {
    const news = await News.findOneAndUpdate(
      { slug: req.params.slug },
      req.body,
      { new: true, runValidators: true }
    );

    if (!news) {
      return res.status(404).json({ error: 'News non trovata.' });
    }

    logger.info(`SISTEMA_VIGILE: News aggiornata: ${news.title}`);
    res.json(news);
  } catch (error) {
    logger.error(`ERRORE_NEWS_UPDATE: ${error.message}`);
    res.status(400).json({ error: 'Errore nell\'aggiornamento della news.' });
  }
};

// @desc    Delete news (Admin)
// @route   DELETE /api/v1/news/:slug
// @access  Private/Admin
const deleteNews = async (req, res) => {
  try {
    const news = await News.findOneAndDelete({ slug: req.params.slug });

    if (!news) {
      return res.status(404).json({ error: 'News non trovata.' });
    }

    logger.info(`SISTEMA_VIGILE: News rimossa: ${news.title}`);
    res.status(204).send(); // No content for successful delete
  } catch (error) {
    logger.error(`ERRORE_NEWS_DELETE: ${error.message}`);
    res.status(500).json({ error: 'Errore durante l\'eliminazione.' });
  }
};

// @desc    Get all news (Admin - includes unpublished)
// @route   GET /api/v1/news/admin
// @access  Private/Admin
const getAdminNews = async (req, res) => {
  try {
    const news = await News.find().sort({ publishedAt: -1 });
    res.json(news);
  } catch (error) {
    logger.error(`ERRORE_NEWS_ADMIN_LIST: ${error.message}`);
    res.status(500).json({ error: 'Errore caricamento news administrative.' });
  }
};

module.exports = {
  getNews,
  getNewsBySlug,
  createNews,
  updateNews,
  deleteNews,
  getAdminNews,
};
