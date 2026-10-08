import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { BacklogModule } from './modules/backlog/backlog.module';
import { RisksModule } from './modules/risks/risks.module';
import { PlanningModule } from './modules/planning/planning.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Conexión a PostgreSQL (en Render, junto con la API). autoLoadEntities evita mantener un glob
    // manual: cada módulo registra sus entidades con TypeOrmModule.forFeature
    // y quedan disponibles aquí automáticamente.
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        // URL interna de Render: sin SSL. URL externa (desde tu PC): DB_SSL=true
        ssl: config.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        autoLoadEntities: true,
        schema: 'vintage',
        synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
        retryAttempts: 3,
        retryDelay: 1000,
        connectTimeoutMS: 10000,
      }),
    }),

    AuthModule,
    UsersModule,
    ProjectsModule,
    PlanningModule,
    TasksModule,
    BacklogModule,
    RisksModule,
  ],
})
export class AppModule {}
