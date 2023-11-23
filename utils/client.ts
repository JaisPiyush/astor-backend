import axios from "axios";
import { tokenAddressCoinGeckoIdMap } from "./constants";

export const coinGeckoClient = axios.create({
    baseURL: `https://api.coingecko.com/api/v3`,
})

export const getTokensPriceAndMarketCap = async (ids: string[]) => {
    const res = await coinGeckoClient.get(`/simple/price?include_market_cap=true&vs_currencies=usd&ids=${encodeURIComponent(ids.join(','))}&x_cg_demo_api_key=${process.env.COINGECKO_API}`)
    return res.data;
}

export const getTokenPriceAndMarketCapByAddress = async(tokens: string[]) => {
    const idToAddressMap: Record<string, string> = {}
    const ids: string[] = []
    for (const key of tokens) {
      const id = tokenAddressCoinGeckoIdMap[key];
      idToAddressMap[id] = key;
      ids.push(id)
    }
    const res = await getTokensPriceAndMarketCap(ids);
    const data: Record<string, {usd: number, usd_market_cap: number}> = {};
    for (const [key, value] of Object.entries(res)) {
      data[idToAddressMap[key]] = value as {usd: number, usd_market_cap: number};
    }
    return data
}