import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { BacklogModule } from './modules/backlog/backlog.module';
import { RisksModule } from './modules/risks/risks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Conexión a PostgreSQL (Neon). autoLoadEntities evita mantener un glob
    // manual: cada módulo registra sus entidades con TypeOrmModule.forFeature
    // y quedan disponibles aquí automáticamente.
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        ssl: { rejectUnauthorized: false }, // requerido por Neon
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
        retryAttempts: 3,
        retryDelay: 1000,
        connectTimeoutMS: 10000,
      }),
    }),

    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    BacklogModule,
    RisksModule,
  ],
})
export class AppModule {}
