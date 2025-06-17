import { Router } from 'express';
import apiController from '../controllers/apiController';

const router: Router = Router();

router.get('/sample', apiController.getSampleData);

export default router;