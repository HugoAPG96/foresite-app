import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS: el frontend Angular (Vercel) consume esta API desde otro dominio.
  // CORS_ORIGIN admite varios orígenes separados por coma (ej. https://foresite.vercel.app,http://localhost:4200).
  // Sin definirla, se permite cualquier origen (útil en desarrollo).
  const origins = (process.env.CORS_ORIGIN ?? '').split(',').map((o) => o.trim()).filter(Boolean);
  app.enableCors({ origin: origins.length ? origins : true });

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
