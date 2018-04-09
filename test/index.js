var fs = require('fs')
var assert = require('assert')
var doRecipe = require('../')

var DEST = __dirname + '/dest'
var SOURCE = __dirname + '/source'
var recipe = {
    'scripts': {
        'prepush': './test/githook/prepush.sh'
    },
    'files': [ ['prepush.sh', './test/githook/prepush.sh'] ]
}

doRecipe({ source: SOURCE, dest: DEST, recipe, key: 'husky' }, (err, res) => {
    if (err) throw err

    var words = fs.readFileSync(__dirname + '/dest/test/githook/prepush.sh')
        .toString()
    assert.equal(words, 'foo bar\n')

    var _pkg = fs.readFileSync(__dirname + '/dest/package.json').toString()
    var pkg = JSON.parse(_pkg)
    assert.equal(pkg.scripts.prepush, './test/githook/prepush.sh')
})

