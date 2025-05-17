import { Controller, Post, Delete, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NginxService } from './nginx.service';

@ApiTags('nginx')
@Controller('nginx')
export class NginxController {
  constructor(private readonly nginxService: NginxService) {}

  @Post('reverse-proxy')
  @ApiOperation({ summary: 'Create a new reverse proxy configuration' })
  @ApiResponse({ status: 201, description: 'Reverse proxy created successfully' })
  createReverseProxy(
    @Body() body: { domain: string; targetPort: number },
  ) {
    return this.nginxService.createReverseProxy(body.domain, body.targetPort);
  }

  @Delete('reverse-proxy/:domain')
  @ApiOperation({ summary: 'Remove a reverse proxy configuration' })
  @ApiResponse({ status: 200, description: 'Reverse proxy removed successfully' })
  removeReverseProxy(@Param('domain') domain: string) {
    return this.nginxService.removeReverseProxy(domain);
  }

  @Get('sites')
  @ApiOperation({ summary: 'List all configured sites' })
  @ApiResponse({ status: 200, description: 'Return list of configured sites' })
  listSites() {
    return this.nginxService.listSites();
  }

  @Get('detect-configs')
  @ApiOperation({ summary: 'Detect existing Nginx configurations' })
  @ApiResponse({ status: 200, description: 'Return list of detected configurations' })
  detectConfigs() {
    return this.nginxService.detectExistingConfigs();
  }

  @Get('detect-apps')
  @ApiOperation({ summary: 'Detect running applications' })
  @ApiResponse({ status: 200, description: 'Return list of running applications' })
  detectApps() {
    return this.nginxService.detectRunningApplications();
  }

  @Post('import-detected')
  @ApiOperation({ summary: 'Import detected configurations' })
  @ApiResponse({ status: 200, description: 'Configurations imported successfully' })
  importDetected() {
    return this.nginxService.importDetectedConfigs();
  }
} 