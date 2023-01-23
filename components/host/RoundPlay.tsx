import { Center, Text } from '@chakra-ui/react';
import axios from 'axios';
import { FC, useEffect, useState } from 'react';
import { GameUser } from '../../database/models/game';
import PlayerImage from './PlayerImage';
import styles from './roundplay.module.scss';

type Props = {
    timeLeft?: number;
    isFastest: boolean;
    gameId: string;
    onNext: () => void;
}

function secondsToTime(e: number) {
    const
        m = Math.floor(e % 3600 / 60).toString().padStart(2, '0'),
        s = Math.floor(e % 60).toString().padStart(2, '0');

    return `${m}:${s}`;
}

const RoundPlay: FC<Props> = (props) => {
    const [timeLeft, setTimeLeft] = useState((props.timeLeft ?? 0) * 60);
    const [isStarted, setIsStarted] = useState(false);
    const [players, setPlayers] = useState<Array<GameUser> | undefined>();

    // On mount, fetch the top 2 betters
    useEffect(() => {
        axios.get<Array<GameUser>>(`/api/game/${props.gameId}/bets`)
            .then(res => setPlayers(res.data.slice(0, 2)))
            .catch(console.error);
    }, [props.gameId]);

    useEffect(() => {
        let interval: NodeJS.Timer | undefined;
        if (isStarted && !props.isFastest) {
            interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev > 0) return prev - 1;
                    return prev;
                });
            }, 1000)
        }

        return () => {
            clearInterval(interval);
        }
    }, [isStarted, props.isFastest])

    function onClick() {
        setIsStarted(true);
    }

    async function onWinnerClick(idx: number) {
        try {
            if (!players) return;
            await axios.post('/api/game/win', {
                playerId: players[idx]._id,
                gameId: props.gameId
            });
            props.onNext();
        } catch {

        }
    }

    if (players === undefined) {
        return null
    }

    // If it's over, select who won
    if (timeLeft === 0 || props.isFastest) {

        return (
            <div className={styles.main}>
                <div className={styles.playergrid}>
                    <div className={styles.click} onClick={() => onWinnerClick(0)}>
                        <PlayerImage player={players[0]} variant='md' />
                    </div>
                    <div className={styles.click} onClick={() => onWinnerClick(1)}>
                        <PlayerImage player={players[1]} variant='md' />
                    </div>
                </div>
                <Center><Text paddingTop='4' fontSize='2xl' fontWeight='bold'>Who won?</Text></Center>
            </div>
        )
    }

    return (
        <Center>
            <div className={styles.main}>
                <div className={styles.playergrid}>
                    <PlayerImage player={players[0]} variant='md' />
                    <PlayerImage player={players[1]} variant='md' />
                </div>
                <div className={styles.outercircle + ' ' + styles.circle} />
                <div className={styles.circle} onClick={onClick}>
                    {!isStarted && <div onClick={onClick}><Text fontWeight='bold' fontSize='xl'>Start trial</Text></div>}
                    {isStarted && <div><Text fontWeight='bold' fontSize='xl'>{secondsToTime(timeLeft)}</Text></div>}
                </div>
            </div>
        </Center>
    )
}

export default RoundPlay;