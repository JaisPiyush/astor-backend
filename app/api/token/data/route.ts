import { getTokenPriceAndMarketCapByAddress } from '@/utils/client';
import { type NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
    const params = req.nextUrl.searchParams;
    const tokens = (params.get('tokens') as string).split(',');
    const data = await getTokenPriceAndMarketCapByAddress(tokens);
    return Response.json(data)
  }