import { Module } from '@nestjs/common';
import { NginxController } from './nginx.controller';
import { NginxService } from './nginx.service';

@Module({
  controllers: [NginxController],
  providers: [NginxService],
  exports: [NginxService],
})
export class NginxModule {} 