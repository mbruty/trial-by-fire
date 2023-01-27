import { Heading, Text, useForceUpdate, VStack } from '@chakra-ui/react';
import { getCookie } from 'cookies-next';
import { isObjectIdOrHexString, Types } from 'mongoose';
import { GetServerSideProps } from 'next';
import { FC, useEffect, useRef, useState } from 'react';
import Bid from 'components/game/Bid';
import Game, { IGame } from 'database/models/game';
import mongoConnection from 'database/mongoConnection';
import useOrangeBackground from 'hooks/useOrangeBackground';
import useSocket from 'hooks/useSocket';
import { RoundState, stateFromString } from 'types/RoundState';
import styles from './[id].module.scss';
import useRtc from 'hooks/useRtc';
import RoundPlay from 'components/game/RoundPlay';

type Props = {
    game: IGame;
    playerId: string;
}

const PlayPage: FC<Props> = (props) => {
    const [gameState, setGameState] = useState(stateFromString(props.game.state));
    const game = props.game;
    const socket = useSocket();
    const rtcConnection = useRtc();
    const localStreamRef = useRef<HTMLVideoElement | null>(null);
    const forceUpdate = useForceUpdate();
    const player = props.game.players.find(x => x._id === props.playerId);
    useOrangeBackground();

    useEffect(() => {
        if (!rtcConnection) return;
        rtcConnection.start().then(() => {
            rtcConnection.joinCall(props.game._id.toString(), props.playerId);
        })

        const id = socket.subscribeToNewOffer((candidate) => {
            rtcConnection.newCandidate(candidate);
        })

        return () => {
            socket.unsubscribeNewOffer(id);
        }
    }, [rtcConnection, props.game._id, socket, props.playerId, forceUpdate]);

    let element: JSX.Element = <></>;

    useEffect(() => {
        socket.joinRoom(props.game.code);
        const id = socket.subscribeToState((data) => {
            setGameState(data);
        });
        return () => {
            socket.unsubscribeState(id);
        }
    }, [socket, props.game.code])

    if (gameState === RoundState.BIDDING) {
        const title = game.rounds[game.currentRound].title;
        const player = game.players.find(x => x._id === props.playerId);



        element = <Bid title={title} beanBalance={player?.beanBalance as number} />
    } else if (gameState === RoundState.STARTING) {
        element = (
            <VStack>
                <Heading as='h1'>Waiting on host to start next round</Heading>
                <Text fontSize='2xl'>Up next: {game.rounds[game.currentRound].title}</Text>
            </VStack>
        );
    } else if (gameState === RoundState.PLAYING) {
        element = <RoundPlay beans={player?.beanBalance ?? 0} playerId={props.playerId} gameId={props.game._id.toString()} />
    }

    rtcConnection?.setLocalStreamOnVideoElement(localStreamRef);
    rtcConnection?.setRemoteStreamOnVideoElement();

    return (
        <div className={styles.main}>
            <div className={styles.container}>
                {{ ...element }}
                {/* <h2>Host</h2>
                <video id='remote' width={464} autoPlay playsInline muted />
                <h2>You</h2>
                <div style={{ width: 300, height: 300, overflow: 'hidden' }}>
                    <video ref={localStreamRef} id='local' width={300} autoPlay playsInline muted />
                </div> */}
            </div>
        </div>
    )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    // ensure mongo is connected
    await mongoConnection();
    const objId = context.params?.id as string;

    if (!isObjectIdOrHexString(objId)) {
        return {
            redirect: {
                destination: '/game',
                permanent: false
            }
        }
    }

    const game = await Game.findById(new Types.ObjectId(objId), { 'rounds._id': 0, }).lean();

    if (!game) {
        return {
            redirect: {
                destination: '/game/404',
                permanent: false
            }
        }
    }

    game.players.forEach(x => { x._id = x._id.toString() })
    game._id = game._id.toString();

    if (game.state === 'waiting') {
        return {
            redirect: {
                destination: '/game/setup',
                permanent: false
            }
        }
    }
    const playerId = getCookie('id', { ...context });

    if (!playerId) {
        return {
            redirect: {
                destination: '/game',
                permanent: false
            }
        }
    }

    return {
        props: {
            game,
            playerId
        }
    }
}
export default PlayPage;