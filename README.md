# fetchProject

Instructions:
1. Clone this repository
2. From the root folder of this project, run the command `npm install`
3. To run the tests, execute the command `npx wdio run ./wdio.conf.js` This will execute three different strategies to solve this problem.

Some notes:
The assingment mentioned gold bars but the page elements referanced coins. I decided to stick to coins instead of bars to keep the selectors and the variable names consistent.

I took three aproatches to this assignment. They are executed through the file `test/specs/weightGame.js`
To run any of the aproatches individually, you may modify the file by adding `.only`. For example, to only run the frst test, the line:
`it('should complete an optimal solution for 9 coins', async () => {`
could be changed to:
`it.only('should complete an optimal solution for 9 coins', async () => {`
Similarly, `.skip` appnded in a similar fasion may be used to skip any single test and run the rest.

The first aproatch was to keep things as simple as possible. The assignment stipulated that there would be exactly 9 coins. I took for granted everything that was stipulated and wrote an easy solution. To keep this aproatch as easy to read as possible, I put it all in a seperate page object. I would normally avoid copy/pasting my own code. However, I wanted to showcase these two solutions completely independatly. I did label what code was redundant.

The next aproatch was to take as little for granted as possible. I assumed that even much what was stipulated in the document could not be relied uppon. I wrote an algorithm that will produce an optimal soltion for arbitrarily many coins and spaces in the bowls. Although the ID values of the coins are consistent with the number of the coin, I assumed that this was not something I could rely uppon and always read values dynamically.

My last aproatch was to attempt to beat the legitimate optimal solution. Was it possible to get a solution zero weighings? Yes, through cheating. This algorithm takes one of two aproatches. Since the solution appears to be tied to the data-value, I began by storing a selector that will find all elements with any of the desired data-value values. If the an element is found by one of these selectors, it will select it with zero guesses. However, if it does not see the answer, this player just attempts brute force. After finding the answer this way, the new value will be added to the cheatFile.json for future use. The more times you run this test, the more likely it is that it will be able to cheat.

Further optimization. The optimal cheating aproach would have been a combination of my last two aproatches, a player that first tries to cheat and then commits to the optimal honest stategy afterwords. It just felt more fitting to me to make the cheating player resort to using brute force if they found themselves unable to cheat.
