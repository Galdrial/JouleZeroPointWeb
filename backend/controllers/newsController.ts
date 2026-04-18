import { Request, Response } from 'express';
import News, { INews } from '../models/News';
import logger from '../config/logger';

/**
 * News Controller (TypeScript).
 * 
 * Manages the lifecycle of news and lore artifacts, including public
 * discovery, administrative creation, updates, and archival cleanup.
 */

/**
 * @desc    Fetch news collection based on visibility and category
 * @route   GET /api/v1/news
 * @access  Public
 */
export const getNews = async (req: Request, res: Response) => {
  try {
    const { limit, category } = req.query;
    const query: any = { isPublished: true };

    if (category) {
      query.category = category.toString().toLowerCase();
    }

    // Sorting Logic: Priority to 'Featured' content, then by manual order, then temporal.
    let newsQuery = News.find(query).sort({ isFeatured: -1, featuredOrder: 1, publishedAt: -1 });

    if (limit) {
      newsQuery = newsQuery.limit(parseInt(limit as string, 10));
    }

    const news = await newsQuery.select('-content'); // Data reduction for listing
    res.json(news);
  } catch (error) {
    logger.error(`NEWS_LIST_ERROR: ${(error as Error).message}`);
    res.status(500).json({ error: 'Error during news registry synchronization.' });
  }
};

/**
 * @desc    Retrieve a specific news entity by its unique slug
 * @route   GET /api/v1/news/:slug
 * @access  Public
 */
export const getNewsBySlug = async (req: Request, res: Response) => {
  try {
    const news: INews | null = await News.findOne({ slug: req.params.slug, isPublished: true });

    if (!news) {
      return res.status(404).json({ error: 'News frequency not found in the archive.' });
    }

    res.json(news);
  } catch (error) {
    logger.error(`NEWS_DETAIL_ERROR: ${(error as Error).message}`);
    res.status(500).json({ error: 'Error during detailed news retrieval.' });
  }
};

/**
 * @desc    Initialize a new news artifact (Administrative)
 * @route   POST /api/v1/news
 * @access  Private/Admin
 */
export const createNews = async (req: Request, res: Response) => {
  try {
    const news = await News.create(req.body);
    logger.info(`VIGIL_SYSTEM: New news published: ${news.title}`);
    res.status(201).json(news);
  } catch (error) {
    if ((error as any).code === 11000) {
      return res.status(409).json({ error: 'Conflict: A news entry with this slug already persists.' });
    }
    logger.error(`NEWS_CREATE_ERROR: ${(error as Error).message}`);
    res.status(400).json({ error: 'Error during news artifact creation.' });
  }
};

/**
 * @desc    Modify an existing news artifact (Administrative)
 * @route   PUT /api/v1/news/:slug
 * @access  Private/Admin
 */
export const updateNews = async (req: Request, res: Response) => {
  try {
    const news: INews | null = await News.findOneAndUpdate(
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
    logger.error(`NEWS_UPDATE_ERROR: ${(error as Error).message}`);
    res.status(400).json({ error: 'Error during news recalibration sequence.' });
  }
};

/**
 * @desc    Eradicate a news artifact from the registry (Administrative)
 * @route   DELETE /api/v1/news/:slug
 * @access  Private/Admin
 */
export const deleteNews = async (req: Request, res: Response) => {
  try {
    const news: INews | null = await News.findOneAndDelete({ slug: req.params.slug });

    if (!news) {
      return res.status(404).json({ error: 'News artifact not found.' });
    }

    logger.info(`VIGIL_SYSTEM: News purged from archive: ${news.title}`);
    res.status(204).send();
  } catch (error) {
    logger.error(`NEWS_DELETE_ERROR: ${(error as Error).message}`);
    res.status(500).json({ error: 'Error during news decommissioning sequence.' });
  }
};

/**
 * @desc    Fetch all news artifacts including unpublished drafts (Administrative)
 * @route   GET /api/v1/news/admin
 * @access  Private/Admin
 */
export const getAdminNews = async (req: Request, res: Response) => {
  try {
    const news = await News.find().sort({ publishedAt: -1 });
    res.json(news);
  } catch (error) {
    logger.error(`NEWS_ADMIN_LIST_ERROR: ${(error as Error).message}`);
    res.status(500).json({ error: 'Error during administrative news synchronization.' });
  }
};
