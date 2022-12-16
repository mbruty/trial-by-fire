import { Button, Heading, Text, VStack } from '@chakra-ui/react';
import { FC, useCallback, useEffect, useState } from 'react';
import { IGame, Trial } from '../../database/models/game';
import styles from './roundstart.module.scss';

type Props = {
    currentRound: Trial
    game: IGame
    onNext: () => void;
}

const RoundBids: FC<Props> = ({ currentRound, game, onNext }) => {
    const [timeLeft, setTimeLeft] = useState(game.biddingSeconds);

    const decrementTimer = useCallback(() => {
        if (timeLeft !== 0) {
            setTimeLeft(prev => prev - 1);
        }
    }, [timeLeft])
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
                <Text fontSize='2xl'>Highest bid: 100🫘</Text>
                <Button onClick={onNext} colorScheme='teal' disabled={timeLeft !== 0}>Continue</Button>
            </VStack>

        </div>
    )
}

export default RoundBids;