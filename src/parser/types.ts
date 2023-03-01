import { SubSclRemarkMessage, SubSclRemarkMessageAction } from '../remark/types';
import { CallItem } from '@subsquid/substrate-processor/lib/interfaces/dataSelection';

export interface CallParsed<
  A extends SubSclRemarkMessageAction | string = '', V extends boolean = false
> {
  id: string;
  blockNumber: number;
  blockHash: string;
  timestamp: Date;
  extrinsicHash?: string;
  from?: string;
  to?: string;
  amount: bigint;
  remark: SubSclRemarkMessage<A, V>;
}

export const requiredPurchaseBatchCalls = new Set([
  'Balances.transfer',
  'System.remark'
]);

export type RemarkCallItem = CallItem<
  'System.remark',
  {
    call: {
      args: true;
      origin: true;
      parent: true;
    };
    extrinsic: true;
  }
>

export type AllCallItem = CallItem<
  '*',
  {
    call: {
      args: true;
      origin: true;
      parent: true;
    };
    extrinsic: true;
  }
>