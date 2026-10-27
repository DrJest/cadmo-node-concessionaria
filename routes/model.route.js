import { z } from 'zod';
import { Router } from 'express';
import { Brand } from './brand.route.js';

export const Model = z.object({
    id: z.int().gt(0),
    name: z.string().min(1),
    available_colors: z.array(z.enum([
        'white',
        'black',
        'red',
        'green',
        'blue'
    ])),
    year: z.int().gt(1800).lte(new Date().getFullYear()),
    price: z.number(),
    brand: Brand
})

export const router = Router();

router.get('/', (req, res) => {
    res.send([]);
});

export default router;