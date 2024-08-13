const SdetChallenge = require('../pageobjects/sdetchallenge.page');

const SdetChallengeSimpleVersion = require('../pageobjects/sdetchallengeSimpleVersion.page');

const cheatUtil = require('../util/cheatUtil.js');

const cheatFile = require('../../cheatFile.json')

describe('SDET Challenge', async () => {



    it('should complete an optimal solution for 9 coins', async () => {
        
        await SdetChallengeSimpleVersion.open();
        const roundOneResult = await SdetChallengeSimpleVersion.roundOne();
        const roundTwoResult = await SdetChallengeSimpleVersion.roundTwo(roundOneResult);
        await SdetChallengeSimpleVersion.selectAnswer(roundTwoResult);
        
        
    })

    it('should complete as an optimal honest player for arbitrarily many coins', async () => {
        
        await SdetChallenge.open();
        const coins = await SdetChallenge.getCoinIds();
        await SdetChallenge.recursivelyGroupAndCompareCoins(coins);
        
    })

    //This player will first try to cheat. If that doesn't work, it will try bruit force.
    it('should complete as a lazy cheating player', async () => {
        cheatSelector = cheatFile.selector;
        await SdetChallenge.open();
        const coin = await $(cheatSelector);
        const canWeCheat = await coin.isExisting();

        if(canWeCheat){
            const number = await SdetChallenge.getCoinNumber(cheatSelector);

            console.log(`Optimal solution is 0 weighings when you cheat. The answer is ${number}.`);

            await SdetChallenge.selectAnswer(cheatSelector);
        } else {
            const newValue = await SdetChallenge.bruitForce();
            await SdetChallenge.selectAnswer(cheatSelector + newValue);
            await cheatUtil.writeFile(cheatSelector + newValue);
        }
    })

})
