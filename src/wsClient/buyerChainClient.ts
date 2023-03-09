import { BaseChainClient } from './base';
import { getChain } from '../chains';
import { WalletClient } from '../walletClient';
import { ChainActionResult } from './types';
import { IpfsContent } from '@subsocial/api/substrate/wrappers';
import {
  cryptoWaitReady,
  decodeAddress,
  encodeAddress
} from '@polkadot/util-crypto';
import { decodeHex, toHex } from '@subsquid/util-internal-hex';
const { config } = getChain();
import { BN } from 'bn.js';
import { StatusesMng } from '../utils/statusesManager';

const BLOCK_TIME = 12;
const SECS_IN_DAY = 60 * 60 * 24;
const BLOCKS_IN_YEAR = new BN((SECS_IN_DAY * 365) / BLOCK_TIME);

export class BuyerChainClient extends BaseChainClient {
  private static instance: BuyerChainClient;

  constructor() {
    super({
      apiUrl: config.buyerChain.dataSource.chain
    });
  }

  static getInstance(): BuyerChainClient {
    if (!BuyerChainClient.instance) {
      BuyerChainClient.instance = new BuyerChainClient();
    }
    return BuyerChainClient.instance;
  }

  async getRegisteredDomains(domainNames: string[]) {
    const structs = await this.api.query.domains.registeredDomains.multi(
      domainNames
    );

    // @ts-ignore
    return structs.filter((x) => x.isSome).map((x) => x.unwrap());
  }

  async getDomainRegistrationPrice(): Promise<bigint> {
    // TODO add implementation
    return BigInt('1000000000');
  }

  async getDomainsByOwner(account: string): Promise<string[] | null> {
    try {
      const resp = await this.api.query.domains.domainsByOwner(account);
      return ((resp.toHuman() as Array<string>) || []).map((d) => d.toString());
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async registerDomain({
    target,
    domain
  }: {
    target: string;
    domain: string;
  }): Promise<ChainActionResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const domainRegistrationTx = this.api.tx.domains.forceRegisterDomain(
          target,
          domain,
          IpfsContent(),
          BLOCKS_IN_YEAR
        );

        console.log(
          'domainRegistrationTx hash - ',
          domainRegistrationTx.hash.toHex()
        );

        const sudoWrappedTx = this.api.tx.sudo.sudo(domainRegistrationTx);

        console.log('sudoWrappedTx hash - ', sudoWrappedTx.hash.toHex());

        const sudoKey = await this.api.query.sudo.key();

        // TODO add handling tx errors which is terminating an app (e.g. RpcError: 1010: Invalid Transaction: Inability to pay some fees , e.g. account balance too low)

        const unsub = await this.api.tx.proxy
          .proxy(sudoKey.toString(), null, sudoWrappedTx)
          .signAndSend(
            WalletClient.getInstance().account.domainRegistrar,
            async (resp) => {
              const { status, txHash, txIndex, dispatchError, isCompleted } =
                resp;

              console.log('txHash >>>');
              console.dir(txHash.toHex(), { depth: null });

              console.log('txIndex >>>');
              console.dir(txIndex, { depth: null });

              if (dispatchError) {
                reject({
                  ...StatusesMng.getStatusWithReason('WsClient', 'ErrorCommon'),
                  success: false,
                  reason: this.getTxSubDispatchErrorMessage(dispatchError),
                  blockHash: this.getTxSubDispatchErrorBlockHash(status)
                });
                unsub();
                return;
              }

              if (status.isInBlock) {
                console.log(
                  `Successful registration of domain ${domain} for address ${target}`
                );
                console.log(
                  'status.asInBlock.toHex() - ',
                  status.asInBlock.toHex()
                );
                resolve({
                  success: true,
                  blockHash: status.asInBlock.toHex()
                });
                unsub();
                return;
              } else {
                console.log(`Status of registration: ${status.type}`);
              }

              if (isCompleted) {
                unsub();
              }
            }
          );
      } catch (e: unknown) {
        console.log(e);
        reject({
          ...StatusesMng.getStatusWithReason('Common', 'ErrorUnknown'),
          success: false,
          reason:
            // @ts-ignore
            e && e.message
              ? // @ts-ignore
                e.message.toString()
              : 'Transaction error has been occurred.',
          ...(await this.getBlockMeta())
        });
        return;
      }
    });
  }
}
