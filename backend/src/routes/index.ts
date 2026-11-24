import { Router } from 'express';
import authRoutes from './auth.routes.js';
import buyerRoutes from './buyer.routes.js';
import factoryRoutes from './factory.routes.js';
import orderRoutes from './order.routes.js';
import productRoutes from './product.routes.js';
import healthRoutes from './health.routes.js';

const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/buyers', buyerRoutes);
apiRouter.use('/factories', factoryRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/products', productRoutes);

export default apiRouter;
