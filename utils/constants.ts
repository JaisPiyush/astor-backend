import { Address } from "viem";

export const tokenAddressCoinGeckoIdMap: Record<string, string> = {
    '0x1ed1029d010934d0E114e2153ab1053919169b29': 'bitcoin',
    '0x8735D105C73291F59E4791Acd0A5978BCCace42D': 'link',
    '0xAe8beF3454E440fC6a8EA4960400693449973298': 'binancecoin',
    '0x14281ff9a6EcC889cFb0c94c327262569f9F661F': 'matic-network'
};

export const swapRouters = ['0x08E4f185eeba88220F85cf6BEF75a35Ab7D99340'] as Address[];
