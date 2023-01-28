import React, { useEffect, useRef, useState } from 'react';
import { GetServerSideProps } from 'next';
import { isObjectIdOrHexString } from 'mongoose';
import Game, { GameUser, IGame, Trial } from 'database/models/game';
import { Heading, Text, useToast, VStack } from '@chakra-ui/react';
import styles from './[id].module.scss';
import useSocket from 'hooks/useSocket';
import mongoConnection from 'database/mongoConnection';
import { useRouter } from 'next/router';
import RoundStart from 'components/host/RoundStart';
import PlayerImage from 'components/host/PlayerImage';
import RoundBids from 'components/host/RoundBids';
import { RoundState, stateFromString } from 'types/RoundState';
import RoundPlay from 'components/host/RoundPlay';
import axios, { AxiosResponse } from 'axios';
import Winners from 'components/host/Winners';
import useRtc from 'hooks/useRtc';


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
    const localStreamRef = useRef<HTMLVideoElement>(null);

    const socketContext = useSocket();
    const router = useRouter();
    const rtcConnection = useRtc();
    const toast = useToast();

    // On mount, or when rtc connection changes, set it up
    useEffect(() => {
        // useRtc will return null on the first page load as cannot be setup server-side
        if (!rtcConnection) return;

        toast({
            title: 'Webcam video and audio required',
            description: 'We\'re asking for permissions to use your webcam video and audio so that remote players can still join the fun! This video is not recorded.',
            status: 'info',
            duration: 10_000,
            isClosable: true
        });

        rtcConnection.start();
        socketContext.onceConnected(() => {
            rtcConnection.createOffer(socketContext.getGameId());
        });

        const id = socketContext.subscribeToNewAnswer((candidate) => {
            rtcConnection.newCandidate(candidate);
        })

        const answerId = socketContext.subscribeAnswer((offer) => {
            rtcConnection.remoteId = offer.playerId;
            rtcConnection.answer(offer);
        })

        return () => {
            socketContext.unsubscribeNewOffer(id);
            socketContext.unsubscribeAnswer(answerId);
        }
    }, [rtcConnection, socketContext, props.id, toast]);

    // On mount, update all socket listeners to the game's current state
    // This ensures that everyone is in sync if the host's connection dropped & the page is refreshed
    useEffect(() => {
        socketContext.onceConnected(() => {
            socketContext.updateRoundState(stateFromString(props.game.state));
        });
    }, [props.game.state, socketContext]);

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

    async function onNextRoundClickPlay() {
        socketContext.updateRoundState(RoundState.STARTING);
        setGameState({ ...gameState, roundState: RoundState.STARTING });

        // Refetch the game state
        try {
            const result = await axios.get<null, AxiosResponse<IGame>>(`/api/game/${props.game._id}`);
            setGameData({ ...result.data });
        } catch {

        }
    }

    let element: JSX.Element = <></>;
    let roundText = '';
    if (gameData.currentRound === gameData.rounds.length) {
        roundText = 'Winners';
        element = <Winners players={gameData.players} />
    }

    else if (gameState.roundState === RoundState.STARTING) {
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
        const isFastest = gameData.rounds[gameData.currentRound].type === 'Fastest';
        element = <RoundPlay isFastest={isFastest} onNext={onNextRoundClickPlay} gameId={props.id} timeLeft={gameData.rounds[gameData.currentRound].timeLimit} />
    }

    const half = Math.ceil(gameData.players.length / 2) - 1;
    const firstHalf = gameData.players.slice(0, half);
    const secondHalf = gameData.players.slice(half);

    rtcConnection?.setLocalStreamOnVideoElement(localStreamRef);
    
    const hostPlayer: GameUser = {
        _id: '',
        beanBalance: 0,
        isRemote: false,
        name: 'Host',
        currentBid: 0,
    }
    return (
        <VStack className={styles.main}>
            <Heading as='h1'>{roundText}</Heading>
            <Text fontSize='2xl'>Join the game: {gameData.code}</Text>
            <div className={styles.grid}>

                <VStack>
                    <PlayerImage player={hostPlayer} variant='sm'>
                        <video ref={localStreamRef} id='local' width={256} autoPlay playsInline muted />
                    </PlayerImage>
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

    const game = await Game.findById(objId, { 'rounds._id': 0 }).lean();

    if (!game) {
        return redirect;
    }

    game._id = game._id.toString();
    game.players.forEach(x => x._id = x._id.toString());

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