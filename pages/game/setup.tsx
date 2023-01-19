import React, { FC } from 'react';
import styles from './setup.module.scss';
import Camera from 'components/Camera';
import { Heading } from '@chakra-ui/react';
import { VStack } from '@chakra-ui/react'
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';
import useSocket from 'hooks/useSocket';
import { GetServerSideProps } from 'next';
import mongoConnection from 'database/mongoConnection';
import Game, { IGame } from 'database/models/game';
import { deleteCookie, getCookie } from 'cookies-next';
import imageSrcToGoogleCloudUrl from 'database/utilities/imageSrcToGoogleCloudUrl';
import useOrangeBackground from 'hooks/useOrangeBackground';

type Props = {
    game: IGame,
    ID: string;
}

const SetupPage: FC<Props> = ({ game, ID }) => {
    const [imageSaved, setImageSaved] = React.useState(false);
    const [shouldNavigateToPlayAfterSave, setShouldNavigateToPlayAfterSave] = React.useState(game.state !== 'waiting');
    const router = useRouter();
    const socket = useSocket();
    useOrangeBackground();

    const player = game.players.find(x => x._id.toString() === ID);
    const imgSrc = player?.imageURL ? imageSrcToGoogleCloudUrl(player?.imageURL) : '';


    React.useEffect(() => {
        if (imgSrc) {
            setImageSaved(true);
        }

        // Join the room
        socket.joinRoom(game.code);

        // Subscribe to on start
        const id = socket.subscribeToStart((gameId: string) => {
            // If the player hasn't got an image, don't naviagte them away yet...
            if (!imageSaved) {
                return setShouldNavigateToPlayAfterSave(true);
            }
            router.push(`/game/play/${gameId}`);
        });

        // on unmount clean up listeners
        return () => {
            socket.unsubscribeStart(id);
        }
    }, [imgSrc, game.code, router, socket, imageSaved]);

    async function uploadToServer(data: string) {
        if (!game.code || !ID) {
            router.push('/game');
            return;
        }

        const body: ImageUploadBody = {
            gameCode: game.code,
            userId: ID,
            imageBase64: data
        };

        const res = await axios.post('/api/image/upload', body);

        if (res.status == 200) {
            setImageSaved(true);
        }

        if (shouldNavigateToPlayAfterSave) {
            router.push(`/game/play/${game._id}`);
        }
    }

    function onReset() {
        setImageSaved(false);
    }

    return (

        <>
            <Head>
                <title>Trials by fire - Waiting</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className={styles.main}>
                <VStack className={styles.container} spacing='1rem'>
                    <Heading as='h1'>Hello {player?.name ?? ''}</Heading>
                    <p>Lets get you setup</p>
                    <Camera imgSrc={imgSrc} onSubmit={uploadToServer} onReset={onReset} isSaved={imageSaved} />
                    <p>Waiting on the host to start the game...</p>
                </VStack>
            </div></>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    // ensure mongo is initalised
    await mongoConnection();

    // If we don't have a room id cookie, redirect back to the /game page
    if (!context.req.cookies['room-id'] || !context.req.cookies['id']) {
        return {
            redirect: {
                destination: '/game',
                permanent: false
            }
        }
    }

    const playerId = getCookie('id', { ...context });
    const roomId = getCookie('room-id', { ...context });

    const game = await Game.findById(roomId, { 'rounds._id': 0 }).lean();

    const player = game?.players.find(x => x._id.toString() === playerId);

    // IF we can't find the game that means it's already finished
    if (!game) {

        // Remove the cookies
        deleteCookie('id');
        deleteCookie('room-id');

        // Redirect to game
        return {
            redirect: {
                destination: '/game',
                permanent: false
            }
        }
    }

    // If the game isn't waiting, and the player has an image
    if (game?.state !== 'waiting' && player?.imageURL) {
        return {
            redirect: {
                destination: `/game/play/${roomId}`,
                permanent: false
            }
        }
    }

    game.players.forEach(x => x._id = x._id.toString());
    game._id = game._id.toString();

    return {
        props: {
            game,
            ID: playerId
        }
    }
}

export default SetupPage;