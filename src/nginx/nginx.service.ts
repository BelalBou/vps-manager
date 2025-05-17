import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

interface ApplicationConfig {
  name: string;
  path: string;
  command: string;
  port: number;
  isRunning: boolean;
  environment?: Record<string, string>;
}

interface DomainConfig {
  domain: string;
  targetPort: number;
  sslCertificate?: string;
  isActive: boolean;
}

@Injectable()
export class NginxService {
  private readonly nginxConfigPath = '/etc/nginx/sites-available';
  private readonly nginxEnabledPath = '/etc/nginx/sites-enabled';
  private readonly configPath = '/etc/vps-manager';
  private readonly appsConfigFile = 'applications.json';
  private readonly domainsConfigFile = 'domains.json';

  constructor() {
    this.initializeConfigFiles();
  }

  private async initializeConfigFiles() {
    try {
      await fs.mkdir(this.configPath, { recursive: true });
      const appsPath = path.join(this.configPath, this.appsConfigFile);
      const domainsPath = path.join(this.configPath, this.domainsConfigFile);

      if (!await this.fileExists(appsPath)) {
        await fs.writeFile(appsPath, JSON.stringify([], null, 2));
      }
      if (!await this.fileExists(domainsPath)) {
        await fs.writeFile(domainsPath, JSON.stringify([], null, 2));
      }
    } catch (error) {
      throw new Error(`Failed to initialize config files: ${error.message}`);
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async findAvailablePort(startPort: number = 3000): Promise<number> {
    try {
      const { stdout } = await execAsync('netstat -tulpn | grep LISTEN');
      const usedPorts = new Set<number>();
      
      const lines = stdout.split('\n');
      for (const line of lines) {
        const portMatch = line.match(/:(\d+)\s+/);
        if (portMatch) {
          usedPorts.add(parseInt(portMatch[1]));
        }
      }

      let port = startPort;
      while (usedPorts.has(port)) {
        port++;
      }
      return port;
    } catch (error) {
      throw new Error(`Failed to find available port: ${error.message}`);
    }
  }

  async saveApplication(app: ApplicationConfig): Promise<void> {
    if (!app.port || await this.isPortInUse(app.port)) {
      app.port = await this.findAvailablePort();
    }

    const apps = await this.getApplications();
    const index = apps.findIndex(a => a.name === app.name);
    
    if (index >= 0) {
      apps[index] = app;
    } else {
      apps.push(app);
    }

    await fs.writeFile(
      path.join(this.configPath, this.appsConfigFile),
      JSON.stringify(apps, null, 2)
    );
  }

  async getApplications(): Promise<ApplicationConfig[]> {
    const content = await fs.readFile(
      path.join(this.configPath, this.appsConfigFile),
      'utf-8'
    );
    return JSON.parse(content);
  }

  async saveDomain(domain: DomainConfig): Promise<void> {
    const domains = await this.getDomains();
    const index = domains.findIndex(d => d.domain === domain.domain);
    
    if (index >= 0) {
      domains[index] = domain;
    } else {
      domains.push(domain);
    }

    await fs.writeFile(
      path.join(this.configPath, this.domainsConfigFile),
      JSON.stringify(domains, null, 2)
    );

    if (domain.isActive) {
      await this.createReverseProxy(domain.domain, domain.targetPort);
    } else {
      await this.removeReverseProxy(domain.domain);
    }
  }

  async getDomains(): Promise<DomainConfig[]> {
    const content = await fs.readFile(
      path.join(this.configPath, this.domainsConfigFile),
      'utf-8'
    );
    return JSON.parse(content);
  }

  async createReverseProxy(domain: string, targetPort: number): Promise<void> {
    const config = this.generateNginxConfig(domain, targetPort);
    const configPath = path.join(this.nginxConfigPath, `${domain}.conf`);

    try {
      await fs.writeFile(configPath, config);
      await this.enableSite(domain);
      await this.reloadNginx();
    } catch (error) {
      throw new Error(`Failed to create reverse proxy: ${error.message}`);
    }
  }

  async removeReverseProxy(domain: string): Promise<void> {
    const configPath = path.join(this.nginxConfigPath, `${domain}.conf`);
    const enabledPath = path.join(this.nginxEnabledPath, `${domain}.conf`);

    try {
      await this.disableSite(domain);
      await fs.unlink(configPath);
      await this.reloadNginx();
    } catch (error) {
      throw new Error(`Failed to remove reverse proxy: ${error.message}`);
    }
  }

  async listSites(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.nginxEnabledPath);
      return files.filter(file => file.endsWith('.conf'));
    } catch (error) {
      throw new Error(`Failed to list sites: ${error.message}`);
    }
  }

  private generateNginxConfig(domain: string, targetPort: number): string {
    return `
server {
    listen 80;
    server_name ${domain};

    location / {
        proxy_pass http://localhost:${targetPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
    `.trim();
  }

  private async enableSite(domain: string): Promise<void> {
    const source = path.join(this.nginxConfigPath, `${domain}.conf`);
    const target = path.join(this.nginxEnabledPath, `${domain}.conf`);
    await fs.symlink(source, target);
  }

  private async disableSite(domain: string): Promise<void> {
    const linkPath = path.join(this.nginxEnabledPath, `${domain}.conf`);
    await fs.unlink(linkPath);
  }

  private async reloadNginx(): Promise<void> {
    try {
      await execAsync('sudo nginx -t');
      await execAsync('sudo systemctl reload nginx');
    } catch (error) {
      throw new Error(`Failed to reload Nginx: ${error.message}`);
    }
  }

  async detectExistingConfigs(): Promise<Array<{ domain: string; targetPort: number }>> {
    try {
      const configs: Array<{ domain: string; targetPort: number }> = [];
      const files = await fs.readdir(this.nginxEnabledPath);
      
      for (const file of files) {
        if (file.endsWith('.conf')) {
          const content = await fs.readFile(path.join(this.nginxEnabledPath, file), 'utf-8');
          const domainMatch = content.match(/server_name\s+([^;]+);/);
          const portMatch = content.match(/proxy_pass\s+http:\/\/localhost:(\d+);/);
          
          if (domainMatch && portMatch) {
            const domain = domainMatch[1].trim();
            const port = parseInt(portMatch[1]);
            configs.push({ domain, targetPort: port });
          }
        }
      }
      
      return configs;
    } catch (error) {
      throw new Error(`Failed to detect existing configurations: ${error.message}`);
    }
  }

  async detectRunningApplications(): Promise<Array<{ name: string; port: number }>> {
    try {
      const { stdout } = await execAsync('netstat -tulpn | grep LISTEN');
      const applications: Array<{ name: string; port: number }> = [];
      
      const lines = stdout.split('\n');
      for (const line of lines) {
        const portMatch = line.match(/:(\d+)\s+/);
        const pidMatch = line.match(/\/([^/]+)$/);
        
        if (portMatch && pidMatch) {
          const port = parseInt(portMatch[1]);
          const name = pidMatch[1];
          if (port > 1024) { // Exclude system ports
            applications.push({ name, port });
          }
        }
      }
      
      return applications;
    } catch (error) {
      throw new Error(`Failed to detect running applications: ${error.message}`);
    }
  }

  async importDetectedConfigs(): Promise<void> {
    const [existingConfigs, runningApps] = await Promise.all([
      this.detectExistingConfigs(),
      this.detectRunningApplications()
    ]);

    // Import domains
    for (const config of existingConfigs) {
      await this.saveDomain({
        domain: config.domain,
        targetPort: config.targetPort,
        isActive: true
      });
    }

    // Import applications
    for (const app of runningApps) {
      await this.saveApplication({
        name: app.name,
        path: '/', // You might want to detect this
        command: '', // You might want to detect this
        port: app.port,
        isRunning: true
      });
    }
  }

  private async isPortInUse(port: number): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`netstat -tulpn | grep :${port}`);
      return stdout.length > 0;
    } catch {
      return false;
    }
  }
} 