/*
 * grunt-channel-builder
 * https://github.com/TheGrove/grunt-channel-builder
 *
 * Copyright (c) 2014 Chris Gruel
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

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

    // Configuration to be run (and then tested).
    channel_builder: {
      options: {
        src: 'test/fixtures',
        filePatterns : {
            js: ['*.js','!*.spec.js'],
            less: '*.less',
            tpl: '*.tpl.html'
        }
      },
      ireland: {
        folderNamePattern: 'ie',
      },
      brazil: {
        folderNamePattern: 'br',
      },
      acme: {
        folderNamePattern: 'acm',
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js'],
    },

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'channel_builder', 'nodeunit']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

  grunt.registerTask('config-check','',function(){
      grunt.log.writeln(' channel_builder ' + JSON.stringify(grunt.config.get('channel_builder'),null,'\t'));
  });

};
