const { $ } = require('@wdio/globals')
const Page = require('./page');

/**
 * sub page containing specific selectors and methods for a the page http://sdetchallenge.fetch.com/
 * I specifically chose to assume there may be arbitrarily many coins to compare and tried to make
 * as few assumptions as possible. I tried to keep as much of the test dynamic as possible.
 */

class SdetChallenge extends Page {


    async getCoinIds(logRoundsNeeded = true){
        const coins = await $$('.coins button');
        const numberOfCoins = coins.length;

        if(logRoundsNeeded){
            /* Note, due to rounding when calculating the log base 2 values, this number may be off by 
            * In fact, log base ten, (ie using `Math.log(9)/Math.log(3)`) resolves to 
            * 2.0000000000000004 instead of 2 and an estimate of 3 rounds! log2 may also have rounding
            * errors, but it at least shown the exact number of comparisons for 9.
            */
            const roundsNeeded = Math.ceil(Math.log2(numberOfCoins) / Math.log2(3));
            console.log (`We have ${numberOfCoins} bars. Solution guarenteed in ${roundsNeeded} rounds or less`)
        }

        const coinIds = [];
        for(const coin of coins){
            const coinId = await coin.getProperty('id');
            coinIds.push(coinId);
            await this.getCoinNumber(`#${coinId}`);
        };
        return coinIds;
    }

    async getCoinNumber(coinSelector){
        //I don't want to assume that the coin's ID will always correlate to the coin's number
        // so I will dynamically look it up every time.
        const coin = await $(coinSelector)
        const coinNumber = await coin.getText();
        return coinNumber;
    }

    async recursivelyGroupAndCompareCoins(coinIds){
        if(coinIds.length == 1){
            console.log(`The answer is ${coinIds[0]}`);
            return this.selectAnswer(coinIds[0]);
        }
        const groupedCoins = await this.groupCoins(coinIds);
        const newGroup = await this.comparison(groupedCoins.groupA, groupedCoins.groupB, groupedCoins.groupC);
 
        await this.clickReset();

        return this.recursivelyGroupAndCompareCoins(newGroup);
    }

    async groupCoins(coinIds){

        /*
        * If the coins are evenly divisible by 3, I want them all to be the same size
        * If the coins have a remainder of 1, I want groupA and groupB to have one less coin than groupC
        * If the coins have a remainder of 2, I wand groupA and groupB to have one more coin than groupC
        * Luckily, simple rounding will solve resolve this perfectly.
        *  If the coins are evenly divisible, than Math.round(coinIds.length/3) = coindIds.length/3
        *  If the coins have a remainder of 1, then Math.round(coinIds.length/3) will round down and
        *  groupC will have one additional coin.
        *  If the coins have a remainder of 3, then Math.round(coinIds.length/3) will round up and
        *  groupA and groupB will get one additional coin.
        */
        const groupSize = Math.round(coinIds.length/3);

        const groups = {};
        groups.groupA = coinIds.splice(0, groupSize);
        groups.groupB = coinIds.splice(0 , groupSize);
        groups.groupC = coinIds

        return groups;
    }

    async comparison(leftBowlContents, rightBowlContents, unisedContents){

        const leftBowlSquaresSelector = '.square[data-side="left"]';
        const rightBowlSquaresSelector = '.square[data-side="right"]';

        //TODO abort if this returns false
        await this.fillBowl(leftBowlContents, leftBowlSquaresSelector);
        await this.fillBowl(rightBowlContents, rightBowlSquaresSelector);



        const result = await this.clickWeighAndGetResults();

        if(result.includes('=')){
            return(unisedContents);
        } else if(result.includes('>')){
            return (rightBowlContents)
        } else if(result.includes('<')){
            return (leftBowlContents)
        } else{
            console.log('Something unexpected happened while reading results in the comparison() function. Failing the test.')
        }
    }

    async fillBowl(bowlContents, bowlSelector){
        const bowlSquares = await $$(bowlSelector);

        //If the bowl doesn't have enough squares to complete the game in the 
        //optimal number of moves then , the task will abort and fail the test
        if(bowlSquares.length < bowlContents.length){
            console.log("Uh oh, we're going to need a bigger scale for the number of coins we need to compare!");
            return false;
        }
        
        let index = 0;
        for(const coinId of bowlContents){
            const coinNumber = await this.getCoinNumber(`#${coinId}`)
            await bowlSquares[index].setValue(coinNumber);
            index++;
        }
        return true;
    }

    async clickReset(){
        const resetButton = await $('div:nth-child(4) #reset');
        return await resetButton.click();
    }

    async clickWeighAndGetResults(){
        const beforeText = await this.getGameInfoText();
        let newText = beforeText;
        const weighButton = await $('#weigh');
        await weighButton.click();
        await browser.waitUntil(async function () {
            //TODO: Clean this up
            const gameInfo = await $('.game-info ol');
            newText = await gameInfo.getText();
            //const newText = await this.getGameInfoText();
            return newText != beforeText;
        }, {
            timeout: 10000,
            timeoutMsg: 'Expected test results within ten seconds.'
        });

        //By  removing the original text, it's
        //easier to analyze the new results.
        const resultText = newText.replace(beforeText, '');
        console.log(`Weighing comparison result: ${resultText}`);

        return resultText;
    }

    async getGameInfoText(){
        const gameInfo = await $('.game-info ol');
        const gameInfoText = await gameInfo.getText();

        return gameInfoText;
    }

    async selectAnswer(coinSelector){
        console.log(`Selecting the solution ${coinSelector}....wish me luck!`)
        const coin = await $(`#${coinSelector}`);
        await coin.click();

        const alertText = await browser.getAlertText();
        console.log(`The response is: ${alertText}`);

        if(alertText!='Yay! You find it!'){
            throw new Error(`Something went wrong ${number} is not the answer!`);
        } else{
            console.log('WE GOT THE CORRECT ANSWER!!!!!!!!!!')
        }
    }

    async bruitForce(){
        const coins = await this.getCoinIds(false);
        for(const coinSelector of coins){
            try {
                await this.selectAnswer(coinSelector);

                //return coinSelector;
                const coin = await $(`#${coinSelector}`);
                const value = await coin.getAttribute('data-value');

                console.log(`We found a new cheat code: ${value}`);

                return `, button[data-value="${value}"]`;
  
              } catch (error) {
                console.log(`It's not ${coinSelector}.`);
              }
        }
    }

    async open () {
        await super.open('');
    }
}

module.exports = new SdetChallenge();
