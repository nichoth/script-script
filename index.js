#!/usr/bin/env node
var fs = require('fs')
var spawn = require('child_process').spawn
var path = require('path')
var readline = require('readline')
var mkdirp = require('mkdirp')
var yn = require('yn')
var series = require('run-series')
var minimist = require('minimist')
var home = require('os-homedir')
var DIR = process.env.NODE_ENV === 'development' ?
    __dirname + '/example' :
    path.join(home(), '.script-script')

var argv = minimist(process.argv.slice(2))
ScriptScript(argv._)

var use = `
    Usage:
        script-script [recipe name]
`

function ScriptScript (keys) {
    var json = JSON.parse(fs.readFileSync(path.join(DIR, 'index.json')))
    var k = keys[0]
    if (!k) return console.log(use)
    var recipe = json[k]
    if (process.env.NODE_ENV === 'development') {
        console.log('recipe', recipe)
    }

    doRecipe(recipe, k)
}

function doRecipe (recipe, k) {
    series((recipe.files || []).map(function (file) {
        return function _file (cb) {
            copyFile(file, cb)
        }
    }).concat([
        function _scripts (cb) {
            if (!recipe.scripts) return process.nextTick(function () {
                cb(null)
            })
            pkgScripts(recipe, k, cb)
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
        if (err) return
        var filesN = (recipe.files || []).length
        var filesSum = res.slice(0, filesN)
            .filter(Boolean)
            .reduce((sum, n) => sum + n, 0)

        console.log('Copied ' + filesSum + ' file' +
                (filesSum === 1 ? '' : 's'))
        var scriptsSum = Object.keys(recipe.scripts || {}).length
        console.log('Added ' + scriptsSum + ' package script' +
                (scriptsSum === 1 ? '' : 's'))
    })
}


function copyFile (file, cb) {
    var source = path.join(DIR, Array.isArray(file) ?
        file[0] :
        file)
    var dest = Array.isArray(file) ? file[1] : file

    fs.access(dest, fs.constants.F_OK, function (err) {
        if (err) {  // file does not exist, so write it
            var dir = path.parse(dest).dir
            return mkdirp(dir, function (err) {
                if (err) return console.log('Error mkdirp ' + dir,
                        err)
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
function pkgScripts (recipe, recipeName, cb) {
    var pkgData, pkg
    try {
        pkgData = fs.readFileSync('./package.json')
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
    fs.writeFile('./package.json', data, function (err) {
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

module.exports = ScriptScript

