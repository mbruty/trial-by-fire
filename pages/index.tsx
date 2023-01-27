import { Heading } from '@chakra-ui/react'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import styles from 'styles/Home.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <Heading as='h1' className={styles.title}>
          Welcome to trials by fire!
        </Heading>

        <p className={styles.description}>
          Get started by creating a game
        </p>

        <div className={styles.grid}>
          <Link id='new' href="/host/new" className={styles.card}>
            <h2>Create a new game &rarr;</h2>
            <p>Create a game, and create every round</p>
          </Link>

          <Link href="/game" className={styles.card}>
            <h2>Join a game &rarr;</h2>
            <p>Join a game in progress as a player</p>
          </Link>
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  )
}
