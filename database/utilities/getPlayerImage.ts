import mongoose from 'mongoose';
import Game, { IGame } from 'models/game';

async function getPlayerImage(gameCode: string, userId: string) {
    // Get the players image url and delete
    const game = await Game.aggregate<IGame>(
        [
            {
                '$match': {
                    'code': gameCode
                }
            }, {
                '$project': {
                    'players': {
                        '$filter': {
                            'input': '$players',
                            'as': 'item',
                            'cond': {
                                '$eq': [
                                    '$$item._id', new mongoose.Types.ObjectId(userId)
                                ]
                            }
                        }
                    }
                }
            }
        ]
    )

    if (game.length > 1 || game[0].players.length > 1) {
        return null;
    }

    return game[0].players[0].imageURL;
}

export default getPlayerImage;