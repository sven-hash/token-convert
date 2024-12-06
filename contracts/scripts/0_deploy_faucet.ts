import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { BurnConvert } from '../artifacts/ts'
import { stringToHex } from '@alephium/web3'
import { expectAssertionError, mintToken } from '@alephium/web3-test'

// This deploy function will be called by cli deployment tool automatically
// Note that deployment scripts should prefixed with numbers (starting from 0)
const deployFaucet: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  if(network.networkId == 3){
   const tokenToBurn = await mintToken("1GBvuTs4TosNB9xTCGJL5wABn2xTYCzwa7MnXHphjcj1y", 1000n*18n)
   const tokenToGet = await mintToken("1GBvuTs4TosNB9xTCGJL5wABn2xTYCzwa7MnXHphjcj1y", 1000n*18n)
  }
  const result = await deployer.deployContract(BurnConvert, {
  
    // The initial states of the faucet contract
    initialFields: {
       tokenIdBurn: '9970013b1e7928c0331bf75c30ebfb89a7898b5442b8bfc1484e06dce755dd00',
       tokenIdConvert: '83847a67361cd0288e57f4a51dee3a6fafb170f1424e3de83d02676a98d92f00',
       balanceConvert: 0n
    }
  })

  console.log('Token faucet contract id: ' + result.contractInstance.contractId)
  console.log('Token faucet contract address: ' + result.contractInstance.address)
}

export default deployFaucet