# script script

A script for your scripts. Politely install config files and package scripts by reading from templates in your home directory, and never overwriting files without asking. Sometimes you want one command that will install dependencies, add config files, and add scripts to package.json.

## install

    $ npm install -g script-script

## recipes

Write recipes in `~/.script-script/index.json`. 

```js
{
    "travis": {
        "files": [ ["travis.yml", ".travis.yml"] ]
    },

    "husky": {
        "devinstall": ["husky"],
        "scripts": {
            "prepush": "./test/githook/prepush.sh"
        },
        "files": [ ["prepush.sh", "./test/githook/prepush.sh"] ]
    }
}
```

Each key is a recipe name, and sub-keys point to actions to perform.

### devinstall

A list of package names that should be installed and added to `devDependencies`.

### scripts

Scripts are added to package.json scripts. 

### files

An array of files to copy from `~/.script-script` to the current directory. The files can be a string, or a pair of `[source file, dest file]`. If the path conflicts with an existing file, you will be prompted if you want to overwrite it.


## cli use

    $ script-script [recipe name]

### example

    $ script-script travis




