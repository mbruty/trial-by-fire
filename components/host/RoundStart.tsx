import { Box, Button, Center, Heading, HStack, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react';
import Image from 'next/image';
import { FC, useEffect } from 'react'
import { GameUser } from '../../database/models/game';
import imageSrcToGoogleCloudUrl from '../../database/utilities/imageSrcToGoogleCloudUrl';
import styles from './roundstart.module.scss';

type Props = {
    players: Array<GameUser>;
    roundTitle: string;
    onStartRoundClick: () => void;
}

const RoundStart: FC<Props> = ({ players, roundTitle, onStartRoundClick }) => {

    useEffect(() => {
        let goingDown = true;
        const interval = setInterval(() => {

            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
                goingDown = false;
            } else if (window.scrollY === 0) {
                goingDown = true;
            }
            const scrollTo = goingDown ? window.scrollY + 1 : window.scrollY - 1;
            window.scrollTo({ top: scrollTo, left: 0, behavior: 'smooth' })
        }, 50);

        window.onwheel = () => {
            clearInterval(interval);
        }

        // Tidy up interval and listeners on component unmount
        return () => {
            window.onwheel = () => null;
            clearInterval(interval);
        }
    }, [])

    const sorted = players.sort((a, b) => b.beanBalance - a.beanBalance);

    return (
        <div className={styles.main}>
            <Center>
                <Heading as='h2' fontSize='2xl'>Next up: {roundTitle}</Heading>
            </Center>
            <Center style={{ margin: '1rem 0' }}>
                <Button onClick={() => onStartRoundClick()} colorScheme='teal' variant='solid'>Start round</Button>
            </Center>
            <div>
                <Box className='container' borderRadius='md' borderColor='white' borderWidth='thin'>
                    <TableContainer>
                        <Table variant='simple'>
                            <Thead>
                                <Tr>
                                    <Th><Text fontSize='2xl'>Player</Text></Th>
                                    <Th><Text fontSize='2xl'>Betting beans</Text></Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {sorted.map(x => (
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
                                        <Td><Text fontSize='2xl'>{x.beanBalance}</Text></Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </TableContainer>
                </Box>
            </div>
        </div>
    )
}

export default RoundStart;