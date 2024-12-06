import {
  DUST_AMOUNT,
  ExecuteScriptResult,
  SignerProvider,
} from "@alephium/web3";
import { contractFactory } from "./utils";


export const burnAndConvert = async (
  signerProvider: SignerProvider,
  amount: bigint,
  decimalsAmount: number,
  tokenIdToBurn: string,
  tokenDecimals: number
): Promise<ExecuteScriptResult> => {
  const decimalsPower = BigInt(tokenDecimals-decimalsAmount)
  console.log(amount * 10n ** decimalsPower)
  return await contractFactory.transact.burnAndConvert({
    args: {
      amountToBurn: amount * 10n ** decimalsPower,
    },
    signer: signerProvider,
    tokens: [
      {
        id: tokenIdToBurn,
        amount: amount * 10n ** decimalsPower,
      },
    ],
    attoAlphAmount: 3n * DUST_AMOUNT,
  });
}

export const deposit = async (
  signerProvider: SignerProvider,
  amount: bigint,
  decimalsAmount: number,
  tokenIdToDeposit: string,
  tokenDecimals: number
): Promise<ExecuteScriptResult> => {
  const decimalsPower = BigInt(tokenDecimals-decimalsAmount)
  console.log(amount, decimalsAmount)
  return await contractFactory.transact.deposit({
    args: {
      amount: amount * 10n ** decimalsPower,
    },
    signer: signerProvider,
    tokens: [
      {
        id: tokenIdToDeposit,
        amount: amount * 10n ** decimalsPower,
      },
    ],
    attoAlphAmount: 3n * DUST_AMOUNT,
  });
}
