import { SourceIndicatorInformation } from 'src/commons/type/type-definition';
import { BusinessRule } from '../../../commons/domain/business.rule';

export class TargetIndicatorShouldNotBeIncludedInSourceIndicatorsRule implements BusinessRule {
  constructor(
    private readonly sourceIndicatorInformation: SourceIndicatorInformation[],
    private readonly targetIndicatorId: string,
  ) {}

  isBroken = () =>
    this.checkIsTargetIndicatorInSourceIndicators(this.sourceIndicatorInformation, this.targetIndicatorId);

  get Message() {
    return `타겟지표는 재료지표에 포함될 수 없습니다.`;
  }

  private checkIsTargetIndicatorInSourceIndicators(
    sourceIndicatorInformation: SourceIndicatorInformation[],
    targetIndicatorId: string,
  ) {
    const sourceIndicatorIds: string[] = sourceIndicatorInformation.map((indicator) => {
      return indicator.sourceIndicatorId;
    });
    return sourceIndicatorIds.includes(targetIndicatorId);
  }
}
