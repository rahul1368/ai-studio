import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  Body,
  Headers,
  UnauthorizedException,
  BadRequestException,
  Param,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GenerationService } from './generation.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';

@ApiTags('generation')
@ApiBearerAuth()
@Controller('generation')
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
        prompt: { type: 'string' },
      },
    },
  })
  async generate(
    @UploadedFile() file: Express.Multer.File,
    @Body('prompt') prompt: string,
    @Headers('authorization') authorization: string,
  ) {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    if (!prompt || prompt.trim().length === 0) {
      throw new BadRequestException('Prompt is required');
    }

    // Basic prompt sanitization: collapse whitespace and trim length
    prompt = prompt.replace(/\s+/g, ' ').trim().slice(0, 280);

    const token = authorization.substring(7);
    return this.generationService.createGeneration(file, prompt, token);
  }

  @Get()
  async getGenerations(
    @Headers('authorization') authorization: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authorization.substring(7);
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 12;
    
    return this.generationService.getGenerations(token, pageNum, limitNum);
  }

  @Post(':id/reapply')
  async reapply(
    @Param('id') id: string,
    @Body('prompt') prompt: string,
    @Headers('authorization') authorization: string,
  ) {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }
    if (!prompt || prompt.trim().length === 0) {
      throw new BadRequestException('Prompt is required');
    }
    const token = authorization.substring(7);
    return this.generationService.reapplyGeneration(id, prompt, token);
  }
}
