// This will display a player's image if no webRTC connection, and the view if there is

import { Card, CardHeader, StackDivider } from '@chakra-ui/react';
import Image from 'next/image';
import { FC, useRef } from 'react';
import { GameUser } from 'database/models/game';
import imageSrcToGoogleCloudUrl from 'database/utilities/imageSrcToGoogleCloudUrl';
import styles from './playerimage.module.scss';
import useRtc from 'hooks/useRtc';

type Props = {
    variant: 'xs' | 'sm' | 'md' | 'lg';
    player: GameUser;
    children?: React.ReactNode;
}

const PlayerImage: FC<Props> = ({ variant, player, children }) => {

    const remoteStreamRef = useRef<HTMLVideoElement>(null);
    const rtcConnection = useRtc();

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

    let element: React.ReactNode = <Image
        className={styles.profile}
        width={constraint}
        height={constraint}
        src={imageSrcToGoogleCloudUrl(player.imageURL ?? '')}
        alt={`Player ${player.name}'s avatar`}
    />;

    if (!player.imageURL) {
        element = <p>No image?</p>;
    }

    if (rtcConnection?.remoteId === player._id) {
        element = <video ref={remoteStreamRef} autoPlay playsInline muted width={constraint} />
    }

    if (children) {
        element = children;
    }

    rtcConnection?.setRemoteStreamOnVideoElement(remoteStreamRef);

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
            {element}
        </Card>
    )
}

export default PlayerImage;