import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';

const port = process.env.PORT || 6969
const expressApp = express();

expressApp.use(
  '/api/v1/webhook/razorpay',
  express.raw({ type: 'application/json' })
);


async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI, // adds `/v1`
  });


  app.useGlobalPipes(
    new ValidationPipe({
      // transform: true,
      whitelist: true,
    }),
  );

  // app.useGlobalFilters(new AllExceptionsFilter(app.get(LogsService)));

  app.enableCors({
    // origin: ['http://192.168.1.4:3036', 'http://192.168.1.4:8081'],
    origin: true,
    methods: 'GET,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.use(cookieParser());


  await app.listen(port, () => {
    console.log(`Server running on -> http://192.168.1.101:${port}`);
  });
}
bootstrap();
