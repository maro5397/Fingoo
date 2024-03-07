import { AggregateRoot } from 'src/utils/domain/aggregate-root';
import { IndicatorBoardMetadataCountShouldNotExceedLimitRule } from './rule/IndicatorBoardMetadataCountShouldNotExceedLimit.rule';
import { IndicatorBoardMetadataNameShouldNotEmptyRule } from './rule/IndicatorBoardMetadataNameShouldNotEmpty.rule';
import { IndicatorInIndicatorBoardMetadataShouldNotDuplicateRule } from './rule/IndicatorInIndicatorBoardMetadataShouldNotDuplicate.rule';
import { OnlyRegisteredIdCanBeRemovedRule } from './rule/OnlyRegisteredIdCanBeRemoved.rule';
import { ApiProperty } from '@nestjs/swagger';

export class IndicatorBoardMetadata extends AggregateRoot {
  @ApiProperty({
    example: 'c6a99067-27d0-4358-b3d5-e63a64b604c0',
    description: '지표 보드 메티데이터 id',
  })
  readonly id: string;

  @ApiProperty({
    example: 'name',
    description: '지표 보드 메티데이터 name',
  })
  indicatorBoardMetadataName: string;

  @ApiProperty({
    example: ['c6a99067-27d0-4358-b3d5-e63a64b604c0', 'c6a99067-27d0-4358-b3d5-e63a64b604c3'],
    description: '지표 id 모음',
  })
  indicatorIds: string[];

  @ApiProperty({
    example: '2024-03-04T05:17:33.756Z',
    description: '지표 보드 메티데이터 생성일',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-03-04T05:17:33.756Z',
    description: '지표 보드 메티데이터 수정일',
  })
  updatedAt: Date;

  static createNew(indicatorBoardMetadataName: string): IndicatorBoardMetadata {
    const initIndicatorIds: string[] = [];
    return new IndicatorBoardMetadata(null, indicatorBoardMetadataName, initIndicatorIds);
  }

  public insertIndicatorId(id: string): void {
    let newIndicatorIds: string[] = [...this.indicatorIds];
    const currentIndicatorIds = this.convertToArray(newIndicatorIds);
    currentIndicatorIds.push(id);
    newIndicatorIds = currentIndicatorIds;
    this.checkRule(new IndicatorInIndicatorBoardMetadataShouldNotDuplicateRule(newIndicatorIds));
    this.checkRule(new IndicatorBoardMetadataCountShouldNotExceedLimitRule(newIndicatorIds));
    this.indicatorIds = newIndicatorIds;
  }

  public deleteIndicatorId(id: string): void {
    let updateIds: string[] = [...this.indicatorIds];
    this.checkRule(new OnlyRegisteredIdCanBeRemovedRule(updateIds, id));

    updateIds = updateIds.filter((value) => value !== id);
    this.indicatorIds = updateIds;
  }

  public updateIndicatorBoardMetadataName(name: string) {
    this.checkRule(new IndicatorBoardMetadataNameShouldNotEmptyRule(name));
    this.indicatorBoardMetadataName = name;
    this.updatedAt = new Date();
  }

  private convertToArray(indicatorIds: string[]): string[] {
    if (indicatorIds.length == 1 && indicatorIds[0] == '') {
      return [];
    }
    return indicatorIds;
  }

  constructor(id: string, indicatorBoardMetadataName: string, indicatorIds: string[]) {
    super();
    this.checkRule(new IndicatorBoardMetadataNameShouldNotEmptyRule(indicatorBoardMetadataName));
    this.checkRule(new IndicatorBoardMetadataCountShouldNotExceedLimitRule(indicatorIds));
    this.checkRule(new IndicatorInIndicatorBoardMetadataShouldNotDuplicateRule(indicatorIds));
    this.id = id;
    this.indicatorBoardMetadataName = indicatorBoardMetadataName;
    this.indicatorIds = indicatorIds;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}