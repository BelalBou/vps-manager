import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { Application } from './entities/application.entity';

@ApiTags('applications')
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new application' })
  @ApiResponse({ status: 201, description: 'Application created successfully', type: Application })
  create(@Body() createApplicationDto: Partial<Application>) {
    return this.applicationsService.create(createApplicationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all applications' })
  @ApiResponse({ status: 200, description: 'Return all applications', type: [Application] })
  findAll() {
    return this.applicationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an application by id' })
  @ApiResponse({ status: 200, description: 'Return the application', type: Application })
  findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an application' })
  @ApiResponse({ status: 200, description: 'Application updated successfully', type: Application })
  update(@Param('id') id: string, @Body() updateApplicationDto: Partial<Application>) {
    return this.applicationsService.update(+id, updateApplicationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an application' })
  @ApiResponse({ status: 204, description: 'Application deleted successfully' })
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.applicationsService.remove(+id);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start an application' })
  @ApiResponse({ status: 200, description: 'Application started successfully' })
  start(@Param('id') id: string) {
    return this.applicationsService.start(+id);
  }

  @Post(':id/stop')
  @ApiOperation({ summary: 'Stop an application' })
  @ApiResponse({ status: 200, description: 'Application stopped successfully' })
  stop(@Param('id') id: string) {
    return this.applicationsService.stop(+id);
  }

  @Post(':id/restart')
  @ApiOperation({ summary: 'Restart an application' })
  @ApiResponse({ status: 200, description: 'Application restarted successfully' })
  restart(@Param('id') id: string) {
    return this.applicationsService.restart(+id);
  }
} 