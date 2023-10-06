/* eslint-disable no-console */
import type { LoaderFunctionArgs } from '@remix-run/node';
import { corepackClaim } from '~/models/claim.server';

export async function loader({ params }: LoaderFunctionArgs) {
  return await corepackClaim(params.address);
}
