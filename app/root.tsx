import {
  RainbowKitProvider,
  darkTheme,
  getDefaultWallets,
} from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { cssBundleHref } from '@remix-run/css-bundle';
import { json, type LinksFunction } from '@remix-run/node';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react';
import { WagmiConfig, configureChains, createConfig } from 'wagmi';
import { arbitrum, polygon } from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import styles from './global.css';

export async function loader() {
  return json({
    ENV: {
      ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
      WALLET_CONNECT_PROJECT_ID: process.env.WALLET_CONNECT_PROJECT_ID
    },
  });
}




export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: styles },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com' },
  {
    href: 'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;700&display=swap',
    rel: 'stylesheet',
  },
  ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
];

export default function App() {
  const { ENV } = useLoaderData<typeof loader>();
  const { chains, publicClient } = configureChains(
    [polygon, arbitrum],
    [alchemyProvider({ apiKey: ENV.ALCHEMY_API_KEY }), publicProvider()],
  );
  
  const { connectors } = getDefaultWallets({
    appName: 'soulbound',
    projectId: ENV.WALLET_CONNECT_PROJECT_ID,
    chains,
  });
  
  const wagmiConfig = createConfig({
    autoConnect: true,
    connectors,
    publicClient,
  });
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-background font-cp">
        <WagmiConfig config={wagmiConfig}>
          <RainbowKitProvider chains={chains} showRecentTransactions={true}>
            <Outlet />
          </RainbowKitProvider>
        </WagmiConfig>

        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
