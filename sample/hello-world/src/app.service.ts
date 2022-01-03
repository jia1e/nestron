import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private name = '';

  setName(name: string) {
    this.name = name;
  }

  getHello(): string {
    return `Hello ${this.name || 'World'}!`;
  }
}
