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
        <Card className={styles.card} maxW='sm' variant='elevated'>
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
                <Image
                    className={styles.profile}
                    width={constraint}
                    height={constraint}
                    src='https://w7.pngwing.com/pngs/845/519/png-transparent-computer-icons-avatar-avatar-heroes-logo-fictional-character.png }'
                    alt={`Player ${player.name}'s avatar`}
                />
            }
        </Card>
    )
}

export default PlayerImage;