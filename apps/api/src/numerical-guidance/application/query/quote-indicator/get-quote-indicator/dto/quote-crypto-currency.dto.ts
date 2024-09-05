import { BaseQuoteIndicatorDto } from './base-quote-indicator.dto';
import { ApiProperty } from '@nestjs/swagger';

export class QuoteCryptoCurrencyDto extends BaseQuoteIndicatorDto {
  @ApiProperty({
    example: '2.74083',
    description: '1일 변화 (최근 1일 동안의 주가 변화량)',
  })
  rolling_1d_change: string;

  @ApiProperty({
    example: '-5.57656',
    description: '7일 변화 (최근 7일 동안의 주가 변화량)',
  })
  rolling_7d_change: string;

  @ApiProperty({
    example: '2.74083',
    description: '전체 변화 (어떤 기간 동안의 주가 변화량)',
  })
  rolling_change: string;

  static create(data: QuoteCryptoCurrencyDto): QuoteCryptoCurrencyDto {
    return Object.assign(new QuoteCryptoCurrencyDto(), data);
  }
}