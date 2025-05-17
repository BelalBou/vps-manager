import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('VPS Manager API')
    .setDescription('Interface de gestion de votre VPS')
    .setVersion('1.0')
    .addTag('applications', 'Gestion des applications')
    .addTag('domains', 'Gestion des domaines')
    .addTag('nginx', 'Configuration Nginx')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3002);
}
bootstrap();
