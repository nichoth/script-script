var cp = require('cpy')
var path = require('path')
var home = require('os-homedir')

var appPath = path.join(home(), '.script-script')
var source = path.join(__dirname, 'example', '*')
cp(source, appPath, {
    overwrite: false
})

