import React, { useCallback, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { isObjectIdOrHexString, Types } from 'mongoose';
import Game, { GameUser, IGame, Trial } from '../../../database/models/game';
import { Heading, Text, VStack } from '@chakra-ui/react';
import styles from './[id].module.scss';
import useSocket from '../../../hooks/useSocket';
import mongoConnection from '../../../database/mongoConnection';
import { useRouter } from 'next/router';
import RoundStart from '../../../components/host/RoundStart';
import PlayerImage from '../../../components/host/PlayerImage';
import RoundBids from '../../../components/host/RoundBids';


enum RoundState {
    STARTING,
    BIDDING,
    PLAYING,
    ENDING
}

type GameState = {
    currentRound: Trial
    roundState: RoundState
}

type Props = {
    id: string;
    game: IGame
}

const GamePage: React.FC<Props> = (props: Props) => {
    const [gameData, setGameData] = useState<IGame>(props.game);
    const [gameState, setGameState] = useState<GameState>({
        currentRound: props.game.rounds[props.game.currentRound],
        roundState: RoundState.STARTING
    });

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

    function onNextRoundClick() {
        const currentRound = gameData.rounds[gameData.currentRound];
        setGameState({ currentRound, roundState: RoundState.BIDDING });

        setGameData({ ...gameData, currentRound: gameData.currentRound + 1 });
    }

    let element: JSX.Element = <></>;
    let roundText = '';
    if (gameState.roundState === RoundState.STARTING) {
        const nextRoundTitle = gameData.rounds.length > gameData.currentRound ?
            gameData.rounds[gameData.currentRound + 1].title : 'End of game';
        roundText = 'Current Scores';
        element = <RoundStart
            onNextRoundClick={onNextRoundClick}
            players={gameData.players}
            nextRoundTitle={nextRoundTitle}
        />;
    }

    else if (gameState.roundState === RoundState.BIDDING) {
        roundText = 'Place your bids';
        element = <RoundBids game={gameData} currentRound={gameState.currentRound} />
    }

    const half = Math.ceil(props.game.players.length / 2);
    const firstHalf = props.game.players.slice(0, half);
    const secondHalf = props.game.players.slice(half);


    return (
        <VStack className={styles.main}>
            <Heading as='h1'>{roundText}</Heading>
            <Text fontSize='2xl'>Join the game: {gameData.code}</Text>
            <div className={styles.grid}>
                <VStack>
                    {firstHalf.map(x => (
                        <PlayerImage key={x._id as string} variant='sm' player={x} />
                    ))}
                </VStack>
                {{ ...element }}
                <VStack>
                    {secondHalf.map(x => (
                        <PlayerImage key={x._id as string} variant='sm' player={x} />
                    ))}
                </VStack>
            </div>
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

    if (game.state === 'waiting') {
        return {
            redirect: {
                destination: `/host/lobby/${objId}`,
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