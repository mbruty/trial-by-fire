import React, { FC } from 'react';
import styles from './setup.module.scss';
import Camera from '../../components/Camera';
import { RoomData } from '.';
import { Heading } from '@chakra-ui/react';
import { VStack } from '@chakra-ui/react'
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';
import useSocket from '../../hooks/useSocket';
import { GetServerSideProps } from 'next';
import { parse } from 'cookie';
import mongoConnection from '../../database/mongoConnection';
import Game, { IGame } from '../../database/models/game';
import mongoose from 'mongoose';
import { getCookie } from 'cookies-next';
import imageSrcToGoogleCloudUrl from '../../database/utilities/imageSrcToGoogleCloudUrl';

type Props = {
    game: IGame,
    ID: string;
}

const SetupPage: FC<Props> = ({ game, ID }) => {
    const [imageUrl, setImageUrl] = React.useState<string | null>(null);
    const [imageSaved, setImageSaved] = React.useState(false);
    const router = useRouter();
    const socket = useSocket();

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
            router.push(`/game/play/${gameId}`);
        });

        // on unmount clean up listeners
        return () => {
            socket.unsubscribeStart(id);
        }
    }, []);

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

        setImageUrl(data);
        const res = await axios.post('/api/image/upload', body);

        if (res.status == 200) {
            setImageSaved(true);
        }

    };

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
    // If we don't have a room id cookie, redirect back to the /game page
    if (!context.req.cookies['room-id']) {
        return {
            redirect: {
                destination: '/game',
                permanent: false
            }
        }
    }

    const playerId = getCookie('id', { ...context });
    const roomId = getCookie('room-id', { ...context });
    // ensure mongo is initalised
    await mongoConnection();

    const game = await Game.findById(roomId, { '_id': 0, 'rounds._id': 0 }).lean();
    game?.players.forEach(x => x._id = x._id.toString());

    return {
        props: {
            game,
            ID: playerId
        }
    }
}

export default SetupPage;