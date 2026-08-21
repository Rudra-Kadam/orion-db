import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  app.enableCors({
    origin: process.env.WEB_URL ?? 'https://localhost:3001',
    credentials: true,
  });

  const port = process.env.port ?? 3000;
  await app.listen(port);
  console.log(`Server is running on http://localhost:${port}`);
}
void bootstrap();
