import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit';
import { LoaderFunctionArgs, json } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '~/components/ui/button';
import { Toaster } from '~/components/ui/toaster';
import { useToast } from '~/components/ui/use-toast';
import { checkCampaignCompletion } from '~/models/claim.server';

type LoaderData = {
  campaignCompleted: boolean;
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  return json<LoaderData>({
    campaignCompleted: await checkCampaignCompletion(params.id),
  });
};

const ClaimPage = () => {
  const { campaignCompleted } = useLoaderData<LoaderData>();
  const { address } = useAccount();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const addRecentTransaction = useAddRecentTransaction();
  const fetcher = useFetcher();
  const isClaiming = fetcher.state !== 'idle';

  useEffect(() => {
    if (!fetcher.data) return;

    // @ts-ignore
    if (fetcher.data?.data?.artifact_tx) {
      addRecentTransaction({
        hash: '0x8f3b152a4641be61de5dc88edb7ac961552229aac1571b1187b69c14aa750760',
        description: 'NFT claimed',
      });
      toast({
        title: 'Congratulations 🎉',
        description: 'Nft claimed successfully',
      });
    } else {
      errorToast('Internal Server Error');
    }

    setIsLoading(false);
  }, [fetcher.data]);

  const errorToast = (description: string) => {
    toast({
      title: 'Error',
      description,
      variant: 'destructive',
    });
  };

  const handleClaimClick = async () => {
    setIsLoading(true);

    if (!address) {
      errorToast('Please connect your wallet first');
      setIsLoading(false);
      return;
    }

    if (campaignCompleted) {
      fetcher.load(`/api/claim/${address}`);
    } else {
      errorToast('You have not completed all the objectives');
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-end items-right pt-4 pr-4 h-4rem w-auto">
        <ConnectButton />
      </div>
      <div className="flex justify-center items-center h-[calc(100vh-4rem)] w-screen">
        <Button
          className="hover:shadow-lg text-lg py-6 px-8 font-bold"
          onClick={handleClaimClick}
          disabled={isLoading || isClaiming}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Claiming...' : 'Claim'}
        </Button>
      </div>

      <Toaster />
    </>
  );
};

export default ClaimPage;
