import type { AppProps } from 'next/app'
import Head from 'next/head'
import { Inter } from 'next/font/google'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Pocket Flow - Business Card CRM</title>
        <meta name="description" content="AI-powered business card management system" />
      </Head>
      <div className={`${inter.className} dark`}>
        <Component {...pageProps} />
      </div>
    </>
  )
}