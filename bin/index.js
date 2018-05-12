#!/usr/bin/env node
var fs = require('fs')
var path = require('path')
var minimist = require('minimist')
var home = require('os-homedir')
var DIR = process.env.NODE_ENV === 'development' ?
    __dirname + '/../example' :
    path.join(home(), '.script-script')
var doRecipe = require('../')

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

    doRecipe({ source: DIR, dest: null, recipe, key: k }, function (err, res) {
        if (err) throw err

        console.log('Copied ' + res.filesCopied + ' file' +
            (res.filesCopied === 1 ? '' : 's'))
        console.log('Added ' + res.scriptsInstalled + ' package script' +
            (res.scriptsInstalled === 1 ? '' : 's'))
        console.log(`Added ${res.packageFields} ` +
            `package field${res.packageFields === 1 ? '' : 's'}`)
    })
}

