import React, { FC, useEffect, useState } from "react";
import styles from "../styles/Home.module.css";
import { contractFactory, convertToInt, getTokenList, Token, tokenMetadata } from "@/services/utils";
import { burnAndConvert } from "@/services/token.service";
import { BurnConvertTypes } from "my-contracts";
import { AlephiumConnectButton, useBalance, useWallet } from "@alephium/web3-react";
import { ONE_ALPH, waitForTxConfirmation, web3 } from "@alephium/web3";

web3.setCurrentNodeProvider(
  (process.env.NEXT_PUBLIC_NODE_URL as string) ??
    "https://fullnode-testnet.alephium.notrustverify.ch",
  undefined,
  undefined
);

interface TokenBalance {
  id: string;
  amount: bigint;
}

export const ConvertPage: FC = () => {
  const [amount, setAmount] = useState<string>('');
  const { balance, updateBalanceForTx } = useBalance();
  const [tokenBalanceBurn, setTokenBalanceBurn] = useState<TokenBalance | undefined>();
  const [tokenBalanceConvert, setTokenBalanceConvert] = useState<TokenBalance | undefined>();
  const [tokenBalanceBurnMetadata, setTokenBalanceBurnMetadata] = useState<Token | undefined>(undefined);
  const [tokenBalanceConvertMetadata, setTokenBalanceConvertMetadata] = useState<Token | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [contractState, setContractState] = useState<BurnConvertTypes.State>();
  const { signer, account, connectionStatus } = useWallet();
  const [successMessage, setSuccessMessage] = useState<string | JSX.Element>('');
  const [isWaiting, setIsWaiting] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Replace this with your actual data fetching logic
        setContractState(await contractFactory.fetchState());
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (
      connectionStatus === "connected" &&
      contractState !== undefined &&
      balance !== undefined
    ) {
      const tokenBurn = balance.tokenBalances?.find(
        (token: { id: string }) => token.id === contractState.fields.tokenIdBurn)
      const tokenConvert = balance.tokenBalances?.find(
        (token: { id: string }) => token.id === contractState.fields.tokenIdConvert)

      setTokenBalanceBurn(tokenBurn)
      setTokenBalanceConvert(tokenConvert)
      if (tokenBurn == undefined) setTokenBalanceBurn(undefined)
      if (tokenConvert == undefined) setTokenBalanceConvert(undefined)

    }
  }, [balance, connectionStatus, contractState]);

  useEffect(() => {
    const getMetadata = async () => {
      if (contractState !== undefined) {
        const tokenList = await getTokenList()

        setTokenBalanceBurnMetadata(tokenMetadata(tokenList, contractState.fields.tokenIdBurn))
        setTokenBalanceConvertMetadata(tokenMetadata(tokenList, contractState.fields.tokenIdConvert))
        console.log(tokenMetadata(tokenList, contractState.fields.tokenIdConvert))
      }
    }
    getMetadata()
  }, [contractState])

  const handleConvert = async() => {
    if (!amount) {
      alert("Please enter an amount");
      return;
    }

    if (signer && contractState){
      try {
        setIsWaiting(true);
        const floatToDecimals = convertToInt(amount)
        console.log(floatToDecimals)
        const tx = await burnAndConvert(
          signer,
          floatToDecimals[0],
          floatToDecimals[1],
          contractState.fields.tokenIdBurn,
          tokenBalanceBurnMetadata !== undefined ? tokenBalanceBurnMetadata.decimals : Number(3)
        );
        updateBalanceForTx(tx.txId,1)
        await waitForTxConfirmation(tx.txId, 1, 10000)
        
        // Show success message with explorer link (without timeout)
        setSuccessMessage(
          <span>
            Successfully converted {amount} {tokenBalanceBurnMetadata?.symbol} to {tokenBalanceConvertMetadata?.symbol}
            {" "}
            <a 
              href={`https://explorer.alephium.org/transactions/${tx.txId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#155724', textDecoration: 'underline' }}
            >
              View in Explorer
            </a>
          </span>
        );
        
        setAmount('');
      } catch (error) {
        console.error('Transaction failed:', error);
        alert('Transaction failed. Please try again.');
      } finally {
        setIsWaiting(false);
      }
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "5px",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <AlephiumConnectButton />
          <h1>Token converter</h1>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {tokenBalanceBurnMetadata?.logoURI && (
                <img 
                  src={tokenBalanceBurnMetadata.logoURI} 
                  alt={tokenBalanceBurnMetadata.symbol || "token"} 
                  style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                />
              )}
              {tokenBalanceBurnMetadata?.symbol !== undefined 
                ? tokenBalanceBurnMetadata?.symbol 
                : `${contractState?.fields.tokenIdBurn.slice(0, 4)}...${contractState?.fields.tokenIdBurn.slice(-4)}`}
              {" "}-{"> "}
              {tokenBalanceConvertMetadata?.logoURI && (
                <img 
                  src={tokenBalanceConvertMetadata.logoURI} 
                  alt={tokenBalanceConvertMetadata.symbol || "token"} 
                  style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                />
              )}
              {tokenBalanceConvertMetadata?.symbol !== undefined 
                ? tokenBalanceConvertMetadata?.symbol 
                : `${contractState?.fields.tokenIdConvert.slice(0, 4)}...${contractState?.fields.tokenIdConvert.slice(-4)}`}
            </div>
            <p>Pool balance: {Number(contractState?.fields.balanceConvert) / 10 ** (tokenBalanceConvertMetadata?.decimals ?? 0)} {tokenBalanceConvertMetadata?.symbol}</p>
          </div>

          <div>Available Balance: {tokenBalanceBurn !== undefined ? tokenBalanceBurnMetadata !== undefined ? 
            (Number(tokenBalanceBurn.amount) / 10 ** tokenBalanceBurnMetadata.decimals).toFixed(2) : 
            Number(tokenBalanceBurn.amount) : 0} {tokenBalanceBurnMetadata?.symbol}</div>
          <div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                padding: "8px",
                fontSize: "14px",
                marginRight: "10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
          </div>
          <div>
            <button
              onClick={() => setAmount(tokenBalanceBurn ? 
                ((Number(tokenBalanceBurn.amount) / 10 ** (tokenBalanceBurnMetadata?.decimals ?? 0)) * (10 / 100)).toString() 
                : '0')}
              disabled={isLoading || connectionStatus !== 'connected'}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                marginRight: "10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                cursor: isLoading || connectionStatus !== 'connected' ? "not-allowed" : "pointer",
                backgroundColor: isLoading || connectionStatus !== 'connected' ? "#cccccc" : "#007bff",
                color: "white",
              }}
            >
              10%
            </button>
            <button
              onClick={() => setAmount(tokenBalanceBurn ? 
                ((Number(tokenBalanceBurn.amount) / 10 ** (tokenBalanceBurnMetadata?.decimals ?? 0)) * (10 / 100)).toString() 
                : '0')}
              disabled={isLoading || connectionStatus !== 'connected'}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                marginRight: "10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                cursor: isLoading || connectionStatus !== 'connected' ? "not-allowed" : "pointer",
                backgroundColor: isLoading || connectionStatus !== 'connected' ? "#cccccc" : "#007bff",
                color: "white",
              }}
            >
              50%
            </button>
            <button
              onClick={() => setAmount(tokenBalanceBurn ? 
                (Number(tokenBalanceBurn.amount) / 10 ** (tokenBalanceBurnMetadata?.decimals ?? 0)).toString() 
                : '0')}
              disabled={isLoading || connectionStatus !== 'connected'}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                cursor: isLoading || connectionStatus !== 'connected' ? "not-allowed" : "pointer",
                backgroundColor: isLoading || connectionStatus !== 'connected' ? "#cccccc" : "#007bff",
                color: "white",
              }}
            >
              Max
            </button>
          </div>
          <button
            className={styles.button}
            onClick={handleConvert}
            disabled={isLoading || connectionStatus !== 'connected'}
            style={{
              padding: "12px 24px",
              fontSize: "16px",
              cursor: isLoading || connectionStatus !== 'connected' ? "not-allowed" : "pointer",
              backgroundColor: isLoading || connectionStatus !== 'connected' ? "#cccccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Convert
          </button>
          {successMessage && (
            <div style={{
              padding: '10px',
              backgroundColor: '#d4edda',
              color: '#155724',
              borderRadius: '4px',
              marginTop: '10px',
              marginBottom: '10px',
              textAlign: 'center'
            }}>
              {successMessage}
            </div>
          )}
          {isWaiting && (
            <div style={{
              padding: '10px',
              backgroundColor: '#fff3cd',
              color: '#856404',
              borderRadius: '4px',
              marginTop: '10px',
              marginBottom: '10px',
              textAlign: 'center'
            }}>
              Converting {amount} {tokenBalanceBurnMetadata?.symbol} to {tokenBalanceConvertMetadata?.symbol}... Please wait.
            </div>
          )}
          <div style={{
            marginTop: '20px',
            fontSize: '14px',
            color: '#666'
          }}>
            Developed by{' '}
            <a 
              href="https://notrustverify.ch"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#007bff', textDecoration: 'none' }}
            >
              No Trust Verify
            </a>
          </div>
        </>
      )}
    </div>
  );
};
