/*
 * grunt-channel-builder
 * https://github.com/TheGrove/grunt-channel-builder
 *
 * Copyright (c) 2014 Chris Gruel
 * Licensed under the MIT license.
 */

'use strict';

var _ = require('lodash');

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('channel_builder', 'Grunt plugin for outputting multiple applications by channel based on shared and unshared code residing in the same repository.', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      src: 'src',
      filePatterns : {
            js: ['*.js','!*.spec.js'],
            less: '*.less',
            tpl: '*.tpl.html'
      }
    });

    if(_.isUndefined(this.data.folderNamePattern)){
        grunt.log.error('Missing folderNamePattern for ' + this.target);
    }

    if(!_.isString(options.src)){
        grunt.log.error('Src can only be a string value for ' + this.target);   
    }

    if(options.filePatterns.length < 1){
        grunt.log.error('At least one file pattern is required for ' + this.target);
    }

    var channels =[], 
        patterns = [], 
        targetMatchPattern,
        otherChannelPatterns = [],
        meMatch,
        otherMatch,
        target = this.target,
        data = this.data;

    // grunt.verbose.subhead('This Object');
    // grunt.verbose.writeln('this : ' + JSON.stringify(this,null,'\t'));

    var mainConfig = grunt.config('channel_builder');
    // grunt.verbose.subhead('Channel Builder Config');
    // grunt.verbose.writeln(JSON.stringify(mainConfig,null,'\t'));
    
    if(!_.has(grunt.config('channel_builder'), 'out')){
        grunt.config.set('channel_builder.out',{});
    }
    
    var buildRegex = function(pattern){
        var patt = '\\b' + pattern + '\\b';
        grunt.verbose.writeln('building regex pattern : ' + patt)
        return new RegExp(patt);
    };

    targetMatchPattern = buildRegex(this.data.folderNamePattern);
    
    var matchesTarget = function (subdir){
        if(subdir === undefined){
            return false;
        } else if(subdir === data.folderNamePattern){
            return true
        } else {
            return targetMatchPattern.test(subdir)
        }
    };

    channels = _(mainConfig)
                .filter('folderNamePattern')
                .pluck('folderNamePattern')
                .value();

    if(channels.length < 1){
        grunt.log.error('At least one channel is required');
    }

    otherChannelPatterns = _(channels)
                            .without(this.data.folderNamePattern)
                            .map(function(channel){
                                var obj = {};
                                obj['regex'] = buildRegex(channel);
                                obj['channel'] = channel;
                                return obj;
                            }).value();

    var matchesOthers = function (subdir){
        if(subdir === undefined){
            grunt.verbose.writeln('no subdir');
            return false;
        } else {
            var obj = _.first(otherChannelPatterns, function(patternObj){
                var otherTest = patternObj.regex.test(subdir);
                grunt.verbose.writeln('subdir : ' + subdir + ' channel : ' + patternObj.channel + ' result : ' + otherTest);
                return otherTest || subdir === patternObj.channel;
            });
            grunt.verbose.writeln('subdir : ' + subdir + ' obj : ' + JSON.stringify(obj,null,'\t'));
            grunt.verbose.writeln('isEmpty : ' + _.isEmpty(obj));
            return !_.isEmpty(obj);
        }
    }

    _.forIn(options.filePatterns,function(value,key){
        var obj = {};
        obj['key'] = key;
        obj['value'] = value;
        obj['list'] = [];
        patterns.push(obj);
    });

    grunt.verbose.subhead('Channels');
    grunt.verbose.writeln(JSON.stringify(channels,null,'\t'));
    
    grunt.verbose.subhead('Patterns');
    grunt.verbose.writeln(JSON.stringify(patterns,null,'\t'));

    grunt.verbose.subhead('Other Channel Patterns');
    grunt.verbose.writeln(JSON.stringify(otherChannelPatterns,null,'\t'));

    grunt.file.recurse(options.src, function callback(abspath, rootdir, subdir, filename) {

        _.forEach(patterns, function(pattern){
            if(grunt.file.isMatch(pattern.value, filename)){

                grunt.verbose.subhead('New File');
                grunt.verbose.writeln(['abspath',abspath]);
                grunt.verbose.writeln(['rootdir',rootdir]);
                grunt.verbose.writeln(['subdir',subdir]);
                grunt.verbose.writeln(['filename',filename]);

                meMatch = matchesTarget(subdir);
                otherMatch = matchesOthers(subdir);
                if(meMatch){
                    grunt.verbose.writeln('match for ' + pattern.key + ' filename:' + filename );
                    pattern.list.push(abspath);
                } else if(otherMatch){
                    grunt.verbose.writeln('negative match for ' + pattern.key + ' filename:' + filename);
                } else {
                    grunt.verbose.writeln('common file for filename:' + filename);
                    pattern.list.push(abspath);
                }
            }
        });
    });

    var outList = {};


    grunt.log.subhead('Post Processing Patterns for ' + this.target);
    _.forEach(patterns, function(pattern){
        outList[pattern.key] = pattern.list;
    });
    grunt.log.writeln(JSON.stringify(outList, null, '\t'));
    grunt.config.set('channel_builder.out.' + target, outList);
  });

};
