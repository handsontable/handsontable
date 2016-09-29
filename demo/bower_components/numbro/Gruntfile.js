var fs = require('fs');
var path = require('path');

module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        copy: {
            main: {
                files: [
                    {src: 'numbro.js', dest: 'dist/numbro.js'},
                ]
            }
        },
        concat: {
            languages: {
                src: [
                    'languages/**/!(index).js',
                ],
                dest: 'dist/languages.js',
            },
        },
        uglify: {
            target: {
                files: [
                    { src: [ 'dist/languages.js' ], dest: 'dist/languages.min.js', },
                    { src: [ 'numbro.js' ], dest: 'dist/numbro.min.js', },
                ].concat( fs.readdirSync('./languages').map(function (fileName) {
                    var lang = path.basename(fileName, '.js');
                    return {
                        src: [path.join('languages/', fileName)],
                        dest: path.join('dist/languages/', lang + '.min.js'),
                    };
                }))
            },
            options: {
                preserveComments: 'some',
            },
        },
        bump: {
            options: {
                files: [
                    'package.json',
                    'bower.json',
                    'component.json',
                    'numbro.js',
                ],
                updateConfigs: ['pkg'],
                commit: false,
                createTag: false,
                push: false,
                globalReplace: true,
                regExp: new RegExp('([\'|\"]?version[\'|\"]?[ ]*[:=][ ]*[\'|\"]?)'+
                  '(\\d+\\.\\d+\\.\\d+(-\\.\\d+)?(-\\d+)?)[\\d||A-a|.|-]*([\'|\"]?)')
            },
        },
        confirm: {
            release: {
                options: {
                    question: 'Are you sure you want to publish a new release' +
                        ' with version <%= pkg.version %>? (yes/no)',
                    continue: function(answer) {
                        return ['yes', 'y'].indexOf(answer.toLowerCase()) !== -1;
                    }
                }
            }
        },
        release:{
            options: {
                bump: false,
                commit: false,
                tagName: '<%= version %>',
            },
        },
        nodeunit: {
            all: ['tests/**/*.js'],
        },
        jshint: {
            options: {
                jshintrc : '.jshintrc'
            },
            all: [
                'Gruntfile.js',
                'numbro.js',
                'languages/**/*.js'
            ]
        },
        jscs: {
            src: [
                'Gruntfile.js',
                'numbro.js',
                'languages/**/*.js'
            ],
            options: {
                config: '.jscsrc',
                esnext: true, // If you use ES6 http://jscs.info/overview.html#esnext
                verbose: true, // If you need output with rule names http://jscs.info/overview.html#verbose
                validateIndentation: 4
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-nodeunit');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-confirm');
    grunt.loadNpmTasks('grunt-release');
    grunt.loadNpmTasks('grunt-jscs');


    grunt.registerTask('default', [
        'test'
    ]);

    grunt.registerTask('lint', [
        'jshint',
        'jscs'
    ]);

    grunt.registerTask('test', [
        'lint',
        'nodeunit'
    ]);

    grunt.registerTask('build', [
        'test',
        'languages',
        'copy:main',
        'concat',
        'uglify'
    ]);

    // wrap grunt-release with confirmation
    grunt.registerTask('publish', [
        'confirm:release',
        'release',
    ]);

    // This creates an index file for the languages
    grunt.registerTask('languages', function() {
        var dir = './languages';
        var langFiles = fs.readdirSync(dir).filter(function(file) {
            if(file !== 'index.js') {
                return true;
            }
        }).map(function(file) {
            return 'exports[\'' + file.replace('.js', '') + '\'] = require(\'./' + file + '\');';
        }).join('\n');

        fs.writeFileSync(dir + '/index.js', langFiles);
    });

    // Travis CI task.
    grunt.registerTask('travis', ['test']);
};
