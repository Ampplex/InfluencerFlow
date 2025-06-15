import { Router } from 'express';
import { InstagramYoutubeController } from '../controllers/instagramYoutubeController';

const router = Router();
const controller = new InstagramYoutubeController();

// POST /api/instagram/monitor
router.post('/instagram/monitor', (req, res) => { controller.monitorInstagramPost(req, res)});

// POST /api/youtube/monitor
router.post('/youtube/monitor', (req, res) => { controller.monitorYoutubeVideo(req, res); });

export default router; 