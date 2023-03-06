export type DomainRegisterPayContent = {
  domainName: string;
  target: string;
  token: string;
  opId: string;
};
export type DomainRegisterCompletedContent = {
  domainName: string;
  target: string;
  token: string;
  opId: string;
};

export type DomainRegisterRefundContent = {
  domainName: string;
  target: string;
  token: string;
  opId: string;
};

export type EnergyGeneratePayContent = {
  energyAmount: string;
  target: string;
  token: string;
  opId: string;
};
export type EnergyGenerateCompletedContent = {
  energyAmount: string;
  target: string;
  token: string;
  opId: string;
};

export type EnergyGenerateRefundContent = {
  energyAmount: string;
  target: string;
  token: string;
  opId: string;
};

export type RemarkContentProps =
  | keyof DomainRegisterPayContent
  | keyof DomainRegisterCompletedContent
  | keyof DomainRegisterRefundContent
  | keyof EnergyGeneratePayContent
  | keyof EnergyGenerateCompletedContent
  | keyof EnergyGenerateRefundContent;

export type SubSclRemarkMessageVersion = '0.1';
export type SubSclRemarkMessageAction =
  | 'DMN_REG'
  | 'DMN_REG_OK'
  | 'DMN_REG_REFUND'
  | 'NRG_GEN'
  | 'NRG_GEN_OK'
  | 'NRG_GEN_REFUND';

export type SubSclRemarkMessageProtocolName =
  | 'test_remark_title'
  | 't_subscl'
  | 't2_subscl'
  | 't3_subscl'
  | 't4_subscl'
  | 'social';

export type SubSclRemarkMessageContent<
  A extends SubSclRemarkMessageAction | string
> = A extends 'DMN_REG'
  ? DomainRegisterPayContent
  : A extends 'DMN_REG_OK'
  ? DomainRegisterCompletedContent
  : A extends 'DMN_REG_REFUND'
  ? DomainRegisterRefundContent
  : A extends 'NRG_GEN'
  ? EnergyGeneratePayContent
  : A extends 'NRG_GEN_OK'
  ? EnergyGenerateCompletedContent
  : A extends 'NRG_GEN_REFUND'
  ? EnergyGenerateRefundContent
  : never;

export type SubSclRemarkMessage<
  A extends SubSclRemarkMessageAction | string = '',
  V extends true | false = false
> = {
  protName: SubSclRemarkMessageProtocolName;
  version: SubSclRemarkMessageVersion;
  action: A;
  valid: V; // TODO make this prop optional
  content: V extends true ? SubSclRemarkMessageContent<A> : null;
};

export type SubSclSource<A extends SubSclRemarkMessageAction | string = ''> =
  Omit<SubSclRemarkMessage<A, true>, 'valid'>;

type VersionActionPropsMap = Record<
  SubSclRemarkMessageVersion,
  | Record<'DMN_REG', Record<keyof DomainRegisterPayContent, number>>
  | Record<'DMN_REG_OK', Record<keyof DomainRegisterCompletedContent, number>>
  | Record<'DMN_REG_REFUND', Record<keyof DomainRegisterRefundContent, number>>
  | Record<'NRG_GEN', Record<keyof EnergyGeneratePayContent, number>>
  | Record<'NRG_GEN_OK', Record<keyof EnergyGenerateCompletedContent, number>>
  | Record<'NRG_GEN_REFUND', Record<keyof EnergyGenerateRefundContent, number>>
>;

export const REMARK_CONTENT_VERSION_ACTION_MAP: VersionActionPropsMap = {
  '0.1': {
    DMN_REG: {
      opId: 3,
      target: 4,
      domainName: 5,
      token: 6
    },
    DMN_REG_OK: {
      opId: 3,
      target: 4,
      domainName: 5,
      token: 6
    },
    DMN_REG_REFUND: {
      opId: 3,
      target: 4,
      domainName: 5,
      token: 6
    },
    NRG_GEN: {
      opId: 3,
      target: 4,
      energyAmount: 5,
      token: 6
    },
    NRG_GEN_OK: {
      opId: 3,
      target: 4,
      energyAmount: 5,
      token: 6
    },
    NRG_GEN_REFUND: {
      opId: 3,
      target: 4,
      energyAmount: 5,
      token: 6
    }
  }
};
