import { IndicatorBoardMetadata, IndicatorInfo } from '../../../domain/indicator-board-metadata';
import { IndicatorBoardMetadataCountShouldNotExceedLimitRule } from '../../../domain/rule/IndicatorBoardMetadataCountShouldNotExceedLimit.rule';
import { BusinessRuleValidationException } from '../../../../commons/domain/business-rule-validation.exception';
import { IndicatorBoardMetadataNameShouldNotEmptyRule } from '../../../domain/rule/IndicatorBoardMetadataNameShouldNotEmpty.rule';
import { IndicatorInIndicatorBoardMetadataShouldNotDuplicateRule } from '../../../domain/rule/IndicatorInIndicatorBoardMetadataShouldNotDuplicate.rule';
import { OnlyRegisteredIdCanBeRemovedRule } from '../../../domain/rule/OnlyRegisteredIdCanBeRemoved.rule';
import { IndicatorIdInSectionsShouldBeInIndicatorRule } from '../../../domain/rule/IndicatorIdInSectionsShouldBeInIndicator.rule';

function getIdsFromIndicatorInfos(indicatorInfos: IndicatorInfo[]): string[] {
  return indicatorInfos.map((indicatorInfo) => {
    return indicatorInfo.id;
  });
}

describe('지표보드 메타데이터', () => {
  it('지표보드 메타데이터 도메인 생성', () => {
    // given
    const currentDate: Date = new Date();

    // when
    const indicatorBoardMetadata = IndicatorBoardMetadata.createNew('메타 데이터');

    // then
    const expected = new IndicatorBoardMetadata(
      null,
      '메타 데이터',
      [],
      [],
      { section1: [] },
      currentDate,
      currentDate,
    );
    expect(expected.indicatorBoardMetadataName).toEqual(indicatorBoardMetadata.indicatorBoardMetadataName);
  });

  it('지표보드 메타데이터에 새로운 지표 id 추가', () => {
    // given
    const indicatorBoardMetadata = IndicatorBoardMetadata.createNew('name');
    const indicatorId = '160e5499-4925-4e38-bb00-8ea6d8056484';
    const indicatorInfo: IndicatorInfo = {
      id: indicatorId,
      symbol: 'AAPL',
      indicatorType: 'stocks',
      name: 'Apple Inc',
      exchange: 'NASDAQ',
    };

    // when
    indicatorBoardMetadata.insertIndicatorId(indicatorInfo);

    // then
    const expected = ['160e5499-4925-4e38-bb00-8ea6d8056484'];
    expect(expected.toString()).toEqual(indicatorBoardMetadata.indicatorInfos[0].id.toString());
    const expectedSectionsLength = 1;
    expect(Object.values(indicatorBoardMetadata.sections).reduce((acc, values) => acc + values.length, 0)).toEqual(
      expectedSectionsLength,
    );
  });

  it('지표보드 메타데이터의 id 개수는 최대 5개를 넘을 수 없다.', () => {
    //given
    const currentDate: Date = new Date();
    const indicatorBoardMetadata = new IndicatorBoardMetadata(
      'id1',
      'name',
      [
        {
          id: 'indicatorId1',
          symbol: 'AAPL',
          indicatorType: 'stocks',
          name: 'Apple Inc',
          exchange: 'NASDAQ',
        },
        {
          id: 'indicatorId2',
          symbol: 'AAPL',
          indicatorType: 'stocks',
          name: 'Advance Auto Parts Inc',
          exchange: 'NYSE',
        },
      ],
      ['customForecastIndicatorId3', 'customForecastIndicatorId4', 'customForecastIndicatorId5'],
      {
        section1: [
          'indicatorId1',
          'indicatorId2',
          'customForecastIndicatorId3',
          'customForecastIndicatorId4',
          'customForecastIndicatorId5',
        ],
      },
      currentDate,
      currentDate,
    );
    const indicatorId = 'indicatorId6';
    const indicatorInfo: IndicatorInfo = {
      id: indicatorId,
      symbol: 'AAPL',
      indicatorType: 'stocks',
      name: 'Apple Inc',
      exchange: 'NASDAQ',
    };

    //when
    function insertIndicatorId() {
      indicatorBoardMetadata.insertIndicatorId(indicatorInfo);
    }
    const rule = new IndicatorBoardMetadataCountShouldNotExceedLimitRule(indicatorBoardMetadata.sections);

    //then
    expect(insertIndicatorId).toThrow(BusinessRuleValidationException);
    expect(insertIndicatorId).toThrow(rule.Message);
  });

  it('지표보드 메타데이터의 지표 id는 중복될 수 없다.', () => {
    //given
    const currentDate: Date = new Date();
    const indicatorBoardMetadata = new IndicatorBoardMetadata(
      'id2',
      'name',
      [
        {
          id: 'indicatorId1',
          symbol: 'AAPL',
          indicatorType: 'stocks',
          name: 'Apple Inc',
          exchange: 'NASDAQ',
        },
        {
          id: 'indicatorId2',
          symbol: 'AAPL',
          indicatorType: 'stocks',
          name: 'Advance Auto Parts Inc',
          exchange: 'NYSE',
        },
      ],

      ['customForecastIndicatorId3', 'customForecastIndicatorId4'],
      {
        section1: ['indicatorId1', 'indicatorId2', 'customForecastIndicatorId3', 'customForecastIndicatorId4'],
      },
      currentDate,
      currentDate,
    );
    const indicatorId = 'indicatorId1';
    const indicatorInfo: IndicatorInfo = {
      id: indicatorId,
      symbol: 'AAPL',
      indicatorType: 'stocks',
      name: 'Apple Inc',
      exchange: 'NASDAQ',
    };

    //when
    function insertIndicatorId() {
      indicatorBoardMetadata.insertIndicatorId(indicatorInfo);
    }
    const rule = new IndicatorInIndicatorBoardMetadataShouldNotDuplicateRule(
      getIdsFromIndicatorInfos(indicatorBoardMetadata.indicatorInfos),
    );

    //then
    expect(insertIndicatorId).toThrow(BusinessRuleValidationException);
    expect(insertIndicatorId).toThrow(rule.Message);
  });

  it('지표보드 메타데이터에 예측지표 id추가', () => {
    // given
    const currentDate: Date = new Date();
    const indicatorBoardMetadata = new IndicatorBoardMetadata(
      'id2',
      'name',
      [
        {
          id: 'indicatorId1',
          symbol: 'AAPL',
          indicatorType: 'stocks',
          name: 'Apple Inc',
          exchange: 'NASDAQ',
        },
        {
          id: 'indicatorId2',
          symbol: 'AAPL',
          indicatorType: 'stocks',
          name: 'Advance Auto Parts Inc',
          exchange: 'NYSE',
        },
      ],
      ['customForecastIndicatorId3', 'customForecastIndicatorId4'],
      {
        section1: ['indicatorId1', 'indicatorId2', 'customForecastIndicatorId3', 'customForecastIndicatorId4'],
      },
      currentDate,
      currentDate,
    );
    const customForecastIndicatorId = 'customForecastIndicatorId5';

    // when
    indicatorBoardMetadata.insertCustomForecastIndicatorId(customForecastIndicatorId);

    // then
    const expectedListLength = 3;
    expect(indicatorBoardMetadata.customForecastIndicatorIds.length).toEqual(expectedListLength);
    const expectedSectionsLength = 5;
    expect(Object.values(indicatorBoardMetadata.sections).reduce((acc, values) => acc + values.length, 0)).toEqual(
      expectedSectionsLength,
    );
  });

  it('메타데이터에 예측지표를 추가할 경우 이미 존재하는 예측지표는 추가할 수 없다.', () => {
    // given
    const currentDate: Date = new Date();
    const indicatorBoardMetadata = new IndicatorBoardMetadata(
      'id2',
      'name',
      [
        {
          id: 'indicatorId1',
          symbol: 'AAPL',
          indicatorType: 'stocks',
          name: 'Apple Inc',
          exchange: 'NASDAQ',
        },
        {
          id: 'indicatorId2',
          symbol: 'AAPL',
          indicatorType: 'stocks',
          name: 'Advance Auto Parts Inc',
          exchange: 'NYSE',
        },
      ],
      ['customForecastIndicatorId3', 'customForecastIndicatorId4'],
      {
        section1: ['indicatorId1', 'indicatorId2', 'customForecastIndicatorId3', 'customForecastIndicatorId4'],
      },
      currentDate,
      currentDate,
    );
    const customForecastIndicatorId = 'customForecastIndicatorId4';

    // when
    function insertCustomForecastIndicatorId() {
      indicatorBoardMetadata.insertCustomForecastIndicatorId(customForecastIndicatorId);
    }
    const rule = new IndicatorInIndicatorBoardMetadataShouldNotDuplicateRule(
      indicatorBoardMetadata.customForecastIndicatorIds,
    );

    // then
    expect(insertCustomForecastIndicatorId).toThrow(BusinessRuleValidationException);
    expect(insertCustomForecastIndicatorId).toThrow(rule.Message);
  });

  it('지표보드 메타데이터의 이름은 비워질 수 없다. (빈 문자열인 경우)', () => {
    //given
    const content = '';

    //when
    function createNewIndicator() {
      IndicatorBoardMetadata.createNew(content);
    }
    const rule = new IndicatorBoardMetadataNameShouldNotEmptyRule(content);

    //then
    expect(createNewIndicator).toThrow(BusinessRuleValidationException);
    expect(createNewIndicator).toThrow(rule.Message);
  });

  it('지표보드 메타데이터의 이름은 비워질 수 없다. (공백으로만 작성한 경우)', () => {
    //given
    const content = '   ';

    //when
    function createNewIndicator() {
      IndicatorBoardMetadata.createNew(content);
    }
    const rule = new IndicatorBoardMetadataNameShouldNotEmptyRule(content);

    //then
    expect(createNewIndicator).toThrow(BusinessRuleValidationException);
    expect(createNewIndicator).toThrow(rule.Message);
  });

  it('지표보드 메타데이터에서 지표 id 삭제', () => {
    // given
    const currentDate: Date = new Date();
    const indicatorBoardMetadata = new IndicatorBoardMetadata(
      'id1',
      'name',
      [
        {
          id: 'indicatorId1',
          symbol: 'AAPL',
          indicatorType: 'stocks',
          name: 'Apple Inc',
          exchange: 'NASDAQ',
        },
        {
          id: 'indicatorId2',
          symbol: 'AAPL',
          indicatorType: 'stocks',
          name: 'Advance Auto Parts Inc',
          exchange: 'NYSE',
        },
      ],
      ['customForecastIndicatorId3', 'customForecastIndicatorId4'],
      {
        section1: ['indicatorId1', 'indicatorId2', 'customForecastIndicatorId3', 'customForecastIndicatorId4'],
      },
      currentDate,
      currentDate,
    );
    const indicatorId = 'indicatorId1';

    // when
    indicatorBoardMetadata.deleteIndicatorId(indicatorId);

    // then
    const expected = [
      {
        id: 'indicatorId2',
        symbol: 'AAPL',
        indicatorType: 'stocks',
        name: 'Advance Auto Parts Inc',
        exchange: 'NYSE',
      },
    ];
    expect(expected).toEqual(indicatorBoardMetadata.indicatorInfos);
    const expectedSectionsLength = 3;
    expect(Object.values(indicatorBoardMetadata.sections).reduce((acc, values) => acc + values.length, 0)).toEqual(
      expectedSectionsLength,
    );
  });

  it('지표보드 메타데이터에서 지표 id 삭제 - 등록되지 않은 지표 요청', () => {
    // given
    const currentDate: Date = new Date();
    const indicatorBoardMetadata = new IndicatorBoardMetadata(
      'id1',
      'name',
      [
        {
          id: 'indicatorId1',
          symbol: 'AAPL',
          indicatorType: 'stocks',
          name: 'Apple Inc',
          exchange: 'NASDAQ',
        },
        {
          id: 'indicatorId2',
          symbol: 'AAPL',
          indicatorType: 'stocks',
          name: 'Advance Auto Parts Inc',
          exchange: 'NYSE',
        },
      ],
      ['customForecastIndicatorId3', 'customForecastIndicatorId4'],
      {
        section1: ['indicatorId1', 'indicatorId2', 'customForecastIndicatorId3', 'customForecastIndicatorId4'],
      },
      currentDate,
      currentDate,
    );
    const invalidIndicatorId = 'invalidId';

    // when
    function deleteIndicatorId() {
      indicatorBoardMetadata.deleteIndicatorId(invalidIndicatorId);
    }
    const rule = new OnlyRegisteredIdCanBeRemovedRule(
      getIdsFromIndicatorInfos(indicatorBoardMetadata.indicatorInfos),
      invalidIndicatorId,
    );

    //then
    expect(deleteIndicatorId).toThrow(BusinessRuleValidationException);
    expect(deleteIndicatorId).toThrow(rule.Message);
  });

  it('지표보드 메타데이터의 이름을 수정한다. ', () => {
    // given
    const currentDate: Date = new Date();
    const indicatorBoardMetadata = new IndicatorBoardMetadata(
      'id1',
      'name',
      [
        {
          id: 'indicatorId1',
          symbol: 'AAPL',
          indicatorType: 'stocks',
          name: 'Apple Inc',
          exchange: 'NASDAQ',
        },
        {
          id: 'indicatorId2',
          symbol: 'AAPL',
          indicatorType: 'stocks',
          name: 'Advance Auto Parts Inc',
          exchange: 'NYSE',
        },
      ],
      ['customForecastIndicatorId3', 'customForecastIndicatorId4'],
      {
        section1: ['indicatorId1', 'indicatorId2', 'customForecastIndicatorId3', 'customForecastIndicatorId4'],
      },
      currentDate,
      currentDate,
    );

    // when
    indicatorBoardMetadata.updateIndicatorBoardMetadataName('updateName');
    const expected = 'updateName';

    //then
    expect(expected).toEqual(indicatorBoardMetadata.indicatorBoardMetadataName);
  });

  it('지표보드 메타데이터의 이름을 수정한다. - 이름이 비어있을 때 ', () => {
    // given
    const currentDate: Date = new Date();
    const indicatorBoardMetadata = new IndicatorBoardMetadata(
      'id1',
      'name',
      [
        {
          id: 'indicatorId1',
          symbol: 'AAPL',
          indicatorType: 'stocks',
          name: 'Apple Inc',
          exchange: 'NASDAQ',
        },
        {
          id: 'indicatorId2',
          symbol: 'AAPL',
          indicatorType: 'stocks',
          name: 'Advance Auto Parts Inc',
          exchange: 'NYSE',
        },
      ],
      ['customForecastIndicatorId3', 'customForecastIndicatorId4'],
      {
        section1: ['indicatorId1', 'indicatorId2', 'customForecastIndicatorId3', 'customForecastIndicatorId4'],
      },
      currentDate,
      currentDate,
    );
    const invalidName = '';

    // when
    function updateIndicatorBoardMetadataName() {
      indicatorBoardMetadata.updateIndicatorBoardMetadataName(invalidName);
    }
    const rule = new IndicatorBoardMetadataNameShouldNotEmptyRule(invalidName);

    //then
    expect(updateIndicatorBoardMetadataName).toThrow(BusinessRuleValidationException);
    expect(updateIndicatorBoardMetadataName).toThrow(rule.Message);
  });

  it('지표보드 메타데이터에서 예측 지표 id 삭제', () => {
    // given
    const currentDate: Date = new Date();
    const indicatorBoardMetadata = new IndicatorBoardMetadata(
      'id1',
      'name',
      [
        {
          id: 'indicatorId1',
          symbol: 'AAPL',
          indicatorType: 'stocks',
          name: 'Apple Inc',
          exchange: 'NASDAQ',
        },
        {
          id: 'indicatorId2',
          symbol: 'AAPL',
          indicatorType: 'stocks',
          name: 'Advance Auto Parts Inc',
          exchange: 'NYSE',
        },
      ],
      ['customForecastIndicatorId3', 'customForecastIndicatorId5'],
      {
        section1: ['indicatorId1', 'indicatorId2', 'customForecastIndicatorId3', 'customForecastIndicatorId5'],
      },
      currentDate,
      currentDate,
    );
    const customForecastIndicatorId = 'customForecastIndicatorId5';

    // when
    indicatorBoardMetadata.deleteCustomForecastIndicatorId(customForecastIndicatorId);
    const expected = ['customForecastIndicatorId3'];

    expect(expected).toEqual(indicatorBoardMetadata.customForecastIndicatorIds);
    const expectedSectionsLength = 3;
    expect(Object.values(indicatorBoardMetadata.sections).reduce((acc, values) => acc + values.length, 0)).toEqual(
      expectedSectionsLength,
    );
  });

  it('지표보드 메타데이터에서 예측 지표 id 삭제 - 등록되지 않은 지표 요청', () => {
    // given
    const currentDate: Date = new Date();
    const indicatorBoardMetadata = new IndicatorBoardMetadata(
      'id2',
      'name',
      [
        {
          id: 'indicatorId1',
          symbol: 'AAPL',
          indicatorType: 'stocks',
          name: 'Apple Inc',
          exchange: 'NASDAQ',
        },
        {
          id: 'indicatorId2',
          symbol: 'AAPL',
          indicatorType: 'stocks',
          name: 'Advance Auto Parts Inc',
          exchange: 'NYSE',
        },
      ],
      ['customForecastIndicatorId3', 'customForecastIndicatorId4'],
      {
        section1: ['indicatorId1', 'indicatorId2', 'customForecastIndicatorId3', 'customForecastIndicatorId4'],
      },
      currentDate,
      currentDate,
    );
    const invalidCustomForecastIndicatorId = 'invalidCustomForecastIndicatorId';

    // when
    function deleteIndicatorId() {
      indicatorBoardMetadata.deleteIndicatorId(invalidCustomForecastIndicatorId);
    }
    const rule = new OnlyRegisteredIdCanBeRemovedRule(
      indicatorBoardMetadata.customForecastIndicatorIds,
      invalidCustomForecastIndicatorId,
    );

    //then
    expect(deleteIndicatorId).toThrow(BusinessRuleValidationException);
    expect(deleteIndicatorId).toThrow(rule.Message);
  });

  it('지표보드 메타데이터에서 축(section)을 변경', () => {
    // given
    const currentDate: Date = new Date();
    const indicatorBoardMetadata = new IndicatorBoardMetadata(
      'id1',
      'name',
      [
        {
          id: 'indicatorId1',
          symbol: 'AAPL',
          indicatorType: 'stocks',
          name: 'Apple Inc',
          exchange: 'NASDAQ',
        },
        {
          id: 'indicatorId2',
          symbol: 'AAPL',
          indicatorType: 'stocks',
          name: 'Advance Auto Parts Inc',
          exchange: 'NYSE',
        },
      ],
      ['customForecastIndicatorId3', 'customForecastIndicatorId5'],
      {
        section1: ['indicatorId1', 'indicatorId2', 'customForecastIndicatorId3', 'customForecastIndicatorId5'],
      },
      currentDate,
      currentDate,
    );
    const updatedSections = {
      section1: ['indicatorId1', 'indicatorId2'],
      section2: ['customForecastIndicatorId3', 'customForecastIndicatorId5'],
    };

    // when
    indicatorBoardMetadata.updateSections(updatedSections);
    const expected = updatedSections;

    expect(expected).toEqual(indicatorBoardMetadata.sections);
  });

  it('지표보드 메타데이터에서 축(section)을 변경 - 지표 값과 sections 값 불일치', () => {
    // given
    const currentDate: Date = new Date();
    const indicatorBoardMetadata = new IndicatorBoardMetadata(
      'id1',
      'name',
      [
        {
          id: 'indicatorId1',
          symbol: 'AAPL',
          indicatorType: 'stocks',
          name: 'Apple Inc',
          exchange: 'NASDAQ',
        },
        {
          id: 'indicatorId2',
          symbol: 'AAPL',
          indicatorType: 'stocks',
          name: 'Advance Auto Parts Inc',
          exchange: 'NYSE',
        },
      ],
      ['customForecastIndicatorId3', 'customForecastIndicatorId5'],
      {
        section1: ['indicatorId1', 'indicatorId2', 'customForecastIndicatorId3', 'customForecastIndicatorId5'],
      },
      currentDate,
      currentDate,
    );
    const invalidSections = {
      section1: ['indicatorId2', 'invalid'],
      section2: ['customForecastIndicatorId3', 'customForecastIndicatorId5'],
    };

    // when
    function updateSections() {
      indicatorBoardMetadata.updateSections(invalidSections);
    }
    const rule = new IndicatorIdInSectionsShouldBeInIndicatorRule(
      getIdsFromIndicatorInfos(indicatorBoardMetadata.indicatorInfos),
      indicatorBoardMetadata.customForecastIndicatorIds,
      invalidSections,
    );

    //then
    expect(updateSections).toThrow(BusinessRuleValidationException);
    expect(updateSections).toThrow(rule.Message);
  });
});
