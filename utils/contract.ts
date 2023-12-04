import { IndexTokenAbi } from '@/abi/IndexTokenAbi';
import { createPublicClient, encodeFunctionData, http, toHex } from 'viem';
import { base, polygonMumbai } from 'viem/chains'
import { getTokenPriceAndMarketCapByAddress } from './client';
import { ICashPoolAbi } from '@/abi/ICashPool';
import { IRouterAbi } from '@/abi/IRouter';
import { ethers } from 'ethers';
import { swapRouters } from './constants';

export type Address = `0x${string}`;

export const getViewClient = () => {
    const client = createPublicClient({
        chain: polygonMumbai,
        transport: http(process.env.QUICKNODE_API)
    });
    return client;
}

export const viemClient = getViewClient();
const decimalPlace = 1000000000000000000;

export const getTotalSupply = async (address: string): Promise<number> => {

    const data = await viemClient.readContract({
        address: address as `0x${string}`,
        abi: IndexTokenAbi,
        functionName: 'totalSupply'
    }) as bigint;
    return Number(data)/decimalPlace;

}

export const getWeightOfTokenInIndex = async (index: string, token: string): Promise<number> => {
    const data = await viemClient.readContract({
        address: index as any,
        abi: IndexTokenAbi,
        functionName: 'weights',
        args: [token]

    }) as bigint;
    return Number(data) / decimalPlace ;
}

export const getWeightsOfAllIndexTokens = async (address: string): Promise<Record<string, number>> => {
    const tokens = await viemClient.readContract({
        address: address as any,
        abi: IndexTokenAbi,
        functionName: 'getTokens'
    }) as string[];
    const weights: Record<string, number> = {};
    for (const token of tokens) {
        weights[token] = await getWeightOfTokenInIndex(address, token);
    }
    return weights;
}

export const getIndexedTokensData = async (address: string): Promise<{indexPrice: number, tokens: {address: string, tvl: number, share: number}[]}> => {
    const tokens = await viemClient.readContract({
        address: address as any,
        abi: IndexTokenAbi,
        functionName: 'getTokens'
    }) as string[];

    const price = await getTokenPriceAndMarketCapByAddress(tokens);
    let indexPrice: number = 0;
    const data: {address: string, tvl: number, share: number}[] = [];
    for (const token of tokens) {
        const weight = await getWeightOfTokenInIndex(address, token);
        data.push({
            address: token,
            tvl: weight * price[token]['usd'],
            share: weight * 100
        })
        indexPrice += weight * price[token]['usd'];
    }
    return {indexPrice, tokens: data};

}


export const getIndexPriceOfIndex = async (address: string): Promise<number> => {
    const tokens = await viemClient.readContract({
        address: address as any,
        abi: IndexTokenAbi,
        functionName: 'getTokens'
    }) as string[]; 
    const weights: Record<string, number> = {};
    const price = await getTokenPriceAndMarketCapByAddress(tokens);
    let indexPrice: number = 0;
    for (const token of tokens) {
       const weight = await getWeightOfTokenInIndex(address, token);
       indexPrice += weight * price[token]['usd']
    }

    return indexPrice;
}


export const getUserRelatedDataOfIndexToken = async (token: string, user: string) => {
    const indexedTokenBalance = await viemClient.readContract({
        address: token as any,
        abi: IndexTokenAbi,
        functionName: 'balanceOf',
        args: [user]
    }) as bigint;
    //TODO: Add collectibleIndexToken fetch

    return {
        indexedTokenBalance: Number(indexedTokenBalance) / decimalPlace
    }
}


export const getAllTokensOfIndexPool = async (address: `0x${string}`): Promise<string[]> => {
    const tokens = await viemClient.readContract({
        address: address,
        abi: IndexTokenAbi,
        functionName: 'getTokens'
    }) as string[];
    return tokens;
}


/// -------------- CASH POOL --------------------------------------------------------------------///

export const getCurrentNonceOfCashPool = async (address: string): Promise<number> => {
    const currentTxnNonce = await viemClient.readContract({
        address: address as any,
        abi: ICashPoolAbi,
        functionName: 'currentTxnNonce'
    }) as bigint;
    return Number(currentTxnNonce);
}

export const getCurrentPoolTokenAmount = async (address: string, nonce?: number): Promise<number> => {
    if (nonce === undefined) {
        nonce = await getCurrentNonceOfCashPool(address);
    }
    const balance = await viemClient.readContract({
        address: address as any,
        abi: ICashPoolAbi,
        functionName: 'currentPoolBaseTokenAmountPerNonce',
        args: [nonce]
    }) as bigint;
    return Number(balance);
}

export const getExchangeData = async (pool: Address): Promise<string> => {
    const indexTokenAddress = await viemClient.readContract({
        address: pool,
        abi: ICashPoolAbi,
        functionName: 'indexToken'
    }) as Address;
    const router = swapRouters[0];

    const tokens = await viemClient.readContract({
        address: indexTokenAddress,
        abi: IndexTokenAbi,
        functionName: 'getTokens'
    }) as Address[];
    const currentTxnNonce = await viemClient.readContract({
        address: pool,
        abi: ICashPoolAbi,
        functionName: 'currentTxnNonce'
    }) as bigint;
    const baseTokenPooled = await viemClient.readContract({
        address: pool,
        abi: ICashPoolAbi,
        functionName: 'currentPoolBaseTokenAmountPerNonce',
        args: [currentTxnNonce - BigInt(1)]
    }) as bigint;
    const routers: Address[] = [];
    const amountsOut: bigint[] = [];
    const approvedUSDT: bigint[] = [];
    for (const token of tokens) {
        const weight = await viemClient.readContract({
            address: indexTokenAddress,
            abi: IndexTokenAbi,
            functionName: 'weights',
            args:[token]
        }) as bigint;
        const price = await viemClient.readContract({
            address: router,
            abi: IRouterAbi,
            functionName: 'tokenPricePerUSDToken',
            args: [token]
        }) as bigint;
        const amountIn = (weight * baseTokenPooled);
        const _amountOut = (amountIn/price) * BigInt(10**18);
        routers.push(router);
        amountsOut.push(_amountOut);
        approvedUSDT.push(amountIn);

    }

    const abiCoder = new ethers.AbiCoder();
    const data = abiCoder.encode(['address[]', 'address[]', 'uint256[]', 'uint256[]'], [tokens, routers, amountsOut, approvedUSDT]);
    return data;
}


/// ---------------------------------Router --------------------------------------------------------///
export const getQuoteFromRouter = async (router: `0x${string}`, token: `0x${string}`, amount: number): Promise<number> => {
    const quote = await viemClient.readContract({
        address: router,
        abi: IRouterAbi,
        functionName: 'quote',
        args: [token, amount]
    }) as bigint;
    return Number(quote) / decimalPlace;
}