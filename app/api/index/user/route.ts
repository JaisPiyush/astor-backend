

import { getUserRelatedDataOfIndexToken } from '@/utils/contract';
import { type NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
    const params = req.nextUrl.searchParams;
    const token = params.get('token') as string;
    const user = params.get('user') as string;
    const data = await getUserRelatedDataOfIndexToken(token, user);
    return Response.json(data)
  }