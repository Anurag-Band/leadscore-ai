import { Hono } from 'hono';
import { OfferSchema } from '../models/schemas';
import { store } from '../store/memoryStore';
import { APIError } from '../utils/errorHandler';
import { generateId, sanitizeString } from '../utils/validators';

const offerRoutes = new Hono();

offerRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();

    // Validate input
    const validatedData = OfferSchema.parse(body);

    // Sanitize strings
    const sanitizedOffer = {
      ...validatedData,
      name: sanitizeString(validatedData.name),
      value_props: validatedData.value_props.map(sanitizeString),
      ideal_use_cases: validatedData.ideal_use_cases.map(sanitizeString),
    };

    // Create offer object
    const offer = {
      id: generateId(),
      ...sanitizedOffer,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store offer
    store.setOffer(offer);

    return c.json({
      success: true,
      offerId: offer.id,
      message: 'Offer created successfully',
    }, 201);

  } catch (error: any) {
    if (error.name === 'ZodError') {
      throw new APIError('VALIDATION_ERROR', 'Invalid offer data', 400, error.errors);
    }
    throw error;
  }
});

offerRoutes.get('/', (c) => {
  const offer = store.getOffer();
  if (!offer) {
    throw new APIError('NOT_FOUND', 'No offer found', 404);
  }

  return c.json({
    success: true,
    offer,
  });
});

export default offerRoutes;
