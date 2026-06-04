import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PlayerJwtGuard } from '../auth/guards/player-jwt.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { WagerHistoryQueryDto } from './dto/wager-history-query.dto';
import { PlayerLoginDto } from './dto/player-login.dto';
import { PlayerService } from './player.service';

@Controller('player')
export class PlayerController {
  constructor(
    private readonly playerService: PlayerService,
    private readonly authService: AuthService,
  ) {}

  @Post('auth/login')
  login(@Body() dto: PlayerLoginDto) {
    return this.authService.loginPlayer(dto.email, dto.password);
  }

  @UseGuards(PlayerJwtGuard)
  @Get('profile')
  getProfile(@CurrentUser() player: AuthenticatedUser) {
    return this.playerService.getProfile(player.userId);
  }

  @UseGuards(PlayerJwtGuard)
  @Get('wager-history')
  getWagerHistory(
    @CurrentUser() player: AuthenticatedUser,
    @Query() query: WagerHistoryQueryDto,
  ) {
    return this.playerService.getWagerHistory(
      player.userId,
      query.limit,
      query.cursor,
    );
  }
}
