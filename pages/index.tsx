import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { NextPage } from "next";
import Head from "next/head";
import { useAccount, useSigner, useNetwork } from "wagmi";
import styles from "../styles/Home.module.css";
import { createTRPCUntypedClient, httpBatchLink } from "@trpc/client";
import { ethers } from "ethers";

const REWARD_VAULT_ADDRESS = process.env.NEXT_PUBLIC_REWARD_VAULT_ADDRESS as string;

const trpcClient = createTRPCUntypedClient({
  links: [
    httpBatchLink({
      url: String(process.env.NEXT_PUBLIC_TRPC_URL),
    }),
  ],
});

const mapProofs = ({ proof, values }) => {
  return {
    sourceId: values[0],
    recipientAddress: values[1],
    rewardContractAddress: values[2],
    tokenId: values[3],
    amount: values[4],
    proof,
  };
};

type ReadableProof = ReturnType<typeof mapProofs>;

const NFTCard = (props: ReadableProof) => {
  const { data: signer } = useSigner();

  const [metadata, setMetadata] = React.useState<{
    name: string;
    symbol: string;
    image: string;
    animation_url?: string;
  }>({
    name: "",
    symbol: "",
    image: "",
    animation_url: undefined,
  });

  const [isClaimed, setIsClaimed] = React.useState(false);

  React.useEffect(() => {
    async function fetchMetadata() {
      let provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL);

      const rewardContract = new ethers.Contract(
        props.rewardContractAddress,
        [
          "function name() external view returns (string memory)",
          "function symbol() external view returns (string memory)",
          "function uri(uint256 _id) external view returns (string memory)",
          "function tokenURI(uint256 _tokenId) external view returns (string memory)",
        ],
        provider
      );

      const fetchUri = async (fn: Promise<any>) => {
        let uri: string = "";
        try {
          uri = await fn;
        } catch (err: any) {
          if (err?.message?.startsWith("missing revert data")) {
            return uri;
          }
          throw err;
        }
        return uri;
      };

      // Attempt to get the token uri using ERC1155's uri fn
      let uri = await fetchUri(rewardContract.uri(props.tokenId));

      // Attempt to get the rewrard token URI using ERC721 token URI fn
      if (uri === "") {
        uri = await fetchUri(rewardContract.tokenURI(props.tokenId));
      }

      // If we still can't get the URI, the reward NFT may not be ERC1155 nor
      // ERC721 so we raise an error.
      if (uri === "") {
        throw new Error("Token URI not set.");
      }

      const [name, symbol, fetchedMetadata] = await Promise.all([
        rewardContract.name(),
        rewardContract.symbol(),
        fetch(uri),
      ]);

      const jsonMetadata = await fetchedMetadata.json();

      setMetadata({
        name,
        symbol,
        image: jsonMetadata.image,
        animation_url: jsonMetadata.animation_url,
      });
    }
    fetchMetadata();
  }, [props.tokenId, props.rewardContractAddress]);

  React.useEffect(() => {
    async function isNftClaimed(sourceId: string) {
      let provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL);
      const vaultContract = new ethers.Contract(
        REWARD_VAULT_ADDRESS,
        ["function isClaimed(uint256 sourceId) public view returns (bool)"],
        provider
      );

      const _isClaimed = await vaultContract.isClaimed(sourceId);
      setIsClaimed(_isClaimed);
    }
    isNftClaimed(props.sourceId);
  }, [props.sourceId]);

  const performClaim = React.useCallback(async () => {
    if (!signer) return;

    const _vaultContract = new ethers.Contract(
      REWARD_VAULT_ADDRESS,
      [
        "function claim(uint256 sourceId, address recipient, address collection, uint256 tokenId, uint256 amount, bytes32[] calldata proof)",
      ],
      signer
    );

    const tx = await _vaultContract.claim(
      props.sourceId,
      props.recipientAddress,
      props.rewardContractAddress,
      props.tokenId,
      props.amount,
      props.proof
    );

    console.log(tx);
  }, [props, signer]);

  return (
    <div className={styles.card}>
      <img src={metadata.image} alt="" />
      <div>TokenId: {props.tokenId}</div>
      {!isClaimed ? <button onClick={() => performClaim()}>Claim</button> : <span>Claimed</span>}
    </div>
  );
};

const Home: NextPage = () => {
  const [proofs, setProofs] = React.useState<ReadableProof[]>([]);
  const { address } = useAccount();
  const { chain } = useNetwork();

  React.useEffect(() => {
    if (!chain) return;
    if (!address) return;

    async function fetchUserProofs() {
      if (!address) return;
      const response = await trpcClient.query("rewardIntents.proofs", {
        chain_id: `${chain?.id}`,
        reward_vault_address: REWARD_VAULT_ADDRESS,
        recipient_address: address,
      });
      const _proofs = (response as any)?.data?.proofs ?? [];
      if (_proofs.length > 0) {
        setProofs(_proofs.map(mapProofs));
      }
    }

    fetchUserProofs();
  }, [address, chain]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Soulbound Rewards Example App</title>
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <main className={styles.main}>
        <ConnectButton />
        <div className="grid">
          {proofs.map((proof) => (
            <NFTCard key={proof.sourceId} {...proof} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Home;
