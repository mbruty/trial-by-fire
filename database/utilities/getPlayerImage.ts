import Game from 'database/models/game';

async function getPlayerImage(gameCode: string, userId: string): Promise<string | null | undefined> {
    const game = await Game.findOne({ code: gameCode });
    if (!game) return null;
    const player = game.players.find(x => x._id.toString() === userId);
    if (!player) return null;
    return player.imageURL;
}

export default getPlayerImage;