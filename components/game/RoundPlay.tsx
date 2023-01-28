import { Button, FormControl, FormLabel, Heading, HStack, Input, Text, useToast, VStack } from '@chakra-ui/react';
import axios from 'axios';
import PlayerImage from 'components/host/PlayerImage';
import { GameUser } from 'database/models/game';
import { FC, useEffect, useState } from 'react';
import styles from './roundbid.module.scss';

type Props = {
    playerId: string;
    gameId: string;
    beans: number;
}

const RoundPlay: FC<Props> = (props) => {
    const [players, setPlayers] = useState<Array<GameUser> | null>(null);
    const [amount, setAmount] = useState<number | undefined>();
    const [selectedPlayer, setSelectedPlayer] = useState<number | undefined>();
    const [error, setError] = useState<string | undefined>();
    const toast = useToast();

    useEffect(() => {
        axios.get(`/api/game/${props.gameId}/bets`)
            .then(response => {
                setPlayers(response.data);
            })
    }, [props.gameId]);

    function onSubmit() {
        if (!amount || amount < 1) {
            setError('Please enter a valid amount');
            return
        } else if (amount > props.beans) {
            setError('Your bet cannot be more than the avalible 🫘');
            return
        } else if (selectedPlayer === undefined) {
            setError('Please select a player');
            return
        } else if (selectedPlayer > 1 || !players) {
            setError('An error occured, please refresh the page');
            return
        } else {
            setError(undefined);
        }

        axios.post(`/api/game/${props.gameId}/bets`, {
            playerId: props.playerId,
            gameId: props.gameId,
            amount,
            selectedPlayer: players[selectedPlayer]._id
        }).catch(() => {
            toast({
                title: 'Bet error',
                description: 'There was an error submitting your bet, please try again',
                duration: 3000,
                isClosable: true,
                status: 'error'
            });
        }).then(() => {
            toast({
                title: 'Bet processed',
                description: 'Your bet was processed and accepted.',
                duration: 3000,
                isClosable: true,
                status: 'success'
            });
        })
    }

    if (!players) {
        return <Text>Loading...</Text>
    }

    return (
        <VStack className={styles.container} spacing='1rem'>
            <Heading as='h1'>{players[0].name} VS {players[1].name}</Heading>
            <Heading as='h2'>Who will win?</Heading>
            <p>Place your bets, and get 150% back if they win!</p>
            <p>You have {props.beans} 🫘 left</p>
            <FormControl>
                <FormLabel>Bet amount</FormLabel>
                <Input type='number' value={amount} onChange={e => setAmount(parseInt(e.target.value))} />
            </FormControl>
            <Text>Who will win?</Text>
            <HStack gap='1em'>
                <div className={selectedPlayer === 0 ? styles.selected : ''} onClick={() => setSelectedPlayer(0)}>
                    <PlayerImage player={players[0]} variant='xs' />
                </div>
                <div className={selectedPlayer === 1 ? styles.selected : ''} onClick={() => setSelectedPlayer(1)}>
                    <PlayerImage player={players[1]} variant='xs' />
                </div>
            </HStack>
            <Button variant='solid' colorScheme='whatsapp' onClick={onSubmit}>Submit</Button>
            {error && <p className='error'>{error}</p>}
        </VStack>
    );
}

export default RoundPlay;