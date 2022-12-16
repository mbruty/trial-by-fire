import { isObjectIdOrHexString, Types } from 'mongoose';
import { GetServerSideProps } from 'next';
import { FC } from 'react';
import Game from '../../../database/models/game';
import mongoConnection from '../../../database/mongoConnection';
import styles from './[id].module.scss';
type Props = {

}

const PlayPage: FC<Props> = (props) => {
    return null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    // ensure mongo is connected
    await mongoConnection();
    const objId = context.params?.id as string;

    if (!isObjectIdOrHexString(objId)) {
        return {
            redirect: {
                destination: '/host/new',
                permanent: false
            }
        }
    }

    const game = await Game.findById(new Types.ObjectId(objId), { '_id': 0, 'rounds._id': 0, 'players._id': 0 }).lean();

    if (!game) {
        return {
            redirect: {
                destination: '/game/404',
                permanent: false
            }
        }
    }

    if (game.state === 'waiting') {
        return {
            redirect: {
                destination: '/game/setup',
                permanent: false
            }
        }
    }

    return {
        props: {
            game
        }
    }
}