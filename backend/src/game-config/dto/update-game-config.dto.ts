import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import {
  MAX_TARGET_RTP,
  MIN_TARGET_RTP,
} from '../../common/constants/rtp.constants';
import { Volatility } from '../../common/enums/volatility.enum';

export class UpdateGameConfigDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(MIN_TARGET_RTP)
  @Max(MAX_TARGET_RTP)
  targetRtp?: number;

  @IsOptional()
  @IsEnum(Volatility)
  volatility?: Volatility;

  @IsOptional()
  @IsBoolean()
  isLive?: boolean;
}
