/*
 * grunt-channel-builder
 * https://github.com/TheGrove/grunt-channel-builder
 *
 * Copyright (c) 2014 Chris Gruel
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // These plugins provide necessary tasks.
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>',
      ],
      options: {
        jshintrc: '.jshintrc',
      },
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp'],
    },

    ie_file_list: ['test/fixtures/**/*.js','!test/fixtures/**/*.spec.js'],

    // Configuration to be run (and then tested).
    channel_builder: {
      options: {
          filePatterns : {
              js: ['test/fixtures/**/*.js','!test/fixtures/**/*.spec.js'],
              less: 'test/fixtures/**/*.less',
              tpl: 'test/fixtures/**/*.tpl.html'
          }
      },
      ireland: {
        options: {
          replaceConfigValues: [{
            existingConfigValueToReplace: 'ie_file_list',
            filePatternOfSourceList: 'js'
          }]
        },
        folderNamePattern: 'ie',
      },
      brazil: {
        folderNamePattern: 'br',
      },
      acme: {
        folderNamePattern: 'acm',
      },
      'default': {
        //put nothing in here
      }
    },
    bump: {
        options: {
            files: [
                "package.json"
            ],
            commit: false,
            commitMessage: 'chore(release): v%VERSION%',
            commitFiles: [
                "package.json",
            ],
            createTag: false,
            tagName: 'v%VERSION%',
            tagMessage: 'Version %VERSION%',
            push: false,
            pushTo: 'origin'
        }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js'],
    },

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'channel_builder', 'nodeunit']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

  grunt.registerTask('run', ['jshint', 'channel_builder', 'config-check']);

  grunt.registerTask('config-check','',function(){
      grunt.log.writeln('channel_builder: ' + JSON.stringify(grunt.config.get('channel_builder'),null,'\t'));
      grunt.log.writeln('ie_file_list: ' + JSON.stringify(grunt.config.get('ie_file_list'),null,'\t'));
  });

};
