import assert from 'assert';
import {
  DomainRegisterCompletedContent,
  DomainRegisterPayContent,
  DomainRegisterRefundContent,
  EnergyGenerateCompletedContent,
  EnergyGeneratePayContent,
  EnergyGenerateRefundContent,
  REMARK_CONTENT_VERSION_ACTION_MAP,
  RemarkContentProps,
  SocialRemarkMessage,
  SocialRemarkMessageAction,
  SocialRemarkMessageContent,
  SocialRemarkMessageProtocolName,
  SocialRemarkMessageVersion,
  SubSclSource
} from './types';
import { SocialRemarkConfig, SocialRemarkConfigData } from './config';
import { decorateRemarkContentValue } from './decorators';

export class SocialRemark {
  private maybeRemarkMsg: unknown;

  static setConfig(data: SocialRemarkConfigData) {
    SocialRemarkConfig.getInstance().setConfig(data);
  }

  private msgParsed: SocialRemarkMessage<
    SocialRemarkMessageAction,
    boolean
  > | null = null;

  private protNames: Set<SocialRemarkMessageProtocolName> = new Set(
    SocialRemarkConfig.getInstance().config.protNames
  );

  private versions: Set<SocialRemarkMessageVersion> = new Set(
    SocialRemarkConfig.getInstance().config.versions
  );

  private actions: Set<SocialRemarkMessageAction> = new Set(
    SocialRemarkConfig.getInstance().config.actions
  );

  private msgDelimiter: string = '::';

  public get message():
    | SocialRemarkMessage<SocialRemarkMessageAction, boolean>
    | never {
    if (!this.msgParsed) throw new Error('Message is not available.');
    return this.msgParsed!;
  }

  public get content() {
    return this.msgParsed && this.msgParsed.valid
      ? this.msgParsed.content
      : null;
  }

  public get version() {
    return this.msgParsed ? this.msgParsed.version : null;
  }

  public get isValidMessage(): boolean {
    return !!this.msgParsed && this.msgParsed.valid;
  }

  static bytesToString(src: unknown): string {
    if (!src || !Buffer.isBuffer(src)) return '';
    return Buffer.from(src).toString('utf-8');
  }

  public fromMessage(maybeRemarkMsg: unknown): SocialRemark {
    this.maybeRemarkMsg = maybeRemarkMsg;
    this.parseMsg(maybeRemarkMsg);
    return this;
  }

  public fromSource(
    rmrkSrc: SubSclSource<SocialRemarkMessageAction>
  ): SocialRemark {
    let isSrcValid = true;

    if (
      !rmrkSrc ||
      !this.isValidProtName(rmrkSrc.protName) ||
      !this.isValidVersion(rmrkSrc.version) ||
      !this.isValidAction(rmrkSrc.action)
    )
      isSrcValid = false;

    // TODO add content validation

    if (!isSrcValid) throw new Error('Remark source is invalid');

    try {
      this.msgParsed = {
        ...rmrkSrc,
        valid: true
      };
      const contentPropsMap =
        // @ts-ignore
        REMARK_CONTENT_VERSION_ACTION_MAP[rmrkSrc.version][rmrkSrc.action];
      for (const contentPropName in contentPropsMap) {
        // @ts-ignore
        this.msgParsed.content[contentPropName] = decorateRemarkContentValue(
          this.msgParsed.action,
          contentPropName as RemarkContentProps,
          // @ts-ignore
          rmrkSrc.content[contentPropName]
        );
      }
    } catch (e) {
      console.log(e);
      throw new Error(
        'Error has been occurred during remark message creation.'
      );
    }
    return this;
  }

  public toMessage(): string {
    if (!this.isValidMessage)
      throw new Error('Remark is not valid for build message.');

    const msg: string[] = [];
    msg.push(this.message.protName);
    msg.push(this.message.version);
    msg.push(this.message.action);

    try {
      const contentPropsMap =
        // @ts-ignore
        REMARK_CONTENT_VERSION_ACTION_MAP[this.message.version][
          this.message.action
        ];
      for (const contentPropName in contentPropsMap) {
        // @ts-ignore
        msg[contentPropsMap[contentPropName]] = decorateRemarkContentValue(
          this.message.action,
          contentPropName as RemarkContentProps,
          // @ts-ignore
          this.message.content[contentPropName]
        );
      }
    } catch (e) {
      console.log(e);
      throw new Error(
        'Error has been occurred during remark message creation.'
      );
    }

    //TODO add validations
    return msg.join(this.msgDelimiter);
  }

  /**
   * ====== Private functionality ======
   */

  private parseMsg(srcMsg: unknown): void {
    if (!srcMsg || typeof srcMsg !== 'string') return;

    const chunkedMsg = (
      Buffer.isBuffer(srcMsg) ? SocialRemark.bytesToString(srcMsg) : srcMsg
    ).split(this.msgDelimiter);

    if (
      !chunkedMsg ||
      chunkedMsg.length === 0 ||
      !this.isValidProtName(chunkedMsg[0]) ||
      !this.isValidVersion(chunkedMsg[1]) ||
      !this.isValidAction(chunkedMsg[2])
    )
      return;

    this.msgParsed = {
      protName: chunkedMsg[0] as SocialRemarkMessageProtocolName,
      version: chunkedMsg[1] as SocialRemarkMessageVersion,
      action: chunkedMsg[2] as SocialRemarkMessageAction,
      valid: false,
      content: null
    };

    try {
      const contentPropsMap: Record<RemarkContentProps, number> =
        // @ts-ignore
        REMARK_CONTENT_VERSION_ACTION_MAP[this.msgParsed.version][
          this.msgParsed.action
        ];

      for (const contentPropName in contentPropsMap) {
        // @ts-ignore
        if (!this.msgParsed.content) this.msgParsed.content = {};
        // @ts-ignore
        this.msgParsed.content[contentPropName] = decorateRemarkContentValue(
          this.msgParsed.action,
          contentPropName as RemarkContentProps,
          // @ts-ignore
          chunkedMsg[contentPropsMap[contentPropName]]
        );
      }

      this.msgParsed.valid = true;
    } catch (e) {
      console.log(e);
    }
  }

  private isValidProtName(src: string): boolean {
    // TODO remove type casting
    return !!(
      src && this.protNames.has(src as SocialRemarkMessageProtocolName)
    );
  }
  private isValidVersion(src: string): boolean {
    // TODO remove type casting
    return !!(src && this.versions.has(src as SocialRemarkMessageVersion));
  }
  private isValidAction(src: string): boolean {
    // TODO remove type casting
    return !!(src && this.actions.has(src as SocialRemarkMessageAction));
  }
}
