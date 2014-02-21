/*
 * grunt-channel-builder
 * https://github.com/TheGrove/grunt-channel-builder
 *
 * Copyright (c) 2014 Chris Gruel
 * Licensed under the MIT license.
 */

'use strict';

var _ = require('lodash'), path = require('path');

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

    // Turn non-arrays into arrays
    _.forEach(options.filePatterns, function(value, key){
        if(grunt.util.kindOf(value) !== "array"){
            options.filePatterns[key] = [ value ];
        }
    });

    if(_.isUndefined(this.data.folderNamePattern) && this.target !== 'default'){
        grunt.log.error('Missing folderNamePattern for ' + this.target);
        return false;
    }

    if(this.target === 'default' && !_.isUndefined(this.data.folderNamePattern)){
        grunt.log.error('Invalid folderNamePattern for default channel, default should not have a pattern');
        return false;
    }

    if(!_.isString(options.src)){
        grunt.log.error('Src can only be a string value for ' + this.target);
        return false;
    }

    if(options.filePatterns.length < 1){
        grunt.log.error('At least one file pattern is required for ' + this.target);
        return false;
    }

    var channels =[], 
        patterns = [], 
        targetMatchPattern,
        otherChannelPatterns = [],
        meMatch,
        otherMatch,
        target = this.target,
        data = this.data,
        NO_INDEX_FOUND = -1;

    var mainConfig = grunt.config('channel_builder');

    grunt.verbose.subhead('Channel Builder Config');
    grunt.verbose.writeln(JSON.stringify(mainConfig,null,'\t'));

    if(!_.has(grunt.config('channel_builder'), 'out')){
        grunt.config.set('channel_builder.out',{});
    }
    
    var buildRegex = function(pattern){
        var patt = '\\b' + pattern + '\\b';
        grunt.verbose.writeln('building regex pattern : ' + patt);
        return new RegExp(patt);
    };

    targetMatchPattern = buildRegex(this.data.folderNamePattern);
    
    var matchesTarget = function (subdir){
        if(subdir === undefined){
            return false;
        } else if(subdir === data.folderNamePattern){
            return true;
        } else {
            return targetMatchPattern.test(subdir);
        }
    };

    channels = _(mainConfig)
                .filter('folderNamePattern')
                .pluck('folderNamePattern')
                .value();

    if(channels.length < 1){
        grunt.log.error('At least one channel is required');
        return false;
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
            grunt.verbose.writeln('otherChannelPatterns : ' + JSON.stringify(otherChannelPatterns,null,'\t'));
            var obj = _.findIndex(otherChannelPatterns, function(patternObj){
                var otherTest = patternObj.regex.test(subdir);
                grunt.verbose.writeln('subdir : ' + subdir + ' channel : ' + patternObj.channel + ' result : ' + otherTest);
                var result = otherTest || subdir === patternObj.channel;
                grunt.verbose.writeln('result : ' + result);
                return result;
            });
            grunt.verbose.writeln('subdir : ' + subdir + ' obj : ' + JSON.stringify(obj,null,'\t'));
            return obj !== NO_INDEX_FOUND;
        }
    };

    var cleanAndProtectAgainstCommon = function(pattern, abspath, rootdir, subdir, filename){
        var subdirPathArray = _(subdir.split(path.sep)).initial().value();
        subdirPathArray.unshift(rootdir);
        subdirPathArray.push(filename);
        var commonFilePathPattern = path.join.apply(null,subdirPathArray);
        // Remove the common file if we happen to already have it
        pattern.list = _.filter(pattern.list,function(pattern){
            return pattern !== commonFilePathPattern;
        });
        grunt.verbose.writeln('Common file pattern to exclude : ' + commonFilePathPattern);
        // Create an exclusion for the common file so we wont pick it up
        pattern.excludes.push(commonFilePathPattern);
    };

    var addToListIfNotExcluded = function(pattern, abspath){
        grunt.verbose.writeln("addList pattern obj : " + JSON.stringify(pattern,null,'\t'));
        if(_.indexOf(pattern.excludes, abspath) === NO_INDEX_FOUND){
            pattern.list.push(abspath);
        }
    };

    _.forIn(options.filePatterns,function(value,key){
        var obj = {};
        obj['key'] = key;
        obj['patternArray'] = value;
        obj['list'] = [];
        obj['excludes'] = [];
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
            //grunt.verbose.writeln("Individual patterns : " + JSON.stringify(patterns,null,'\t'));
            if(grunt.file.isMatch(pattern.patternArray, filename)){

                grunt.verbose.subhead('New File');
                grunt.verbose.writeln(['abspath',abspath]);
                grunt.verbose.writeln(['rootdir',rootdir]);
                grunt.verbose.writeln(['subdir',subdir]);
                grunt.verbose.writeln(['filename',filename]);

                meMatch = target !== 'default' ? matchesTarget(subdir) : false;
                otherMatch = matchesOthers(subdir);
                if(meMatch){
                    cleanAndProtectAgainstCommon(pattern, abspath, rootdir, subdir, filename);
                    grunt.verbose.writeln('match for ' + pattern.key + ' filename:' + filename );
                    addToListIfNotExcluded(pattern, abspath);
                } else if(otherMatch){
                    grunt.verbose.writeln('negative match for ' + pattern.key + ' filename:' + filename);
                } else {
                    grunt.verbose.writeln('common file for filename:' + filename);
                    addToListIfNotExcluded(pattern, abspath);
                }
            }
        });
    });

    var outList = {};

    grunt.log.subhead('Post processing list for : ' + this.target);
    _.forEach(patterns, function(pattern){
        outList[pattern.key] = pattern.list;
    });
    grunt.log.writeln(JSON.stringify(outList, null, '\t'));
    grunt.config.set('channel_builder.out.' + target, outList);
  });

};
