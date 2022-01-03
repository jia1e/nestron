import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ElectronExpressAdapter, NestronExpressApplication } from 'nestron';
import { BrowserWindow } from 'electron';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestronExpressApplication>(
    AppModule,
    new ElectronExpressAdapter(),
  );

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  await app.listen('app', () => {
    const win = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        devTools: true,
      },
    });

    win.loadURL('app://localhost');
  });
}
bootstrap();
