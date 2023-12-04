
import { getCurrentNonceOfCashPool, getCurrentPoolTokenAmount } from '@/utils/contract';
import { type NextRequest } from 'next/server'

const RequestFields = ['nonce', 'baseTokenBalancePerNonce'];

const fieldResolver: Record<string, (params: URLSearchParams) => Promise<unknown>> = {
    'baseTokenBalancePerNonce': GETBaseTokenBalance,
    'nonce': GETCurrentNonceOfCashPool
}

export async function GET(req: NextRequest) {
    const params = req.nextUrl.searchParams;
    const fieldsString = params.get('fields') as string;
    const fields = fieldsString.split(',');
    const data: Record<string, unknown> = {};
    for (const field of fields) {
        if (RequestFields.includes(field)) {
            data[field] = await fieldResolver[field](params)
        }
    }
    return Response.json(data)
  }

async function GETCurrentNonceOfCashPool(params: URLSearchParams) {
    const address = params.get('address') as string;
    return await getCurrentNonceOfCashPool(address);
}

async function GETBaseTokenBalance(params: URLSearchParams) {
    const address = params.get('address') as string;
    const nonce = params.get('nonce');

    return await getCurrentPoolTokenAmount(address, nonce == null ? undefined :parseInt(nonce as string))

}