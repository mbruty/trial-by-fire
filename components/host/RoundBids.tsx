import { Box, Button, Heading, HStack, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, VStack } from '@chakra-ui/react';
import axios from 'axios';
import Image from 'next/image';
import { FC, useCallback, useEffect, useState } from 'react';
import { GameUser, IGame, Trial } from 'database/models/game';
import imageSrcToGoogleCloudUrl from 'database/utilities/imageSrcToGoogleCloudUrl';
import useSocket from 'hooks/useSocket';
import styles from './roundstart.module.scss';

type Props = {
    currentRound: Trial
    game: IGame
    onNext: () => void;
}

const RoundBids: FC<Props> = ({ currentRound, game, onNext }) => {
    const [timeLeft, setTimeLeft] = useState(game.biddingSeconds);
    const [maxBid, setMaxBid] = useState(0);
    const [errors, setErrors] = useState<string | null>();
    const [topBids, setTopBids] = useState<Array<GameUser>>([]);
    const socket = useSocket();

    // Subscribe to the bid event on mount
    useEffect(() => {
        const id = socket.subscribeToBid((bid: number) => {
            setMaxBid((prev) => prev < bid ? bid : prev);
        });

        return () => {
            socket.unsubscribeBid(id);
        }
    }, [socket]);

    // When the timer is down to 0, see who the two winners are
    useEffect(() => {
        const controller = new AbortController();
        if (timeLeft === 0) {
            // iife as useEffect cannot be async
            (async () => {
                try {
                    const result = await axios.get(`/api/game/${socket.getGameId()}/bets`, {
                        signal: controller.signal
                    });
                    setTopBids(result.data);
                } catch (e) {
                    setErrors('There was an error with bidding, please reset the round and try again');
                }
            })()
        }

        return () => {
            // Abort the request if this component unmounts, or something funky happens with the timeleft
            controller.abort();
        }
    }, [timeLeft, socket])

    const decrementTimer = useCallback(() => {
        if (timeLeft !== 0) {
            setTimeLeft(prev => prev - 1);
        }
    }, [timeLeft]);


    useEffect(() => {
        const interval = setInterval(decrementTimer, 1000);

        return () => {
            clearInterval(interval);
        }

    }, [decrementTimer]);

    return (
        <div className={styles.main}>
            <VStack>
                <Heading as='h2' fontSize='2xl'>{currentRound.title}</Heading>
                <Text fontSize='2xl'>Time left: {timeLeft} seconds</Text>
                <Text fontSize='2xl'>Highest bid: {maxBid}🫘</Text>

                {errors && <p className='error'>{errors}</p>}

                <Button onClick={onNext} colorScheme='teal' disabled={timeLeft !== 0}>Continue</Button>
                {topBids && (
                    <Box style={{ marginTop: '1rem' }} className='container' borderRadius='md' borderColor='white' borderWidth='thin'>
                        <TableContainer>
                            <Table variant='simple'>
                                <Thead>
                                    <Tr>
                                        <Th><Text fontSize='2xl'>Player</Text></Th>
                                        <Th><Text fontSize='2xl'>Bid ammount</Text></Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {topBids.slice(0, 2).map(x => (
                                        <Tr key={x._id as string}>
                                            <Td>
                                                <HStack>
                                                    {x.imageURL &&
                                                        <Image
                                                            width={64}
                                                            height={64}
                                                            src={imageSrcToGoogleCloudUrl(x.imageURL)}
                                                            alt={`Player ${x.name}'s picture`}
                                                        />
                                                    }
                                                    <Text fontSize='2xl'>{x.name}</Text>
                                                </HStack>
                                            </Td>
                                            <Td><Text fontSize='2xl'>{x.currentBid}</Text></Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}
            </VStack>

        </div>
    )
}

export default RoundBids;