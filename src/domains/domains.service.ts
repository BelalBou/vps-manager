import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Domain } from './entities/domain.entity';
import { NginxService } from '../nginx/nginx.service';

@Injectable()
export class DomainsService {
  constructor(
    @InjectRepository(Domain)
    private domainsRepository: Repository<Domain>,
    private nginxService: NginxService,
  ) {}

  async findAll(): Promise<Domain[]> {
    return this.domainsRepository.find({
      relations: ['application'],
    });
  }

  async findOne(id: number): Promise<Domain> {
    const domain = await this.domainsRepository.findOne({
      where: { id },
      relations: ['application'],
    });
    if (!domain) {
      throw new NotFoundException(`Domain with ID ${id} not found`);
    }
    return domain;
  }

  async create(domainData: Partial<Domain>): Promise<Domain> {
    const domain = this.domainsRepository.create(domainData);
    return this.domainsRepository.save(domain);
  }

  async update(id: number, domainData: Partial<Domain>): Promise<Domain> {
    await this.findOne(id);
    await this.domainsRepository.update(id, domainData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const domain = await this.findOne(id);
    if (domain.isActive) {
      await this.nginxService.removeReverseProxy(domain.name);
    }
    const result = await this.domainsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Domain with ID ${id} not found`);
    }
  }

  async activate(id: number): Promise<void> {
    const domain = await this.findOne(id);
    if (!domain.application) {
      throw new Error('Cannot activate domain without an associated application');
    }
    await this.nginxService.createReverseProxy(domain.name, domain.application.port);
    await this.update(id, { isActive: true });
  }

  async deactivate(id: number): Promise<void> {
    const domain = await this.findOne(id);
    if (domain.isActive) {
      await this.nginxService.removeReverseProxy(domain.name);
      await this.update(id, { isActive: false });
    }
  }
} 