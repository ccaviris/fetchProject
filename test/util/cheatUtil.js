const fs = require("fs");

class textUtil {

    async writeFile(text){
        fs.writeFile(
            "cheatFile.json",
            `{"selector": "${text.replaceAll('"','\\"')}"}`,
            function (err) {
                if (err) {
                    return console.error(err);
                }
            }
        );
    }


}
module.exports = new textUtil();
