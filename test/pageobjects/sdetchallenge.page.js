const Page = require('./page');

/**
 * sub page containing specific selectors and methods for a the page http://sdetchallenge.fetch.com/
 * I specifically chose to assume there may be arbitrarily many coins to compare and tried to make
 * as few assumptions as possible. I tried to keep as much of the test dynamic as possible.
 */

class SdetChallenge extends Page {

    /**
    * This returns an array of strings containing all of the id's for the coins on the page
    * @param logRoundsNeeded If true, this function will also calculate and print to the console 
    *                        an estimate of how many weighings will be needed for an optimal solution.
    *                        If false, it will not do that. Default value is true
    */
    async getCoinIds(logRoundsNeeded = true){
        const coins = await $$('.coins button');
        const numberOfCoins = coins.length;

        if(logRoundsNeeded){
            /* Note, due to rounding when calculating the log base 2 values, this number may be off by 1.
            * In fact, log base ten, (ie using `Math.log(9)/Math.log(3)`) resolves to 
            * 2.0000000000000004 instead of 2 and an estimate of 3 rounds! log2 may also have rounding
            * errors, but it at least showing the exact number of comparisons for 9.
            * The number of rounds should be long base 3 of the number of coins.
            * Unfortunately, Math does not have a log3 function.
            */
            const roundsNeeded = Math.ceil(Math.log2(numberOfCoins) / Math.log2(3));
            console.log (`We have ${numberOfCoins} coins. Solution guarenteed in ${roundsNeeded} rounds or less`)
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
    * @param coinSelector The selector for the coin who's number is to be returned
    */
    async getCoinNumber(coinSelector){
        //I don't want to assume that the coin's ID will always correlate to the coin's number
        // so I will dynamically look it up every time for this aproatch.
        const coin = await $(coinSelector)
        const coinNumber = await coin.getText();
        return coinNumber;
    }

    /**
    * Takes in an array of IDs for coin elements and recursively attempts to find the fake.
    * It could take in the full set of coin IDs or any other subset of all coin IDS is known to include
    * the fake coin.
    * @param coinIds An array of IDs for coin elements with one of them being the fake coin
    */
    async recursivelyGroupAndCompareCoins(coinIds){
        //The base case, we have only one coin!
        if(coinIds.length == 1){
            const solution = await this.getCoinNumber(`#${coinIds[0]}`)
            console.log(`The answer is ${solution}`);
            return this.selectAnswer(coinIds[0]);
        }
        //Divide coins into three groups
        const groupedCoins = await this.groupCoins(coinIds);

        //Compare two groups of coins to determine which of the three groups has the fake
        const newGroup = await this.comparison(groupedCoins.groupA, groupedCoins.groupB, groupedCoins.groupC);
 
        await this.clickReset();

        //Recusivelly call this function with the group of coin IDs that contains the fake coin
        return this.recursivelyGroupAndCompareCoins(newGroup);
    }

    async groupCoins(coinIds){

        /*
        * If the coins are evenly divisible by 3, Three groups of the same size will be created
        * If the coins have a remainder of 1, groupA and groupB will have one less coin than groupC
        * If the coins have a remainder of 2, groupA and groupB will have one more coin than groupC
        * Luckily, simple rounding will solve resolve this perfectly.
        *  If the coins are evenly divisible, then Math.round(coinIds.length/3) = coindIds.length/3
        *  If the coins have a remainder of 1, then Math.round(coinIds.length/3) will round down and
        *  groupC will have one additional coin.
        *  If the coins have a remainder of 3, then Math.round(coinIds.length/3) will round up and
        *  groupA and groupB will get one additional coin.
        */
        const groupSize = Math.round(coinIds.length/3);
        //Note: If the spaces in the bowls is less than groupSize, the automation will throw an error 
        //at a later time. One optimization would be to look up how many spaces are in the left bowl
        //and right bowl and then use the smallest of the three numbers (groupSize, squares in the left bowl
        // and squares in the right bowl.  Making this change would result in the logic that prints the numebr
        //of steps to be innacurate when the bowl size is the limitng factor. 

        const groups = {};
        groups.groupA = coinIds.splice(0, groupSize);
        groups.groupB = coinIds.splice(0 , groupSize);
        groups.groupC = coinIds

        return groups;
    }

    /**
    * Takes in a three way division of coins. The coins to be on the left bowl, right bowl, and not placed.
    * It will place the coins, weigh them, and return a =, <, or, > to summarize the results as follows:
    *           = if the fake coin is not on the scale
    *           > if the fake coin is in the right bowl of the scale
    *           < if the fake coin is in the left bowl of the scale
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
    * Places a set of coins in a given bowl
    * @param bowlContents An array of string values to be typed into the squares of a given bowl
    * @param bowlSelector A selector that can be used to find all of the squares of a given bowl.
    */
    async fillBowl(bowlContents, bowlSelector){
        const bowlSquares = await $$(bowlSelector);

        //If the bowl doesn't have enough squares to complete the game in the 
        //optimal number of moves then and error will be thrown
        //Note, at the expense of more complex test logic it is possible 
        //for the test to have coninued and found a solution with more steps.
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
        //Not the best selector, but there are two elements with the id reset
        const resetButton = await $('div:nth-child(4) #reset');
        return await resetButton.click();
    }

    /**
    *  This function will read the info text, press the weigh button, wait for the info text to update
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

        //By  removing the original text, it's easier to analyze the new results.
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
    * If an element is found by the cheatSelector, it will return true. Otherwise, it will return false.
    *  @param cheatSelector  A selector used for cheating ;)
    */
    async canWeCheat(cheatSelector){
        const coin = await $(cheatSelector);
        return await coin.isExisting();
    }

    /**
    * This function will use brute force to find the correct answer, trial and error guessing each coin.
    * When it finds the answer, it will return the data-value to be used for cheating. The returned value
    * is formatted to be appended to the end of an existing cheating selector.
    * 
    * NOTE: This function is only used by the third "cheating" algorithm when it cannot cheat.
    */
    async bruitForce(){
        const coins = await this.getCoinIds(false);
        for(const coinSelector of coins){
            try {
                await this.selectAnswer(coinSelector);
                const coin = await $(`#${coinSelector}`);
                const value = await coin.getAttribute('data-value');

                console.log(`We found a new cheat code: ${value}`);

                //This is formatted funny because it will be appended to an existing selector
                //This has the effect of selecting elements that meet any of the criteria in the chain.
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
