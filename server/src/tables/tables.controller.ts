import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateTableDto } from './dto/create-table.dto';
import { TablesService } from './tables.service';

@Controller('tables')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TablesController {
  constructor(private tablesService: TablesService) {}

  @Get()
  findAll() {
    return this.tablesService.findAllWithPlayerCount();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.tablesService.findById(id);
  }

  @Post()
  @Roles('admin', 'manager')
  create(@Body() dto: CreateTableDto) {
    return this.tablesService.create(dto);
  }
}
