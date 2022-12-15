import React, { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { isObjectIdOrHexString, Types } from 'mongoose';
import Game, { GameUser, IGame } from '../../database/models/game';
import { Button, Card, CardHeader, Center, Flex, Grid, Heading, Image, StackDivider, Text, VStack } from '@chakra-ui/react';
import imageSrcToGoogleCloudUrl from '../../database/utilities/imageSrcToGoogleCloudUrl';
import styles from './[id].module.scss';
import useSocket from '../../hooks/useSocket';
import mongoConnection from '../../database/mongoConnection';
type Props = {
    id: string;
    game: IGame
}

const GamePage: React.FC<Props> = (props: Props, context: any) => {
    const socketContext = useSocket();
    const [gameData, setGameData] = useState<IGame>(props.game);

    function onUserUpdate(data: Array<GameUser>) {
        setGameData({ ...gameData, players: data });
    }

    useEffect(() => {
        const onUserUpdateId = socketContext.subscribeToOnUserUpdate(onUserUpdate);

        socketContext.joinRoom(props.game.code);
        // On unmount, unsubscribe from the events
        return () => {
            socketContext.unsubscribeOnUserUpdate(onUserUpdateId);
        }
    }, [socketContext]);

    function start() {
        socketContext.startGame(gameData.code, props.id);
    }

    return (
        <VStack className={styles.main}>
            <Heading as='h1'>Waiting for players to join...</Heading>
            <Text fontSize='2xl'>Join code: {gameData.code}</Text>
            <div className={styles.content}>
                {gameData.players.map(item => (
                    <Card className={styles.card} maxW='sm' variant='elevated'>
                        <CardHeader className={styles['card-heading']} fontSize='xl'>{item.name}</CardHeader>
                        <StackDivider />
                        {item.imageURL &&
                            <>
                                <Image
                                    borderRadius='md'
                                    className={styles.fire}
                                    src='https://storage.googleapis.com/trial-by-fire/Fire.svg'
                                />
                                {item.imageURL ?
                                    <Image
                                        className={styles.profile}
                                        height={200}
                                        width={200}
                                        borderRadius='md'
                                        src={imageSrcToGoogleCloudUrl(item.imageURL)}
                                        alt={`Player ${item.name}'s avatar`}
                                    /> :
                                    <Image
                                        className={styles.profile}
                                        height={200}
                                        width={200}
                                        borderRadius='md'
                                        src='https://w7.pngwing.com/pngs/845/519/png-transparent-computer-icons-avatar-avatar-heroes-logo-fictional-character.png }'
                                        alt={`Player ${item.name}'s avatar`}
                                    />
                                }
                            </>
                        }
                    </Card>
                ))}
            </div>
            <Center>
                <Button onClick={start} colorScheme='teal'>Start Game</Button>
            </Center>
        </VStack>
    )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    // ensure mongo is connected
    await mongoConnection();
    const objId = context.params?.id as string;

    if (!isObjectIdOrHexString(objId)) {
        return {
            redirect: {
                destination: '/host/new',
                permanent: false
            }
        }
    }

    const game = await Game.findById(new Types.ObjectId(objId), { '_id': 0, 'rounds._id': 0, 'players._id': 0 }).lean();

    if (!game) {
        return {
            redirect: {
                destination: '/host/new',
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