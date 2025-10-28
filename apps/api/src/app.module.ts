import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { GenerationModule } from './generation/generation.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [AuthModule, GenerationModule, UploadsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
