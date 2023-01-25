// This will display a player's image if no webRTC connection, and the view if there is

import { Card, CardHeader, StackDivider } from '@chakra-ui/react';
import Image from 'next/image';
import { FC } from 'react';
import { GameUser } from 'database/models/game';
import imageSrcToGoogleCloudUrl from 'database/utilities/imageSrcToGoogleCloudUrl';
import styles from './playerimage.module.scss';

type Props = {
    variant: 'xs' | 'sm' | 'md' | 'lg';
    player: GameUser
}

const PlayerImage: FC<Props> = ({ variant, player }) => {
    if (player === undefined) return null;
    let constraint = 0;

    if (variant === 'xs') {
        constraint = 128;
    }

    else if (variant === 'sm') {
        constraint = 256;
    }

    else if (variant === 'md') {
        constraint = 512;
    }

    else if (variant === 'lg') {
        constraint = 1024;
    }


    return (
        <Card data-test-id={`player-${player.name}`} className={styles.card} maxW='sm' variant='elevated'>
            <CardHeader className={styles['card-heading']} fontSize='xl'>{player.name}</CardHeader>
            <StackDivider />
            <Image
                alt='Fire'
                width={constraint}
                height={constraint}
                className={styles.fire}
                src='https://storage.googleapis.com/trial-by-fire/Fire.svg'
            />
            {player.imageURL ?
                <Image
                    className={styles.profile}
                    width={constraint}
                    height={constraint}
                    src={imageSrcToGoogleCloudUrl(player.imageURL)}
                    alt={`Player ${player.name}'s avatar`}
                /> :
                <p>No image?</p>
            }
        </Card>
    )
}

export default PlayerImage;