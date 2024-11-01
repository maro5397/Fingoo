import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IndicatorEntity } from '../../../infrastructure/adapter/persistence/indicator/entity/indicator.entity';
import { UserMetadataEntity } from '../../../../user/infrastructure/adapter/persistence/entity/user-metadata.entity';
import { IndicatorBoardMetadataEntity } from '../../../infrastructure/adapter/persistence/indicator-board-metadata/entity/indicator-board-metadata.entity';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { Test } from '@nestjs/testing';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { IndicatorBoardMetadataController } from '../../../api/indicator-board-metadata/indicator-board-metadata.controller';
import { AdjustIndicatorValue } from '../../../util/adjust-indicator-value';
import { GetIndicatorBoardMetadataQueryHandler } from '../../../application/query/indicator-board-metadata/get-indicator-board-metadata/get-indicator-board-metadata.query.handler';
import { InsertIndicatorIdCommandHandler } from '../../../application/command/indicator/insert-indicator-id/insert-indicator-id.command.handler';
import { InsertCustomForecastIndicatorIdCommandHandler } from '../../../application/command/custom-forecast-indicator/insert-custom-forecast-indicator-id/insert-custom-forecast-indicator-id.command.handler';
import { GetIndicatorBoardMetadataListQueryHandler } from '../../../application/query/indicator-board-metadata/get-indicator-board-metadata-list/get-indicator-board-metadata-list.query.handler';
import { DeleteIndicatorIdCommandHandler } from '../../../application/command/indicator/delete-indicator-id/delete-indicator-id.command.handler';
import { DeleteIndicatorBoardMetadataCommandHandler } from '../../../application/command/indicator-board-metadata/delete-indicator-board-metadata/delete-indicator-board-metadata.command.handler';
import { UpdateIndicatorBoardMetadataNameCommandHandler } from '../../../application/command/indicator-board-metadata/update-indicator-board-metadata-name/update-indicator-board-metadata-name.command.handler';
import { IndicatorBoardMetadataPersistentAdapter } from '../../../infrastructure/adapter/persistence/indicator-board-metadata/indicator-board-metadata.persistent.adapter';
import { HttpExceptionFilter } from '../../../../commons/exception-filter/http-exception-filter';
import * as request from 'supertest';
import { DeleteCustomForecastIndicatorIdCommandHandler } from 'src/numerical-guidance/application/command/custom-forecast-indicator/delete-custom-forecast-indicator-id/delete-custom-forecast-indicator-id.command.handler';
import { FileSupabaseAdapter } from '../../../infrastructure/adapter/storage/supabase/file.supabase.adapter';
import { UploadFileCommandHandler } from '../../../application/command/indicator-board-metadata/upload-file/upload-file.command.handler';
import { UpdateSectionsCommandHandler } from '../../../application/command/indicator-board-metadata/update-sections/update-sections.command.handler';
import { IndicatorPersistentAdapter } from '../../../infrastructure/adapter/persistence/indicator/indicator.persistent.adapter';
import { BondsEntity } from '../../../infrastructure/adapter/persistence/indicator/entity/bonds.entity';
import { CryptoCurrenciesEntity } from '../../../infrastructure/adapter/persistence/indicator/entity/crypto-currencies.entity';
import { ETFEntity } from '../../../infrastructure/adapter/persistence/indicator/entity/etf.entity';
import { ForexPairEntity } from '../../../infrastructure/adapter/persistence/indicator/entity/forex-pair.entity';
import { FundEntity } from '../../../infrastructure/adapter/persistence/indicator/entity/fund.entity';
import { IndicesEntity } from '../../../infrastructure/adapter/persistence/indicator/entity/indices.entity';
import { StockEntity } from '../../../infrastructure/adapter/persistence/indicator/entity/stock.entity';
import { TwelveApiManager } from '../../../infrastructure/adapter/twelve/util/twelve-api.manager';
import { addTransactionalDataSource, initializeTransactionalContext } from 'typeorm-transactional';
import { EconomyEntity } from '../../../infrastructure/adapter/persistence/indicator/entity/economy.entity';
import { FredApiManager } from '../../../infrastructure/adapter/fred/util/fred-api.manager';
import { mockSessionIntegration } from '../../../../user/test/data/mock-user.integration';
import { mockSession1, mockUser1 } from '../../../../user/test/data/mock-user.user1';
import { of } from 'rxjs';
import { MockAuthGuard } from '../../../../user/test/data/mock-auth.guard';
import { mockUserMetadataData1 } from '../../../../user/test/data/mock-user.metadata.data1';

initializeTransactionalContext();

describe('Indicator Board Metadata E2E Test', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let DBenvironment;
  let fileSupabaseAdapter: FileSupabaseAdapter;

  const seeding = async () => {
    const userMetadataEntityRepository = dataSource.getRepository(UserMetadataEntity);
    await userMetadataEntityRepository.insert(mockUserMetadataData1);

    const indicatorBoardMetadataRepository = dataSource.getRepository(IndicatorBoardMetadataEntity);
    await indicatorBoardMetadataRepository.insert({
      id: '0d73cea1-35a5-432f-bcd1-27ae3541ba60',
      indicatorBoardMetadataName: 'name',
      indicatorInfos: [
        {
          id: 'a79eface-1fd3-4b85-92ae-9628d37951fb',
          indicatorType: 'stocks',
          name: 'Apple Inc',
          exchange: 'NASDAQ',
        },
      ],
      customForecastIndicatorIds: ['customForecastIndicatorId1'],
      sections: { section1: ['a79eface-1fd3-4b85-92ae-9628d37951fb', 'customForecastIndicatorId1'] },
      member: mockUserMetadataData1,
    });

    await indicatorBoardMetadataRepository.insert({
      id: '0d73cea1-35a5-432f-bcd1-27ae3541ba77',
      indicatorBoardMetadataName: '삭제용 indicatorBoardMetadata',
      indicatorInfos: [
        {
          id: 'a79eface-1fd3-4b85-92ae-9628d37951fa',
          indicatorType: 'stocks',
          name: 'Apple Inc',
          exchange: 'NASDAQ',
        },
      ],
      customForecastIndicatorIds: ['customForecastIndicatorId1'],
      sections: { section1: ['a79eface-1fd3-4b85-92ae-9628d37951fa', 'customForecastIndicatorId1'] },
      member: mockUserMetadataData1,
    });

    const stockRepository = dataSource.getRepository(StockEntity);
    await stockRepository.insert([
      {
        id: 'a79eface-1fd3-4b85-92ae-9628d37951fa',
        index: 1,
        symbol: 'AAPL',
        indicatorType: 'stocks',
        name: 'Apple Inc',
        currency: 'USD',
        exchange: 'NASDAQ',
        mic_code: 'XNGS',
        country: 'United States',
        type: 'Common Stock',
      },
      {
        id: 'a79eface-1fd3-4b85-92ae-9628d37951fb',
        index: 2,
        symbol: 'AAPL',
        indicatorType: 'stocks',
        name: 'Apple Inc',
        currency: 'USD',
        exchange: 'NASDAQ',
        mic_code: 'XNGS',
        country: 'United States',
        type: 'Common Stock',
      },
    ]);
  };

  beforeAll(async () => {
    DBenvironment = await new PostgreSqlContainer().start();
    const [module] = await Promise.all([
      Test.createTestingModule({
        imports: [
          CqrsModule,
          ConfigModule.forRoot({
            isGlobal: true,
          }),
          TypeOrmModule.forFeature([
            UserMetadataEntity,
            IndicatorBoardMetadataEntity,
            BondsEntity,
            CryptoCurrenciesEntity,
            ETFEntity,
            ForexPairEntity,
            FundEntity,
            IndicesEntity,
            StockEntity,
            EconomyEntity,
          ]),
          TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: () => ({
              type: 'postgres',
              retryAttempts: 20,
              retryDelay: 5000,
              host: DBenvironment.getHost(),
              port: DBenvironment.getPort(),
              username: DBenvironment.getUsername(),
              password: DBenvironment.getPassword(),
              database: DBenvironment.getDatabase(),
              entities: [
                IndicatorBoardMetadataEntity,
                UserMetadataEntity,
                IndicatorEntity,
                BondsEntity,
                CryptoCurrenciesEntity,
                ETFEntity,
                ForexPairEntity,
                FundEntity,
                IndicesEntity,
                StockEntity,
                EconomyEntity,
              ],
              synchronize: true,
            }),
          }),
          HttpModule.registerAsync({
            useFactory: () => ({
              timeout: 10000,
              maxRedirects: 5,
            }),
          }),
        ],
        controllers: [IndicatorBoardMetadataController],
        providers: [
          TwelveApiManager,
          FredApiManager,
          AdjustIndicatorValue,
          GetIndicatorBoardMetadataQueryHandler,
          InsertIndicatorIdCommandHandler,
          InsertCustomForecastIndicatorIdCommandHandler,
          GetIndicatorBoardMetadataListQueryHandler,
          DeleteIndicatorIdCommandHandler,
          DeleteIndicatorBoardMetadataCommandHandler,
          UpdateIndicatorBoardMetadataNameCommandHandler,
          DeleteCustomForecastIndicatorIdCommandHandler,
          UploadFileCommandHandler,
          UpdateSectionsCommandHandler,
          FileSupabaseAdapter,
          {
            provide: 'CreateIndicatorBoardMetadataPort',
            useClass: IndicatorBoardMetadataPersistentAdapter,
          },
          {
            provide: 'LoadIndicatorBoardMetadataPort',
            useClass: IndicatorBoardMetadataPersistentAdapter,
          },
          {
            provide: 'InsertIndicatorIdPort',
            useClass: IndicatorBoardMetadataPersistentAdapter,
          },
          {
            provide: 'InsertCustomForecastIndicatorIdPort',
            useClass: IndicatorBoardMetadataPersistentAdapter,
          },
          {
            provide: 'LoadIndicatorBoardMetadataListPort',
            useClass: IndicatorBoardMetadataPersistentAdapter,
          },
          {
            provide: 'DeleteIndicatorIdPort',
            useClass: IndicatorBoardMetadataPersistentAdapter,
          },
          {
            provide: 'DeleteIndicatorBoardMetadataPort',
            useClass: IndicatorBoardMetadataPersistentAdapter,
          },
          {
            provide: 'UpdateIndicatorBoardMetadataNamePort',
            useClass: IndicatorBoardMetadataPersistentAdapter,
          },
          {
            provide: 'DeleteCustomForecastIndicatorIdPort',
            useClass: IndicatorBoardMetadataPersistentAdapter,
          },
          {
            provide: 'UploadFilePort',
            useClass: FileSupabaseAdapter,
          },
          {
            provide: 'UpdateSectionsPort',
            useClass: IndicatorBoardMetadataPersistentAdapter,
          },
          {
            provide: 'LoadIndicatorPort',
            useClass: IndicatorPersistentAdapter,
          },
          {
            provide: MockAuthGuard,
            useValue: {
              canActivate: jest.fn().mockImplementation((context) => {
                const request = context.switchToHttp().getRequest();
                request.user = mockUser1;
                request.headers.authorization = mockSession1;
                return of(true);
              }),
            },
          },
        ],
      }).compile(),
    ]);
    fileSupabaseAdapter = module.get(FileSupabaseAdapter);
    dataSource = module.get<DataSource>(DataSource);
    addTransactionalDataSource(dataSource);
    await seeding();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        disableErrorMessages: false,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalGuards(new MockAuthGuard());
    await app.init();
  }, 30000);

  afterAll(async () => {
    await DBenvironment.stop();
    await app.close();
  });

  it('/get 메타데이터 id를 전송해서 id에 해당하는 메타데이터를 가져온다.', async () => {
    return request(app.getHttpServer())
      .get(`/api/numerical-guidance/indicator-board-metadata/0d73cea1-35a5-432f-bcd1-27ae3541ba60`)
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.OK);
  });

  it('/get db에 존재하지않는 메타데이터 id를 전송한다.', async () => {
    return request(app.getHttpServer())
      .get('/api/numerical-guidance/indicator-board-metadata/0d73cea1-35a5-432f-bcd1-27ae3541ba22')
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.NOT_FOUND);
  });

  it('/post 지표보드 메타데이터에 새로운 지표를 추가한다.', async () => {
    return request(app.getHttpServer())
      .post(`/api/numerical-guidance/indicator-board-metadata/0d73cea1-35a5-432f-bcd1-27ae3541ba60`)
      .send({
        indicatorId: 'a79eface-1fd3-4b85-92ae-9628d37951fa',
        indicatorType: 'stocks',
      })
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.CREATED);
  });

  it('/post 지표보드 메타데이터에 새로운 지표를 추가할 때 중복 데이터를 넣는다', async () => {
    return request(app.getHttpServer())
      .post(`/api/numerical-guidance/indicator-board-metadata/0d73cea1-35a5-432f-bcd1-27ae3541ba60`)
      .send({
        indicatorId: 'a79eface-1fd3-4b85-92ae-9628d37951fb',
        indicatorType: 'stocks',
      })
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('/get 사용자 id를 전송하여 메타데이터 리스트를 가져온다.', async () => {
    return request(app.getHttpServer())
      .get('/api/numerical-guidance/indicator-board-metadata')
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer ' + mockSessionIntegration.access_token)
      .expect(HttpStatus.OK);
  });

  it('/delete 지표보드 메타데이터에서 지표를 삭제한다.', async () => {
    return request(app.getHttpServer())
      .delete(
        '/api/numerical-guidance/indicator-board-metadata/0d73cea1-35a5-432f-bcd1-27ae3541ba60/indicator/a79eface-1fd3-4b85-92ae-9628d37951fb',
      )
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.OK);
  });

  it('/delete 지표보드 메타데이터에서 지표를 삭제할 때, indicatorIds 에 존재하지 않는 값을 요청한다.', async () => {
    return request(app.getHttpServer())
      .delete(
        `/api/numerical-guidance/indicator-board-metadata/0d73cea1-35a5-432f-bcd1-27ae3541ba60/indicator/invalidId`,
      )
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('/delete 지표보드 메타데이터에서 지표를 삭제할 때, 존재하지 않는 지표보드 메타데이터를 요청한다.', async () => {
    return request(app.getHttpServer())
      .delete(`/api/numerical-guidance/indicator-board-metadata/e46240d3-7d15-48e7-a9b7-f490bf9ca6e0/indicator/ticker1`)
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.NOT_FOUND);
  });

  it('/delete 지표보드 메타데이터를 삭제한다.', async () => {
    return request(app.getHttpServer())
      .delete(`/api/numerical-guidance/indicator-board-metadata/0d73cea1-35a5-432f-bcd1-27ae3541ba77`)
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.OK);
  });

  it('/delete 지표보드 메타데이터를 삭제할 때, 존재하지 않는 id를 요청한다.', async () => {
    return request(app.getHttpServer())
      .delete(`/api/numerical-guidance/indicator-board-metadata/e46240d3-7d15-48e7-a9b7-f490bf9ca6e0`)
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.NOT_FOUND);
  });

  it('/patch 지표보드 메타데이터의 이름을 수정한다.', async () => {
    return request(app.getHttpServer())
      .patch(`/api/numerical-guidance/indicator-board-metadata/0d73cea1-35a5-432f-bcd1-27ae3541ba60`)
      .send({
        name: 'updateName',
      })
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.OK);
  });

  it('/patch 지표보드 메타데이터의 이름을 수정할 때, 이름이 빈값으로 들어온다.', async () => {
    return request(app.getHttpServer())
      .patch(`/api/numerical-guidance/indicator-board-metadata/0d73cea1-35a5-432f-bcd1-27ae3541ba60`)
      .send({
        name: '',
      })
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('/post 지표보드 메타데이터에 새로운 예측지표를 추가한다.', async () => {
    return request(app.getHttpServer())
      .post(
        '/api/numerical-guidance/indicator-board-metadata/custom-forecast-indicator/0d73cea1-35a5-432f-bcd1-27ae3541ba60',
      )
      .send({
        customForecastIndicatorId: 'a1e019be-19f4-473b-9a02-d86d65eebab0',
      })
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.CREATED);
  });

  it('/post 지표보드 메타데이터에 새로운 예측지표를 추가한다. - db에 메타데이터 id가 존재하지 않을 경우', async () => {
    return request(app.getHttpServer())
      .post(
        '/api/numerical-guidance/indicator-board-metadata/custom-forecast-indicator/0d73cea1-35a5-432f-bcd1-27ae3541ba00',
      )
      .send({
        customForecastIndicatorId: 'a1e019be-19f4-473b-9a02-d86d65eebab0',
      })
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.NOT_FOUND);
  });

  it('/post 지표보드 메타데이터에 새로운 예측지표를 추가한다. - 중복 데이터를 집어놓을 경우', async () => {
    return request(app.getHttpServer())
      .post(
        '/api/numerical-guidance/indicator-board-metadata/custom-forecast-indicator/0d73cea1-35a5-432f-bcd1-27ae3541ba60',
      )
      .send({
        customForecastIndicatorId: "'customForecastIndicatorId1'",
      })
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('/delete 지표보드 메타데이터에 예측지표 id를 삭제한다.', async () => {
    return request(app.getHttpServer())
      .delete(
        '/api/numerical-guidance/indicator-board-metadata/0d73cea1-35a5-432f-bcd1-27ae3541ba60/custom-forecast-indicator/a1e019be-19f4-473b-9a02-d86d65eebab0',
      )
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.OK);
  });

  it('/delete 지표보드 메타데이터에 예측지표 id를 삭제한다. - 메타데이터가 가지고있지 않은 예측지표id를 삭제한다.', async () => {
    return request(app.getHttpServer())
      .delete(
        '/api/numerical-guidance/indicator-board-metadata/0d73cea1-35a5-432f-bcd1-27ae3541ba60/custom-forecast-indicator/a1e019be-19f4-473b-9a02-d86d65eeba99',
      )
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('/delete 지표보드 메타데이터에 예측지표 id를 삭제한다. - DB에 존재하지 않는 메타데이터를 요청한다.', async () => {
    return request(app.getHttpServer())
      .delete(
        '/api/numerical-guidance/indicator-board-metadata/0d73cea1-35a5-432f-bcd1-27ae3541ba77/custom-forecast-indicator/a1e019be-19f4-473b-9a02-d86d65eebab0',
      )
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.NOT_FOUND);
  });

  it('/post 파일을 업로드한다.', async () => {
    const imagePath = './src/numerical-guidance/test/data/test-file.png';

    const response = request(app.getHttpServer())
      .post('/api/numerical-guidance/indicator-board-metadata/file/upload')
      .set('Content-Type', 'multipart/form-data')
      .attach('fileName', imagePath);
    response.expect(HttpStatus.CREATED);

    await fileSupabaseAdapter.deleteFile('indicatorBoardMetadata/test-file.png');
  });

  it('/post 파일을 업로드한다. - 빈 파일을 보내는 경우', async () => {
    return request(app.getHttpServer())
      .post('/api/numerical-guidance/indicator-board-metadata/file/upload')
      .set('Content-Type', 'multipart/form-data')
      .attach('fileName', null)
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('/patch 축(section)을 변경한다.', async () => {
    return request(app.getHttpServer())
      .patch(`/api/numerical-guidance/indicator-board-metadata/0d73cea1-35a5-432f-bcd1-27ae3541ba60/sections`)
      .send({
        sections: {
          section1: ['a79eface-1fd3-4b85-92ae-9628d37951fa'],
          section2: ['customForecastIndicatorId1'],
        },
      })
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.OK);
  });

  it('/patch 축(section)을 변경한다. - 빈 section을 보내는 경우', async () => {
    return request(app.getHttpServer())
      .patch(`/api/numerical-guidance/indicator-board-metadata/0d73cea1-35a5-432f-bcd1-27ae3541ba60/sections`)
      .send({})
      .set('Content-Type', 'application/json')
      .expect(HttpStatus.BAD_REQUEST);
  });
});
