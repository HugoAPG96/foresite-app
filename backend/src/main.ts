import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita CORS para que el frontend Angular (Vercel) pueda consumir la API
  app.enableCors();

  // Valida y transforma automáticamente los DTOs de entrada en cada request
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Documentación OpenAPI, disponible en /docs
  const config = new DocumentBuilder()
    .setTitle('Foresite API')
    .setDescription(
      'API REST de Foresite: gestión de proyectos, cronograma RACI, backlog, riesgos y reportes.',
    )
    .setVersion('0.1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Foresite API corriendo en http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log(`Documentación OpenAPI en http://localhost:${port}/docs`);
}
bootstrap();
