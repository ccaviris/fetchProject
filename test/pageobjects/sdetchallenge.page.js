const { $ } = require('@wdio/globals')
const Page = require('./page');

/**
 * sub page containing specific selectors and methods for a the page http://sdetchallenge.fetch.com/
 * I specifically chose to assume there may be arbitrarily many coins to compare and tried to make
 * as few assumptions as possible. I tried to keep as much of the test dynamic as possible.
 */

class SdetChallenge extends Page {

    /**
    * This returns an array of strings containing all of the id's for the coins on the page
    * @param logROundsNeeded If true, this function will also calculate and print to the conole 
    *                        an estimate of how many weighings will be needed for an optimal solution.
    *                        If false, it will not. Default value is true
    */
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

    /**
    * Takes in a selector for a coin and returns the coin's number
    * @param coinSelector The selector for the coin who's number is to be read
    */
    async getCoinNumber(coinSelector){
        //I don't want to assume that the coin's ID will always correlate to the coin's number
        // so I will dynamically look it up every time.
        const coin = await $(coinSelector)
        const coinNumber = await coin.getText();
        return coinNumber;
    }

    /**
    * Takes in an array of IDs for coin elements and recursively attempts to find the fake.
    * It could take in the full set of coin IDs or any other subset that is known to include
    * the fake coin.
    * @param coinIds An array of IDs for coin elements with one of them being the fake coin
    */
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

    /**
    * Takes in a three way division of coins. The coins to be on the left bowl, right bowl, and not placed.
    * It will place the coins, weigh them, and return a =, <, or, > to summarize the results as follows:
    *           = if the fake coin is in the last third of the coins as divided by groupCoins()
    *           > if the fake coin is in the middle third of the coins as divided by groupCoins()
    *           < if the fake coin is in the first third of the coins as divided by groupCoins()
    * @param leftBowlContents An array of IDs for coin elements to be placed on the left bowl
    * @param rightBowlContents An array of IDs for coin elements to be placed on the left bowl
    * @param unisedContents An array of IDs for coin elements not to be placed in either bowl
    */
    async comparison(leftBowlContents, rightBowlContents, unisedContents){

        const leftBowlSquaresSelector = '.square[data-side="left"]';
        const rightBowlSquaresSelector = '.square[data-side="right"]';

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
            throw new Error('Something unexpected happened while reading results in the comparison() function. Failing the test.')
        }
    }

    /**
    * Places a set of coins in a given cup
    * @param bowlContents An array of string values to be typed into the squares in a given bowl
    * @param bowlSelector A selector that can be used to find all of the squares of a given bowl.
    */
    async fillBowl(bowlContents, bowlSelector){
        const bowlSquares = await $$(bowlSelector);

        //If the bowl doesn't have enough squares to complete the game in the 
        //optimal number of moves then , throw an error and fail the test
        //Note, at the expense of more complex test logic it is possible 
        //for the test to have coninued instead of throwing an error here
        if(bowlSquares.length < bowlContents.length){
            throw new Error('Uh oh, we\'re going to need a bigger scale for the number of coins we need to compare!');
        }
        
        let index = 0;
        for(const coinId of bowlContents){
            const coinNumber = await this.getCoinNumber(`#${coinId}`)
            await bowlSquares[index].setValue(coinNumber);
            index++;
        }
    }

    /**
    * Click the reset button
    */
    async clickReset(){
        const resetButton = await $('div:nth-child(4) #reset');
        return await resetButton.click();
    }

    /**
    *  This function will read the info text, press the reset weigh, wait for the info text to update
    *  then it will return only the new text that was added after pressing the weigh button.
    */
    async clickWeighAndGetResults(){
        const beforeText = await this.getGameInfoText();
        let newText = beforeText;
        const weighButton = await $('#weigh');
        await weighButton.click();
        await browser.waitUntil(async function () {
            const gameInfo = await $('.game-info ol');
            newText = await gameInfo.getText();
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

    /**
    *  This function will read the info text.
    */
    async getGameInfoText(){
        const gameInfo = await $('.game-info ol');
        const gameInfoText = await gameInfo.getText();

        return gameInfoText;
    }

    /**
    * Click on the coin that is expected to be the correct answer
    * @param coinSelector  A selector for the coin to be clicked on
    */
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

    /**
    * This function will use brute force to find the correct answer, trial and error guessing each coin.
    * When it finds the answer, it will return the data-value to be used for cheating. The returned value
    * is formatted to be appended to the end of an existing selector.
    */
    async bruitForce(){
        const coins = await this.getCoinIds(false);
        for(const coinSelector of coins){
            try {
                await this.selectAnswer(coinSelector);
                const coin = await $(`#${coinSelector}`);
                const value = await coin.getAttribute('data-value');

                console.log(`We found a new cheat code: ${value}`);

                //This is formatted funny because it will be added to an existing selector
                //This has the effect of selecting elements that meet any of the criteria.
                //Think of the comma as an "or"
                return `, button[data-value="${value}"]`;
  
              } catch (error) {
                console.log(`It's not ${coinSelector}.`);
              }
        }
    }

    /**
    * Open the page.
    */
    async open () {
        await super.open('');
    }
}

module.exports = new SdetChallenge();
