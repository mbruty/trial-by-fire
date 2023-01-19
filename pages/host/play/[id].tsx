import React, { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { isObjectIdOrHexString, Types } from 'mongoose';
import Game, { IGame, Trial } from 'database/models/game';
import { Heading, Text, VStack } from '@chakra-ui/react';
import styles from './[id].module.scss';
import useSocket from 'hooks/useSocket';
import mongoConnection from 'database/mongoConnection';
import { useRouter } from 'next/router';
import RoundStart from 'components/host/RoundStart';
import PlayerImage from 'components/host/PlayerImage';
import RoundBids from 'components/host/RoundBids';
import { RoundState, stateFromString } from 'types/RoundState';
import RoundPlay from 'components/host/RoundPlay';


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
        roundState: stateFromString(props.game.state)
    });

    const socketContext = useSocket();
    const router = useRouter();

    useEffect(() => {
        const onUserUpdateId = socketContext.subscribeToOnUserUpdate((data) => {
            setGameData(previous => { return { ...previous, players: data } });
        });
        const onStartId = socketContext.subscribeToStart(() => {
            router.push(`/host/play/${props.id}`);
        });
        socketContext.joinRoom(props.game.code);
        // On unmount, unsubscribe from the events
        return () => {
            socketContext.unsubscribeOnUserUpdate(onUserUpdateId);
            socketContext.unsubscribeStart(onStartId);
        }
    }, [socketContext, props.game.code, props.id, router]);

    function onStartRoundClick() {
        socketContext.updateRoundState(RoundState.BIDDING);
        setGameState({ ...gameState, roundState: RoundState.BIDDING });
    }

    function onNextRoundClickBid() {
        socketContext.updateRoundState(RoundState.PLAYING);
        setGameState({ ...gameState, roundState: RoundState.PLAYING });
    }

    let element: JSX.Element = <></>;
    let roundText = '';
    if (gameState.roundState === RoundState.STARTING) {
        roundText = 'Current Scores';
        element = <RoundStart
            onStartRoundClick={onStartRoundClick}
            players={gameData.players}
            roundTitle={gameData.rounds[gameData.currentRound].title}
        />;
    }

    else if (gameState.roundState === RoundState.BIDDING) {
        roundText = 'Place your bids';
        element = <RoundBids onNext={onNextRoundClickBid} game={gameData} currentRound={gameState.currentRound} />
    }

    else if (gameState.roundState === RoundState.PLAYING) {
        roundText = gameData.rounds[gameData.currentRound].title;
        element = <RoundPlay gameId={props.id} timeLeft={gameData.rounds[gameData.currentRound].timeLimit} />
    }

    const half = Math.ceil(gameData.players.length / 2);
    const firstHalf = gameData.players.slice(0, half);
    const secondHalf = gameData.players.slice(half);


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

    const game = await Game.findById(new Types.ObjectId(objId), { 'rounds._id': 0, 'players._id': 0 }).lean();

    if (!game) {
        return redirect;
    }

    game._id = game._id.toString();

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