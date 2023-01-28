import React, { useCallback, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { isObjectIdOrHexString, Types } from 'mongoose';
import Game, { GameUser, IGame } from 'database/models/game';
import { Button, Center, Heading, Text, Tooltip, VStack } from '@chakra-ui/react';
import styles from './[id].module.scss';
import useSocket from 'hooks/useSocket';
import mongoConnection from 'database/mongoConnection';
import { useRouter } from 'next/router';
import PlayerImage from 'components/host/PlayerImage';

type Props = {
    id: string;
    game: IGame
}

const GamePage: React.FC<Props> = (props: Props) => {
    const [gameData, setGameData] = useState<IGame>(props.game);
    const socketContext = useSocket();
    const router = useRouter();

    const onUserUpdate = useCallback((data: Array<GameUser>) => {
        setGameData(previous => { return { ...previous, players: data } });
    }, []);

    useEffect(() => {
        const onUserUpdateId = socketContext.subscribeToOnUserUpdate(onUserUpdate);
        const onStartId = socketContext.subscribeToStart(() => {
            router.push(`/host/play/${props.id}`);
        });
        socketContext.joinRoom(props.game.code);
        // On unmount, unsubscribe from the events
        return () => {
            socketContext.unsubscribeOnUserUpdate(onUserUpdateId);
            socketContext.unsubscribeStart(onStartId);
        }
    }, [socketContext, onUserUpdate, props.game.code, props.id, router]);

    function start() {
        socketContext.startGame(gameData.code);
    }

    const tooltipText = gameData.players.length < 3 ?
        'A minimum of 3 players are required to start the game' :
        'Start the game once everyone is ready!'
    return (
        <VStack className={styles.main}>
            <Heading as='h1'>Waiting for players to join...</Heading>
            <Text id='code' fontSize='2xl'>Join code: {gameData.code}</Text>
            <div className={styles.content}>
                {gameData.players.map(item => (
                    <PlayerImage key={item._id as string} variant='md' player={item} />
                ))}
            </div>
            <Center>
                <Tooltip hasArrow title={tooltipText}>
                    <Button disabled={gameData.players.length < 3} id='start' onClick={start} colorScheme='teal'>Start Game</Button>
                </Tooltip>
            </Center>
        </VStack>
    )
}


export const getServerSideProps: GetServerSideProps = async (context) => {
    // ensure mongo is connected
    await mongoConnection();
    const objId = context.params?.id as string;
    const redirect = {
        redirect: {
            destination: '/host/new',
            permanent: false
        }
    }
    if (!isObjectIdOrHexString(objId)) {
        return redirect;
    }

    const game = await Game.findById(new Types.ObjectId(objId), { '_id': 0, 'rounds._id': 0, 'players._id': 0 }).lean();

    if (!game) {
        return redirect;
    }

    if (game.state !== 'waiting') {
        return {
            redirect: {
                destination: `/host/play/${objId}`,
                permanent: false
            }
        }
    }

    return {
        props: {
            id: objId,
            game
        }
    }
}

export default GamePage;