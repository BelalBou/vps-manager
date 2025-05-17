import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DomainsService } from './domains.service';
import { Domain } from './entities/domain.entity';

@ApiTags('domains')
@Controller('domains')
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new domain' })
  @ApiResponse({ status: 201, description: 'Domain created successfully', type: Domain })
  create(@Body() createDomainDto: Partial<Domain>) {
    return this.domainsService.create(createDomainDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all domains' })
  @ApiResponse({ status: 200, description: 'Return all domains', type: [Domain] })
  findAll() {
    return this.domainsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a domain by id' })
  @ApiResponse({ status: 200, description: 'Return the domain', type: Domain })
  findOne(@Param('id') id: string) {
    return this.domainsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a domain' })
  @ApiResponse({ status: 200, description: 'Domain updated successfully', type: Domain })
  update(@Param('id') id: string, @Body() updateDomainDto: Partial<Domain>) {
    return this.domainsService.update(+id, updateDomainDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a domain' })
  @ApiResponse({ status: 204, description: 'Domain deleted successfully' })
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.domainsService.remove(+id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a domain' })
  @ApiResponse({ status: 200, description: 'Domain activated successfully' })
  activate(@Param('id') id: string) {
    return this.domainsService.activate(+id);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a domain' })
  @ApiResponse({ status: 200, description: 'Domain deactivated successfully' })
  deactivate(@Param('id') id: string) {
    return this.domainsService.deactivate(+id);
  }
} 