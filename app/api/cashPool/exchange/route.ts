
import { Address, getExchangeData } from '@/utils/contract';
import { type NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
    const params = req.nextUrl.searchParams;
    const address = params.get('address') as Address;
    const data = await getExchangeData(address);
    return Response.json(data)
  }