const { $ } = require('@wdio/globals')
const Page = require('./page');

const leftBowlSelectors = ['#left_0', '#left_1', '#left_2'];

const rightBowlSelectors = ['#right_0', '#right_1', '#right_2'];

/**
 * sub page containing specific selectors and methods for a the page http://sdetchallenge.fetch.com/
 * I tried to write this with as little code as possible
 */
class SdetChallenge extends Page {


    /**
    * Performs the first round of weighing
    * The output of the function wil be:
    *       < if the fake coin is either 0, 1, or 2
    *       > if the fake coin is either 3, 4, or 5
    *       = if the fake coin is either 6, 7, or 8
    */
    async roundOne(){
        console.log('Placing coins 0, 1, and 2 into the left bowl');
        this.setValues(leftBowlSelectors, ['0', '1', '2']);

        console.log('Placing coins 3, 4, and 5 into the right bowl');
        this.setValues(rightBowlSelectors, ['3', '4', '5']);

        const result = await this.clickWeighAndGetResults();

        if(result.includes('=')){
            return'=';
        } else if(result.includes('>')){
            return '>';
        } else if(result.includes('<')){
            return '<';
        } else{
            throw new Error('Unexpected results in roundOne() comparison!');
        }
    }

    /**
    * Performs the second round of weighing
    * @param roundOneResult the output of the function roundOne(). The values can be:
    *                           < means the fake coin is either 0, 1, or 2
    *                           > means the fake coin is either 3, 4, or 5
    *                           = means the fake coin is either 6, 7, or 8
    */
    async roundTwo(roundOneResult){
        await this.clickReset();

        let roundTwoCoins;

        if(roundOneResult=='<'){
            roundTwoCoins = ['0', '1', '2'];
            console.log('Placing coin 0 into the left bowl');
            this.setValues(leftBowlSelectors, ['0']);

            console.log('Placing coin 1 into the right bowl');
            this.setValues(rightBowlSelectors, ['1']);
        } else if(roundOneResult=='>'){
            roundTwoCoins = ['3', '4', '5'];
            console.log('Placing coin 3 into the left bowl');
            this.setValues(leftBowlSelectors, ['3']);

            console.log('Placing coin 4 into the right bowl');
            this.setValues(rightBowlSelectors, ['4']);
        } else {
            roundTwoCoins = ['6', '7', '8'];
            console.log('Placing coin 6 into the left bowl');
            this.setValues(leftBowlSelectors, ['6']);

            console.log('Placing coin 7 into the right bowl');
            this.setValues(rightBowlSelectors, ['7']);
        }

        const result = await this.clickWeighAndGetResults();

        if(result.includes('=')){
            return roundTwoCoins[2];
        } else if(result.includes('>')){
            return roundTwoCoins[1];
        } else if(result.includes('<')){
            return roundTwoCoins[0];
        } else{
            throw new Error('Unexpected results in roundOne() comparison!');
        }
    }


    /**
    * Enters values into squares of one of the bowls
    * @param selectors  selectors for a bowl
    * @param values  The values to be entered.
    */
    async setValues(selectors, values){
        let index = 0;
        for(const selector of selectors){
            const square = await $(selector);
            await square.setValue(values[index]);
            index++;
        }
    }

    //This is similar but not identical to a function in sdetchallenge.pasge.js
    /**
    * Click on the coin that is expected to be the correct answer
    * @param number  The number representing the fake coin
    */
    async selectAnswer(number){
        console.log(`Selecting the solution ${number}....wish me luck!`)
        const coin = await $(`#coin_${number}`);
        await coin.click();

        const alertText = await browser.getAlertText();
        console.log(`The response is: ${alertText}`);

        if(alertText!='Yay! You find it!'){
            throw new Error(`Something went wrong ${number} is not the answer!`);
        }
    }


    //The functions below this comment are redundant to the sdetchallenge.page.js
    //Normally, I would not copy/paste my own code. However, since I am doing the
    //same tast with two different aproatches, I wanted to keep these completely seperate

    /**
    * Click the reset button
    */
    async clickReset(){
        const resetButton = await $('div:nth-child(4) #reset');
        return await resetButton.click();
    }

    /**
    * Takes in a three way division of coins. The coins to be on the left bowl, right bowl, and not placed.
    * It will place the coins, weigh them, and return a =, <, or, > to summarize the results.
    * @param leftBowlContents An array of IDs for coin elements to be placed on the left bowl
    * @param rightBowlContents An array of IDs for coin elements to be placed on the left bowl
    * @param unisedContents An array of IDs for coin elements not to be placed in either bowl
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
    * Open the page.
    */
    async open () {
        return await super.open('');
    }
}

module.exports = new SdetChallenge();
