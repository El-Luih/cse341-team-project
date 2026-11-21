import ejsRouter from './ejs-routes.js';
import apiRouter from './api-routes.js';
import { Router } from 'express';

const router = Router();

router.use('/', apiRouter);
router.use('/', ejsRouter);

export default router;