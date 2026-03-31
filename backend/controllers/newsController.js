const News = require('../models/News');
const logger = require('../config/logger');

/**
 * @desc    Fetch news collection based on visibility and category
 * @route   GET /api/v1/news
 * @access  Public
 * @protocol Implements featured-first sorting and category filtering. Omits full content for performance.
 */
const getNews = async (req, res) => {
  try {
    const { limit, category } = req.query;
    const query = { isPublished: true };

    if (category) {
      query.category = category.toString().toLowerCase();
    }

    // Sorting Logic: Priority to 'Featured' content, then by manual order, then temporal.
    let newsQuery = News.find(query).sort({ isFeatured: -1, featuredOrder: 1, publishedAt: -1 });

    if (limit) {
      newsQuery = newsQuery.limit(parseInt(limit, 10));
    }

    const news = await newsQuery.select('-content'); // Data reduction for listing
    res.json(news);
  } catch (error) {
    logger.error(`NEWS_LIST_ERROR: ${error.message}`);
    res.status(500).json({ error: 'Error during news registry synchronization.' });
  }
};

/**
 * @desc    Retrieve a specific news entity by its unique slug
 * @route   GET /api/v1/news/:slug
 * @access  Public
 * @protocol Ensures only published content is accessible via public channels.
 */
const getNewsBySlug = async (req, res) => {
  try {
    const news = await News.findOne({ slug: req.params.slug, isPublished: true });

    if (!news) {
      return res.status(404).json({ error: 'News frequency not found in the archive.' });
    }

    res.json(news);
  } catch (error) {
    logger.error(`NEWS_DETAIL_ERROR: ${error.message}`);
    res.status(500).json({ error: 'Error during detailed news retrieval.' });
  }
};

/**
 * @desc    Initialize a new news artifact (Administrative)
 * @route   POST /api/v1/news
 * @access  Private/Admin
 * @protocol Requires high-clearance authentication. Validates slug uniqueness.
 */
const createNews = async (req, res) => {
  try {
    const news = await News.create(req.body);
    logger.info(`VIGIL_SYSTEM: New news published: ${news.title}`);
    res.status(201).json(news);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Conflict: A news entry with this slug already persists.' });
    }
    logger.error(`NEWS_CREATE_ERROR: ${error.message}`);
    res.status(400).json({ error: 'Error during news artifact creation.' });
  }
};

/**
 * @desc    Modify an existing news artifact (Administrative)
 * @route   PUT /api/v1/news/:slug
 * @access  Private/Admin
 * @protocol Administrative override for content recalibration.
 */
const updateNews = async (req, res) => {
  try {
    const news = await News.findOneAndUpdate(
      { slug: req.params.slug },
      req.body,
      { new: true, runValidators: true }
    );

    if (!news) {
      return res.status(404).json({ error: 'News artifact not found.' });
    }

    logger.info(`VIGIL_SYSTEM: News updated: ${news.title}`);
    res.json(news);
  } catch (error) {
    logger.error(`NEWS_UPDATE_ERROR: ${error.message}`);
    res.status(400).json({ error: 'Error during news recalibration sequence.' });
  }
};

/**
 * @desc    Eradicate a news artifact from the registry (Administrative)
 * @route   DELETE /api/v1/news/:slug
 * @access  Private/Admin
 * @protocol Permanent deletion from the central matrix.
 */
const deleteNews = async (req, res) => {
  try {
    const news = await News.findOneAndDelete({ slug: req.params.slug });

    if (!news) {
      return res.status(404).json({ error: 'News artifact not found.' });
    }

    logger.info(`VIGIL_SYSTEM: News purged from archive: ${news.title}`);
    res.status(204).send(); // No content for successful decommissioning
  } catch (error) {
    logger.error(`NEWS_DELETE_ERROR: ${error.message}`);
    res.status(500).json({ error: 'Error during news decommissioning sequence.' });
  }
};

/**
 * @desc    Fetch all news artifacts including unpublished drafts (Administrative)
 * @route   GET /api/v1/news/admin
 * @access  Private/Admin
 * @protocol Bypasses publication filters for editorial review.
 */
const getAdminNews = async (req, res) => {
  try {
    const news = await News.find().sort({ publishedAt: -1 });
    res.json(news);
  } catch (error) {
    logger.error(`NEWS_ADMIN_LIST_ERROR: ${error.message}`);
    res.status(500).json({ error: 'Error during administrative news synchronization.' });
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
