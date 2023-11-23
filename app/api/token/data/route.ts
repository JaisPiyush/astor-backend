import { coinGeckoClient } from '@/utils/client';
import { type NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
    const params = req.nextUrl.searchParams;
    const ids = params.get('ids');
    const res = await coinGeckoClient.get(`/simple/price?include_market_cap=true&vs_currencies=usd&ids=${encodeURIComponent(ids as string)}&x_cg_demo_api_key=${process.env.COINGECKO_API}`)
    return Response.json(res.data)
  }