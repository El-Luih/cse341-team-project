import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import swaggerJsdoc from 'swagger-jsdoc';
import pkg from './package.json' with { type: 'json' };

const routesFile = fileURLToPath(new URL('./src/routes/api-routes.js', import.meta.url));
const outputFile = fileURLToPath(new URL('./swagger.json', import.meta.url));

export const createSwaggerSpec = () => swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kizuna Rail API',
      version: pkg.version
    }
  },
  apis: [routesFile]
});

export const swaggerSpec = createSwaggerSpec();

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file://${process.argv[1]}`))) {
  await writeFile(outputFile, `${JSON.stringify(swaggerSpec, null, 2)}\n`);
  console.log(`Swagger specification written to ${outputFile}`);
}