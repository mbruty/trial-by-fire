import { Button, Heading, HStack, VStack } from '@chakra-ui/react';
import axios from 'axios';
import { useRouter } from 'next/router';
import React from 'react';
import { RoomData } from '.';
import styles from './setup.module.scss';

export default function setupPage() {
    const [roomData, setRoomData] = React.useState<RoomData>();
    const router = useRouter();

    React.useEffect(() => {
        const data = localStorage.getItem('room-data');
        if (data) {
            setRoomData(JSON.parse(data));
        }
    }, []);

    if (!roomData) return null;

    async function newGame() {
        localStorage.removeItem('room-data');
        await axios.post<LeaveRoomBody>('/api/game/leave', { id: roomData?.ID, gameCode: roomData?.gameCode });
        router.back();
    }

    return (
        <div className={styles.main}>
            <VStack className={styles.container} spacing='1rem'>
                <Heading as='h1'>Oops, it looks like you've disconnected from your game</Heading>
                <p>
                    Previous game:<br/>
                    Name: {roomData.name}<br/>
                    RoomCode: {roomData.gameCode}<br/>
                </p>
                <HStack spacing='1rem'>
                    <Button colorScheme='teal'>Rejoin</Button>
                    <Button colorScheme='teal' onClick={newGame}>New game</Button>
                </HStack>
            </VStack>
        </div>
    );
}