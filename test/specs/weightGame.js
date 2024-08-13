const SdetChallenge = require('../pageobjects/sdetchallenge.page');
const SdetChallengeSimpleVersion = require('../pageobjects/sdetchallengeSimpleVersion.page');
const cheatUtil = require('../util/cheatUtil.js');
const cheatFile = require('../../cheatFile.json');

describe('SDET Challenge', async () => {

    it('should complete an optimal solution for 9 coins.', async () => {
        console.log('~~~~~~~~~~ START OF LOGS FOR FIRST SOLUTION ~~~~~~~~~~');

        await SdetChallengeSimpleVersion.open();
        const roundOneResult = await SdetChallengeSimpleVersion.roundOne();
        const roundTwoResult = await SdetChallengeSimpleVersion.roundTwo(roundOneResult);
        await SdetChallengeSimpleVersion.selectAnswer(roundTwoResult);

        console.log('~~~~~~~~~~ END OF LOGS FOR FIRST SOLUTION ~~~~~~~~~~');
    })

    it('should complete an optimal solution with arbitrarily many coins.', async () => {
        console.log('~~~~~~~~~~ START OF LOGS FOR SECOND SOLUTION ~~~~~~~~~~');

        await SdetChallenge.open();
        const coins = await SdetChallenge.getCoinIds();
        await SdetChallenge.recursivelyGroupAndCompareCoins(coins);

        console.log('~~~~~~~~~~ END OF LOGS FOR SECOND SOLUTION ~~~~~~~~~~');
    })

    it('should complete by cheating when able and brute force when not able to cheat.', async () => {
        console.log('~~~~~~~~~~ START OF LOGS FOR FINAL SOLUTION ~~~~~~~~~~');

        cheatSelector = cheatFile.selector;
        await SdetChallenge.open();
        const canWeCheat = await SdetChallenge.canWeCheat(cheatSelector);

        if(canWeCheat){
            const number = await SdetChallenge.getCoinNumber(cheatSelector);
            console.log(`Optimal solution is 0 weighings when you cheat. The answer is ${number}.`);
            await SdetChallenge.selectAnswer(cheatSelector);
        } else {
            console.log('I can\'t cheat. Time to brute force my way out of this one.');
            const newValue = await SdetChallenge.bruitForce();
            await SdetChallenge.selectAnswer(cheatSelector + newValue);
            await cheatUtil.writeFile(cheatSelector + newValue);
        }

        console.log('~~~~~~~~~~ END OF LOGS FOR FINAL SOLUTION ~~~~~~~~~~');
    })
    
})
