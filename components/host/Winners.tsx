import { Center, Flex } from '@chakra-ui/react';
import { GameUser } from 'database/models/game';
import imageSrcToGoogleCloudUrl from 'database/utilities/imageSrcToGoogleCloudUrl';
import Image from 'next/image';
import React, { FC } from 'react';
import styles from './winners.module.scss';
type Props = {
    players: Array<GameUser>
}

const Winners: FC<Props> = ({ players }) => {
    const results = players
        .sort((a, b) => b.beanBalance - a.beanBalance)
        .slice(0, 3);
    return (
        <Center>
            <Flex direction='row' alignItems='flex-end' height='300'>
                <div className={styles.third + ' ' + styles.box}>
                    <Image src={imageSrcToGoogleCloudUrl(results[2].imageURL ?? '')} width={150} height={150} alt={`${results[2].name}'s picture`} />
                    <p>{results[2].beanBalance}🫘</p>
                </div>
                <div className={styles.first + ' ' + styles.box}>
                    <Image src={imageSrcToGoogleCloudUrl(results[0].imageURL ?? '')} width={150} height={150} alt={`${results[0].name}'s picture`} />
                    <p>{results[0].beanBalance}🫘</p>
                </div>
                <div className={styles.second + ' ' + styles.box}>
                    <Image src={imageSrcToGoogleCloudUrl(results[1].imageURL ?? '')} width={150} height={150} alt={`${results[1].name}'s picture`} />
                    <p>{results[1].beanBalance}🫘</p>
                </div>
            </Flex>
        </Center>
    )
}

export default Winners;