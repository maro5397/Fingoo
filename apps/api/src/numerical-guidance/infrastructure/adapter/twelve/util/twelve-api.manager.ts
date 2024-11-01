import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { IndicatorType, Interval } from '../../../../../commons/type/type-definition';
import * as process from 'process';
import { QuoteIndicatorIntervalEnum } from '../../../../../commons/enum/enum-definition';

const BASE_URL = 'https://api.twelvedata.com';

@Injectable()
export class TwelveApiManager {
  constructor(private readonly api: HttpService) {}

  async getReferenceData(type: IndicatorType, country: string) {
    // TODO: 베타 이후 삭제 예정
    let requestUrl: string;
    if (type == 'funds') {
      requestUrl = `${BASE_URL}/${type}?country=${country}&exchange=NASDAQ`;
      const response = await this.api.axiosRef.get(requestUrl);
      return response.data;
    }
    requestUrl = `${BASE_URL}/${type}?country=${country}`;
    const response = await this.api.axiosRef.get(requestUrl);
    return response.data;
  }

  async searchSymbol(symbol: string) {
    const requestUrl: string = `${BASE_URL}/symbol_search/?symbol=${symbol}`;
    const response = await this.api.axiosRef.get(requestUrl);
    return response.data.data;
  }

  async getTimeSeries(symbol: string, interval: Interval, startDate: string, endDate: string) {
    try {
      const twelveInterval = this.convertIntervalToTwelveInterval(interval);
      const requestUrl: string = `${BASE_URL}/time_series/?symbol=${symbol}&interval=${twelveInterval}&start_date=${startDate}&end_date=${endDate}&apikey=${process.env.TWELVE_KEY}`;
      const response = await this.api.axiosRef.get(requestUrl);
      return this.checkTwelveException(response.data);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException({
          HttpStatus: HttpStatus.NOT_FOUND,
          error: `[ERROR] Twelve API response 값을 찾을 수 없습니다. (해당 지표는 현재 plan에서 사용할 수 없습니다.)`,
          message: '정보를 불러오는 중에 문제가 발생했습니다. 다시 시도해주세요.',
          cause: error,
        });
      }
    }
  }

  async getQuote(
    symbol: string,
    volumn_time_period: string,
    mic_code: string,
    eod: boolean,
    interval: QuoteIndicatorIntervalEnum,
    timezone: string,
  ) {
    try {
      const requestUrl: string = `${BASE_URL}/quote/?symbol=${symbol}&volumn_time_period=${volumn_time_period}&mic_code=${mic_code}&eod=${eod}&interval=${interval}&timezone=${timezone}&apikey=${process.env.TWELVE_KEY}`;
      console.log(requestUrl);
      const response = await this.api.axiosRef.get(requestUrl);
      return this.checkTwelveException(response.data);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException({
          HttpStatus: HttpStatus.NOT_FOUND,
          error: `[ERROR] Twelve API response 값을 찾을 수 없습니다. (해당 지표는 현재 plan에서 사용할 수 없습니다.)`,
          message: '정보를 불러오는 중에 문제가 발생했습니다. 다시 시도해주세요.',
          cause: error,
        });
      }
    }
  }

  private convertIntervalToTwelveInterval(interval: Interval): string {
    if (interval == 'month' || interval == 'year') {
      return '1month';
    }
    if (interval == 'day') {
      return '1day';
    }
    if (interval == 'week') {
      return '1week';
    }
  }
  private checkTwelveException(responseData: any): { values: [] } {
    if (responseData.code == 400) {
      const result: { values: [] } = { values: [] };
      return result;
    }
    if (responseData.code == 404) {
      throw new NotFoundException();
    }
    return responseData;
  }
}
