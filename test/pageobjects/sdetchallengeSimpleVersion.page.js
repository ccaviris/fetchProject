const { $ } = require('@wdio/globals')
const Page = require('./page');

const leftBowlSelectors = ['#left_0', '#left_1', '#left_2'];

const rightBowlSelectors = ['#right_0', '#right_1', '#right_2'];

/**
 * sub page containing specific selectors and methods for a the page http://sdetchallenge.fetch.com/
 * I tried to write this with as little code as possible
 */
class SdetChallenge extends Page {


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



    async setValues(selectors, values){
        let index = 0;
        for(const selector of selectors){
            const square = await $(selector);
            await square.setValue(values[index]);
            index++;
        }
    }

        //This is similar but not identical to a function in sdetchallenge.pasge.js
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

    async open () {
        return await super.open('');
    }
}

module.exports = new SdetChallenge();
