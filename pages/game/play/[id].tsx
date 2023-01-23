import { Heading, Text, VStack } from '@chakra-ui/react';
import { getCookie } from 'cookies-next';
import { isObjectIdOrHexString, Types } from 'mongoose';
import { GetServerSideProps } from 'next';
import { FC, useEffect, useState } from 'react';
import Bid from 'components/game/Bid';
import Game, { IGame } from 'database/models/game';
import mongoConnection from 'database/mongoConnection';
import useOrangeBackground from 'hooks/useOrangeBackground';
import useSocket from 'hooks/useSocket';
import { RoundState, stateFromString } from 'types/RoundState';
import styles from './[id].module.scss';

type Props = {
    game: IGame;
    playerId: string;
}

const PlayPage: FC<Props> = (props) => {
    const [gameState, setGameState] = useState(stateFromString(props.game.state));
    const game = props.game;
    const socket = useSocket();
    useOrangeBackground();

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
    }

    else {
        element = (
            <VStack>
                <Heading as='h1'>Waiting on host to start next round</Heading>
                <Text fontSize='2xl'>Up next: {game.rounds[game.currentRound].title}</Text>
            </VStack>
        );
    }

    return (
        <div className={styles.main}>
            <div className={styles.container}>
                {{ ...element }}
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

    const game = await Game.findById(new Types.ObjectId(objId), { '_id': 0, 'rounds._id': 0, }).lean();

    if (!game) {
        return {
            redirect: {
                destination: '/game/404',
                permanent: false
            }
        }
    }

    game.players.forEach(x => { x._id = x._id.toString() })

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