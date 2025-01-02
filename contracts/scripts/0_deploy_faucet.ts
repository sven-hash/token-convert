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
       tokenIdBurn: '11bf07230f5607f626773044414a196d0471d79ba9abc26f148b57b40d983a00',
       tokenIdConvert: 'a54f0bc6161540e2ab081876e261a80d4fa0578891112fabd7f7b7fc71e90c00',
       balanceConvert: 0n
    }
  })

  console.log('Token faucet contract id: ' + result.contractInstance.contractId)
  console.log('Token faucet contract address: ' + result.contractInstance.address)
}

export default deployFaucet