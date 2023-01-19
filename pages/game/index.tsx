import React, { FC, useState } from 'react';
import styles from './index.module.scss'
import { boolean, InferType, object, string, ValidationError } from 'yup';
import { useRouter } from 'next/router';
import { Button, Heading, Input, VStack } from '@chakra-ui/react';
import axios, { AxiosResponse } from 'axios';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import useOrangeBackground from 'hooks/useOrangeBackground';

const formSchema = object({
    ID: string().nullable(),
    gameCode: string().required('Game code cannot be empty').length(8, 'Is this meant to be a valid number, or are your friends playing tricks on you?').matches(/\d\d-\d\d-\d\d/, 'Game Code must be in the format 11-22-33'),
    name: string().required('Name cannot be empty').max(12, 'Your name is too long!'),
    isRemote: boolean().required('Please select if you are in person, or remote'),
});

export type RoomData = InferType<typeof formSchema>;

const IndexPage: FC = () => {
    const [data, setData] = useState<RoomData>({ gameCode: '', name: '', isRemote: false, ID: null });
    const [errors, setErrors] = useState({ gameCode: '', name: '', isRemote: '' });
    const router = useRouter();
    useOrangeBackground();
    function update(inData: RoomData) {
        inData.gameCode = inData.gameCode?.replace(/-/g, '');
        inData.gameCode = inData.gameCode?.split('').map((element, index) => {
            if (index & 1) {
                return element + '-';
            }
            return element;
        }).join('');

        // If the code ends in a hyphen, remove it
        if (inData.gameCode?.endsWith('-')) {

            inData.gameCode = inData.gameCode.substring(0, inData.gameCode.length - 1);
        }
        setData(inData);
    }

    async function onJoinClick() {
        // Handle form validation
        try {
            await formSchema.validate(data, { abortEarly: false });
        } catch (e) {
            if (e instanceof ValidationError) {
                // Create an empty error object
                const errors = { gameCode: '', name: '', isRemote: '' };
                e.inner.forEach((error) => {
                    if (error.path == 'gameCode') {
                        errors.gameCode += error.errors[0] + '\n';
                    } else if (error.path == 'name') {
                        errors.name += error.errors[0] + '\n';
                    }
                    if (error.path == 'isRemote') {
                        errors.isRemote += error.errors[0] + '\n';
                    }
                });

                // Remove any trailing new line
                errors.gameCode = errors.gameCode.trim();
                errors.name = errors.name.trim();
                errors.isRemote = errors.isRemote.trim();
                setErrors(errors);
                return;
            } else {
                console.log(e);
                return;
            }
        }

        // If form validation passed, try inserting into the database
        try {
            const body: JoinRoomBody = { ...data };
            const response = await axios.post<JoinRoomBody, AxiosResponse<JoinRoomResponse>>('/api/game/join', body)

            if (response.status === 200) {
                // Navigate to next page
                router.push('/game/setup');
            }
        } catch (e) {
            setErrors({ ...errors, gameCode: 'That game does not exsist' });
        }
    }

    return (
        <>
            <Head>
                <title>Trials by fire - Join a game</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className={styles.app}>
                <VStack className={styles.container} spacing='1rem'>
                    <Heading as='h1'>Join a game</Heading>
                    <label htmlFor='game-code'>Game Code</label>
                    <Input pattern='\d*' type='text' id='game-code' value={data.gameCode} onChange={e => update({ ...data, gameCode: e.target.value })} />
                    {errors.gameCode && errors.gameCode.split('\n').map((x, idx) => (
                        <p key={idx} className='error'>{x}</p>
                    ))}
                    <label htmlFor='game-code'>Name <span className={styles['not-bold']}>(max 12)</span></label>
                    <Input type='text' id='game-code' value={data.name} onChange={e => update({ ...data, name: e.target.value })} />
                    {errors.name && <p className='error'>{errors.name}</p>}
                    <p>Are you in-person or remote?</p>
                    <form className={styles['radio-container']}>
                        <input checked={!data.isRemote} type='radio' id='in-person' name='radio' onChange={() => update({ ...data, isRemote: false })} />
                        <label className={styles['border-right']} htmlFor='in-person'>In person</label>
                        <input checked={data.isRemote} type='radio' id='remote' name='radio' onChange={() => update({ ...data, isRemote: true })} />
                        <label className={styles['border-left']} htmlFor='remote'>Remote</label>
                        {errors.isRemote && <p className='error'>{errors.isRemote}</p>}
                    </form>
                    <Button colorScheme='whatsapp' onClick={onJoinClick}>Join</Button>
                </VStack>
            </div></>
    )
}

export const getServerSideProps: GetServerSideProps = async (context) => {

    // If the user has already joined a room
    if (context.req.cookies['room-id']) {
        return {
            redirect: {
                destination: '/game/rejoin',
                permanent: false
            }
        }
    }

    return {
        props: {
        }
    }
}

export default IndexPage;