var fs = require('fs')
var spawn = require('child_process').spawn
var path = require('path')
var readline = require('readline')
var mkdirp = require('mkdirp')
var yn = require('yn')
var series = require('run-series')

module.exports = function doRecipe ({ source, dest, recipe, key }, cb) {
    dest = dest || '.'
    cb = cb || function noop () {}

    series((recipe.files || []).map(function (file) {
        return function _file (cb) {
            copyFile(source, dest, file, cb)
        }
    }).concat([
        function _scripts (cb) {
            if (!recipe.scripts) return process.nextTick(function () {
                cb(null)
            })
            pkgScripts(recipe, dest, key, cb)
        },

        function _install (cb) {
            if (!recipe.devinstall) return process.nextTick(function () {
                cb(null)
            })
            var args = ['install', '--save-dev'].concat(recipe.devinstall)
            spawn('npm', args, {
                stdio: 'inherit'
            }).on('close', function (code) {
                cb(null)
            })
        }
    ]), function allDone (err, res) {
        if (err) return cb(err)

        var filesN = (recipe.files || []).length
        var filesSum = res.slice(0, filesN)
            .filter(Boolean)
            .reduce((sum, n) => sum + n, 0)

        var scriptsSum = Object.keys(recipe.scripts || {}).length

        cb(null, {
            filesCopied: filesSum,
            scriptsInstalled: scriptsSum
        })
    })
}

function copyFile (source, dest, file, cb) {
    var source = path.join(source, Array.isArray(file) ?
        file[0] :
        file)
    var dest = path.join(dest, Array.isArray(file) ? file[1] : file)

    fs.access(dest, fs.constants.F_OK, function (err) {
        if (err) {  // file does not exist, so write it
            var dir = path.parse(dest).dir
            return mkdirp(dir, function (err) {
                if (err) return console.log('Error mkdirp ' + dir, err)
                fs.createReadStream(source)
                    .pipe(fs.createWriteStream(dest))
                    .once('finish', cb.bind(null, null, 1))
                    .once('error', function (err) {
                        console.log('Error writing ' + dest, err)
                        cb(null)
                    })
            })
        }

        // file exists, ask permission
        var rl = createRl()
        var q = `Overwrite file ${dest}? (y/n [n]) `
        rl.question(q, function (resp) {
            rl.close()
            var write = yn(resp)
            if (!write) {
                cb(null, 0)
                return console.log('not overwritten')
            }
            fs.createReadStream(source)
                .once('error', function (err) {
                    console.log('Error reading ' + source, err)
                })
                .pipe(fs.createWriteStream(dest))
                .once('finish', cb.bind(null, null, 1))
                .once('error', function (err) {
                    console.log('Error writing ' + dest, err)
                    cb(null)
                })
        })
    })
}

// return number of scripts installed
function pkgScripts (recipe, dest, recipeName, cb) {
    var dest = dest || '.'
    var pkgData, pkg

    try {
        pkgData = fs.readFileSync(path.join(dest, 'package.json'))
    } catch (err) {
        pkg = {}
    }
    if (!pkg) try {
        pkg = JSON.parse(pkgData)
    } catch(err) {
        cb(err)
        return console.log('Invalid package.json', err)
    }
    if (!pkg.scripts) pkg.scripts = {}

    Object.keys(recipe.scripts).forEach(function (k) {
        if (!pkg.scripts[k]) {
            pkg.scripts[k] = recipe.scripts[k]
            return
        }
        pkg.scripts[k + '__' + recipeName] = recipe.scripts[k]
    })

    var data = JSON.stringify(pkg, null, 2)
    fs.writeFile(path.join(dest, './package.json'), data, function (err) {
        if (err) console.log('Error writing package.json', err)
        cb(null, Object.keys(recipe.scripts).length)
    })
}

function createRl () {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })
}

