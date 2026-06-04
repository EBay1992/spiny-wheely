import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { UpdateGameConfigDto } from '../game-config/dto/update-game-config.dto';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { MetricsQueryDto } from './dto/metrics-query.dto';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
  ) {}

  @Post('auth/login')
  login(@Body() dto: AdminLoginDto) {
    return this.authService.loginAdmin(dto.email, dto.password);
  }

  @UseGuards(AdminJwtGuard)
  @Get('metrics')
  getMetrics(@Query() query: MetricsQueryDto) {
    return this.adminService.getPlatformMetrics(
      query.startDate,
      query.endDate,
    );
  }

  @UseGuards(AdminJwtGuard)
  @Get('games/config')
  getGameConfigurations() {
    return this.adminService.getGameConfigurations();
  }

  @UseGuards(AdminJwtGuard)
  @Patch('games/config/:id')
  updateGameConfiguration(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGameConfigDto,
  ) {
    return this.adminService.updateGameConfiguration(id, dto);
  }
}
