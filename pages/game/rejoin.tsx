import { Button, Heading, HStack, VStack } from '@chakra-ui/react';
import axios from 'axios';
import { deleteCookie, getCookie } from 'cookies-next';
import mongoConnection from 'database/mongoConnection';
import { GetServerSideProps } from 'next';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { FC } from 'react';
import Game from 'database/models/game';
import imageSrcToGoogleCloudUrl from 'database/utilities/imageSrcToGoogleCloudUrl';
import styles from './setup.module.scss';
import Head from 'next/head';

type Props = {
    gameState: string;
    gameId: string;
    gameCode: string;
    playerId: string;
    playerName: string;
    image: string;
}

const SetupPage: FC<Props> = (props) => {
    const router = useRouter();

    async function newGame() {
        await axios.post<LeaveRoomBody>('/api/game/leave', { id: props.playerId, gameCode: props.gameCode });
        localStorage.removeItem('isRemote')
        router.push('/game');
    }

    function rejoin() {
        if (props.gameState === 'waiting') {
            return router.push('/game/setup');
        }
        router.push(`/game/play/${props.gameId}`)
    }

    return (
        <div className={styles.main}>
            <Head>
                <title>Trials by fire - Rejoin</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <VStack className={styles.container} spacing='1rem'>
                <Heading as='h1'>Oops, it looks like you&apos;ve disconnected from your game</Heading>
                <p>
                    Previous game:<br />
                    Name: {props.playerName}<br />
                    RoomCode: {props.gameCode}<br />
                </p>
                {props.image && <Image src={props.image} alt='Your last game&apos;s image' height={400} width={400} />}
                <HStack spacing='1rem'>
                    <Button colorScheme='teal' onClick={rejoin}>Rejoin</Button>
                    <Button colorScheme='teal' onClick={newGame}>New game</Button>
                </HStack>
            </VStack>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    // ensure mongo is initalised
    await mongoConnection();

    // If there is not a game in the cookies, redirect to the standard join page
    if (!context.req.cookies['room-id'] || !context.req.cookies['id']) {
        return {
            redirect: {
                destination: '/game',
                permanent: false
            }
        }
    }

    const gameId = getCookie('room-id', { ...context });
    const playerId = getCookie('id', { ...context });
    const game = await Game.findById(gameId).lean();

    if (!game) {
        deleteCookie('id', { ...context });
        deleteCookie('room-id', { ...context });
    }

    const player = game?.players.find(x => x._id.toString() === playerId);
    const imageUrl = player?.imageURL ? imageSrcToGoogleCloudUrl(player?.imageURL) : '';
    return {
        props: {
            gameState: game?.state,
            gameId: game?._id.toString(),
            gameCode: game?.code,
            playerId,
            playerName: player?.name,
            image: imageUrl
        }
    }
}

export default SetupPage;