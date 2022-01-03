import { Body, Controller, Get, Post, Render } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Render('index')
  getHello() {
    return { message: this.appService.getHello() };
  }

  @Post()
  @Render('index')
  setName(@Body() { name }: { name: string }) {
    this.appService.setName(name);
    return { message: this.appService.getHello() };
  }
}
