/**
 * Express application composition root.
 *
 * This file wires the HTTP layer (Express) to the domain/services layer by:
 * - Creating repositories/services/controllers (simple DI)
 * - Mounting routers with controller instances
 * - Registering global middleware (404 + error handler)
 *
 * When adding new modules, follow the same pattern:
 * - Create Repo -> Service -> Controller
 * - Create Router(controller)
 * - Mount under `/api/<resource>`
 */
import express from 'express';
import cors from 'cors';

import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';

import createCategoryRouter from './routes/CategoryRoute.js';
import { CategoryController } from './controllers/CategoryController.js';
import { CategoryService } from './services/CategoryService.js';
import { CategoryRepository } from './domain/repositories/CategoryRepository.js';

const app = express();

app.use(cors());
app.use(express.json());

const categoryRepository = new CategoryRepository();
const categoryService = new CategoryService(categoryRepository);
const categoryController = new CategoryController(categoryService);

app.use('/api/categories', createCategoryRouter(categoryController));

// 404 then error handler (order matters)
app.use(notFound);
app.use(errorHandler);

export default app;
