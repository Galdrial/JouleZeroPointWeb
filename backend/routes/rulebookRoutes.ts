import express from 'express';
import { getRulebook } from '../controllers/rulebookController';

const router = express.Router();

router.get('/', getRulebook);

export default router;
