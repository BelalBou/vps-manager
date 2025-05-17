import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from './entities/application.entity';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private applicationsRepository: Repository<Application>,
  ) {}

  async findAll(): Promise<Application[]> {
    return this.applicationsRepository.find();
  }

  async findOne(id: number): Promise<Application> {
    const application = await this.applicationsRepository.findOne({ where: { id } });
    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }
    return application;
  }

  async create(applicationData: Partial<Application>): Promise<Application> {
    const application = this.applicationsRepository.create(applicationData);
    return this.applicationsRepository.save(application);
  }

  async update(id: number, applicationData: Partial<Application>): Promise<Application> {
    await this.findOne(id);
    await this.applicationsRepository.update(id, applicationData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.applicationsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }
  }

  async start(id: number): Promise<void> {
    const application = await this.findOne(id);
    try {
      await execAsync(`cd ${application.path} && ${application.command}`);
      await this.update(id, { isRunning: true });
    } catch (error) {
      throw new Error(`Failed to start application: ${error.message}`);
    }
  }

  async stop(id: number): Promise<void> {
    const application = await this.findOne(id);
    try {
      // Note: This is a simple implementation. In production, you'd want to properly
      // identify and kill the process
      await execAsync(`pkill -f "${application.command}"`);
      await this.update(id, { isRunning: false });
    } catch (error) {
      throw new Error(`Failed to stop application: ${error.message}`);
    }
  }

  async restart(id: number): Promise<void> {
    await this.stop(id);
    await this.start(id);
  }
} 