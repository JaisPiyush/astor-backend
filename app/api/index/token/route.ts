import { getIndexedTokensData } from '@/utils/contract';
import { type NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
    const params = req.nextUrl.searchParams;
    const address = params.get('address') as string;
    const data = await getIndexedTokensData(address)
    return Response.json(data)
  }