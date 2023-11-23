import { IndexTokenAbi } from '@/abi/IndexTokenAbi';
import { createPublicClient, http, toHex } from 'viem';
import { polygonMumbai } from 'viem/chains'
import { getTokenPriceAndMarketCapByAddress } from './client';

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

    return indexPrice / decimalPlace;
}