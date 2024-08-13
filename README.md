# fetchProject

Instructions:
1. Clone this repository
2. From the root folder of this project, run the command `npm install`
3. To run the tests, execute the command `npx wdio run ./wdio.conf.js`

Some notes:
The assingment mentioned gold bars but the page elements referanced coins. I decided to stick to coins instead of bars to keep the selectors and the variable names consistent.

I took three aproatches to this assignment. They are executed through the folder `test/specs/weightGame.js`
To run any of the aproatches individually, you may modify the file by adding `.only`. For example, to only tun the frst test, the line:
`it('should complete an optimal solution for 9 coins', async () => {`
could be changed to:
`it.only('should complete an optimal solution for 9 coins', async () => {`
Similarly, `.skip` appnded in a similar fasion may be used to skip any single test and run the rest.

The first aproatch was to keep things as simple as possible. The assignment stipulated that there would be exactly 9 coins. I took for granted everything that was stipulated and wrote an easy solution.

The next aproatch was to take as little for granted as possible. I assumed that even what was stipulated in the document could not be relied uppon. I wrote an algorithm that will product an optimal soltion for arbitrarily many bars. Although the ID values are consistent with the number of the coin, I assumed that this was not something I could rely uppon. I even didn't take for granted that there may be room in the scale to fit all of the coins. Admitedly, I could have worked out a solution that required more weighins, but I decided that if the number of squares in a given cup was less than the number of coins that I wanted to put in the cup, I would be unable to solve the problem optimally and terminate with an error.

My last aproatch was to attempt to beat the optimal solution. Was it possible to get a solution zero weighings? Yes, through cheating. This algorithm takes one of two aproatches. Since the solution appears to be tied to the data-value, I began by storing a selector that will find all elements with any of the desired selectors. If the players find one of these selectors, it will select it with zero guesses. However, if it does not see the answer right away, this player just attempts brute force. After finding the answer this way, the new valye will be added to the cheatFile.json for future use.

Further optimization. The optimal aproach would have been a combination of my last two aproatches, a player that first tries to cheat and then commits to the optimal honest stategy afterwords. It just felt more fitting to me to make the cheating player resort to using brute force.
