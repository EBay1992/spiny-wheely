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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { UpdateGameConfigDto } from '../game-config/dto/update-game-config.dto';
import { WheelService } from '../games/wheel/wheel.service';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { MetricsQueryDto } from './dto/metrics-query.dto';
import { SimulateWheelDto } from './dto/simulate-wheel.dto';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
    private readonly wheelService: WheelService,
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

  /** Manual QA: resolve wheel outcome from dragged ring rotations (no wallet debit). */
  @UseGuards(AdminJwtGuard)
  @Get('wheel/preview')
  getWheelPreview() {
    return this.wheelService.getPreview();
  }

  @UseGuards(AdminJwtGuard)
  @Post('wheel/simulate')
  simulateWheel(
    @CurrentUser() admin: AuthenticatedUser,
    @Body() dto: SimulateWheelDto,
  ) {
    return this.wheelService.simulateFromRotations(
      dto.wagerAmount,
      dto.smallRotation,
      dto.middleRotation,
      dto.bigRotation,
      admin.userId,
    );
  }
}
