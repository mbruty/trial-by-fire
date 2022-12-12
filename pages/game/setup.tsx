import React from 'react';
import styles from './setup.module.scss';
import Camera from '../../components/Camera';
import { RoomData } from '.';
import { Heading } from '@chakra-ui/react';
import { Stack, HStack, VStack } from '@chakra-ui/react'
import { useRouter } from 'next/router';
import axios from 'axios';

export default function setupPage() {
    const [roomData, setRoomData] = React.useState<RoomData>()
    const [imageUrl, setImageUrl] = React.useState<string | null>(null);
    const [imageSaved, setImageSaved] = React.useState(false);
    const router = useRouter();

    React.useEffect(() => {
        const data = localStorage.getItem('room-data');
        if (data) {
            setRoomData(JSON.parse(data));
        }
    }, []);

    async function uploadToServer(data: string) {
        if (!roomData || !roomData.ID) {
            router.push('/game');
            return;
        }
        const body: ImageUploadBody = {
            gameCode: roomData.gameCode,
            userId: roomData.ID,
            imageBase64: data
        };

        setImageUrl(data);
        const res = await axios.post('/api/image/upload', body);

        if (res.status == 200) {
            setImageSaved(true);
        }
        
    };

    function onReset() {
        setImageSaved(false);
    }

    if (!roomData) return null;

    return (
        <div className={styles.main}>
            <VStack className={styles.container} spacing='1rem'>
                <Heading as='h1'>Hello {roomData.name}</Heading>
                <p>Lets get you setup</p>
                <Camera onSubmit={uploadToServer} onReset={onReset} isSaved={imageSaved} />
                <p>Waiting on the host to start the game...</p>
            </VStack>
        </div>
    );
}