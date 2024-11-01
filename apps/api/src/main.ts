import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { HttpExceptionFilter } from './commons/exception-filter/http-exception-filter';
import { JwtAuthGuard } from './user/util/jwt-auth.guard';

async function bootstrap() {
  initializeTransactionalContext();

  const app = await NestFactory.create(AppModule, {
    abortOnError: true,
    logger: ['log', 'fatal', 'error', 'warn', 'debug'],
  });

  const config = new DocumentBuilder()
    .setTitle('FINGOO Documentation')
    .setDescription('FINGOO의 API 문서입니다.')
    .setVersion('0.0.0')
    .addBearerAuth(
      {
        description: 'Enter token',
        name: 'Authorization',
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'bearer',
      },
      'Authorization',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
    }),
  );

  // codespace 환경에서 포트포워딩을 위해 설정
  const applicationHost =
    process.env.NODE_ENV === 'production'
      ? 'https://fingoo.app'
      : process.env.CODESPACES === 'true'
        ? 'https://' + process.env.CODESPACE_NAME + '-3000.app.github.dev'
        : 'http://localhost';

  app.enableCors({
    origin: ['https://www.fingoo.app', 'https://fingoo.app', 'https://fingoo-web-beta.vercel.app', applicationHost, 'http://localhost:3000'],
    credentials: true,
  });

  app.useGlobalGuards(app.get(JwtAuthGuard));
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(8000);
}
bootstrap();
