import { IsISO8601 } from 'class-validator';

export class MetricsQueryDto {
  @IsISO8601()
  startDate!: string;

  @IsISO8601()
  endDate!: string;
}
