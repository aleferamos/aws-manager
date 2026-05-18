import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthorityService } from './authority.service';
import { CreateAuthorityDto } from './dto/create-authority.dto';
import { RootAuthGuard } from '../shared/auth/root-auth.guard';
import { ListAuthoritiesQueryDto } from './dto/list-authorities-query.dto';
import { UpdateAuthorityDto } from './dto/update-authority.dto';

@Controller('authority')
export class AuthorityController {
  constructor(private readonly authorityService: AuthorityService) {}

  @Post('create')
  @UseGuards(RootAuthGuard)
  async create(@Body() createAuthorityDto: CreateAuthorityDto) {
    return this.authorityService.create(createAuthorityDto);
  }

  @Get('list')
  @UseGuards(RootAuthGuard)
  async list(@Query() query: ListAuthoritiesQueryDto) {
    return this.authorityService.list(query);
  }

  @Get('view/:id')
  @UseGuards(RootAuthGuard)
  async view(@Param('id') id: string) {
    return this.authorityService.view(id);
  }

  @Put('update/:id')
  @UseGuards(RootAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateAuthorityDto: UpdateAuthorityDto,
  ) {
    return this.authorityService.update(id, updateAuthorityDto);
  }

  @Delete('delete/:id')
  @UseGuards(RootAuthGuard)
  async delete(@Param('id') id: string) {
    await this.authorityService.delete(id);

    return {
      success: true,
    };
  }
}
