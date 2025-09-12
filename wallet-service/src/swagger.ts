import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Wallet Service API',
      version: '0.1.0',
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);

