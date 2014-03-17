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
      defaultChannelName: 'default',
      filePatterns : {
            js: ['src/**/*.js','!src/**/*.spec.js'],
            less: 'src/**/*.less',
            tpl: 'src/**/*.tpl.html'
      },
      replaceConfigValues: []
    });

    // Turn non-arrays into arrays
    _.forEach(options.filePatterns, function(value, key){
        if(grunt.util.kindOf(value) !== "array"){
            options.filePatterns[key] = [ value ];
        }
    });

    if(_.isUndefined(this.data.folderNamePattern) && this.target !== options.defaultChannelName){
        grunt.log.error('Missing folderNamePattern for ' + this.target);
        return false;
    }

    if(this.target === options.defaultChannelName && !_.isUndefined(this.data.folderNamePattern)){
        grunt.log.error('Invalid folderNamePattern for default channel, default should not have a pattern');
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
        NO_INDEX_FOUND = -1,
        fileList,
        fileParts,
        subdir,
        filename,
        mainConfig = grunt.config('channel_builder'),
        replacementTargetFileName,
        normalizePatternList = function(patternList){
            return _.map(patternList, function(pattern){
                return pattern.abspath;
            });
        },
        FileBits = function(abspath){
            if(_.isUndefined(abspath) || _.isNull(abspath) || !_.isString(abspath)){
                throw "abspath must be a defined and non-null string";
            }
            this.abspath = abspath;
            this.fileParts = abspath.split(path.sep);
            this.subdir = this.fileParts[this.fileParts.length - 2];
            this.filename = _.last(this.fileParts);
            this.pathWithoutSubDir = this.abspath.replace(path.sep + this.subdir,'');
        },
        PatternObj = function(key, patternArray){
            this.key = key;
            this.patternArray = patternArray;
            this.list = [];
            this.excludes = [];
        },
        OutList = function(patterns){
            var outList = this;
            _.forEach(patterns, function(pattern){
                outList[pattern.key] = normalizePatternList(pattern.list);
            });
            var checkPattern = function(pattern, moduleName){
                // Let's see if we have a file match for this
                var matchedPattern = _.find(pattern.list, function(fileBits){
                    grunt.verbose.writeln('checking match against: ' + fileBits.abspath);
                    return moduleName === fileBits.abspath;
                });
                if(matchedPattern === undefined){
                    grunt.verbose.writeln('No match found to pattern');
                    // No match so we keep the name
                    return moduleName;
                } else {
                    grunt.verbose.writeln('Match found to pattern!! : ' + matchedPattern.pathWithoutSubDir);
                    // We match so we will give it the name of the file without the subdir
                    return matchedPattern.pathWithoutSubDir;
                }
            };
            this["replace"] = function(moduleName){
                var newName;
                _.forEach(patterns, function(pattern){
                    grunt.verbose.writeln('Replace function for: ' + moduleName);
                    var matchedPattern = checkPattern(pattern, moduleName);
                    if(matchedPattern !== moduleName){
                        newName = matchedPattern;
                    }
                });
                return newName ? newName : moduleName;
            };
            
        },
        fileBits,
        outList;


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

    var cleanAndProtectAgainstCommon = function(pattern, fileBits){
        
        var commonFilePathPattern = fileBits.pathWithoutSubDir;
        // Remove the common file if we happen to already have it
        pattern.list = _.filter(pattern.list,function(fileBits){
            return fileBits.abspath !== commonFilePathPattern;
        });
        grunt.verbose.writeln('Common file pattern to exclude : ' + commonFilePathPattern);
        // Create an exclusion for the common file so we wont pick it up
        pattern.excludes.push(commonFilePathPattern);
    };

    var addToListIfNotExcluded = function(pattern, fileBits){
        grunt.verbose.writeln("addList pattern obj : " + JSON.stringify(pattern,null,'\t'));
        if(_.indexOf(pattern.excludes, fileBits.abspath) === NO_INDEX_FOUND){
            pattern.list.push(fileBits);
        }
    };

    _.forIn(options.filePatterns,function(value,key){
        var patt = new PatternObj(key, value);
        patterns.push(patt);
    });

    grunt.verbose.subhead('Channels');
    grunt.verbose.writeln(JSON.stringify(channels,null,'\t'));
    
    grunt.verbose.subhead('Patterns');
    grunt.verbose.writeln(JSON.stringify(patterns,null,'\t'));

    grunt.verbose.subhead('Other Channel Patterns');
    grunt.verbose.writeln(JSON.stringify(otherChannelPatterns,null,'\t'));


    _.forEach(patterns, function(pattern){

        fileList = grunt.file.expand(pattern.patternArray);

        _.forEach(fileList, function(abspath){
            fileBits = new FileBits(abspath);
            fileParts = fileBits.fileParts;
            subdir = fileBits.subdir;
            filename = fileBits.filename;

            grunt.verbose.subhead('New File');
            grunt.verbose.writeln(['abspath',abspath]);
            grunt.verbose.writeln(['subdir',subdir]);
            grunt.verbose.writeln(['filename',filename]);

            meMatch = target !== options.defaultChannelName ? matchesTarget(subdir) : false;
            otherMatch = matchesOthers(subdir);
            if(meMatch){
                cleanAndProtectAgainstCommon(pattern, fileBits);
                grunt.verbose.writeln('match for ' + pattern.key + ' filename:' + filename );
                addToListIfNotExcluded(pattern, fileBits);
            } else if(otherMatch){
                grunt.verbose.writeln('negative match for ' + pattern.key + ' filename:' + filename);
            } else {
                grunt.verbose.writeln('common file for filename:' + filename);
                addToListIfNotExcluded(pattern, fileBits);
            }
        });

    });

    grunt.log.subhead('Post processing list for : ' + this.target);
    outList = new OutList(patterns);
    grunt.log.writeln(JSON.stringify(outList, null, '\t'));
    grunt.config.set('channel_builder.out.' + target, outList);

    if(!_.isEmpty(options.replaceConfigValues)){
        grunt.log.subhead('Processing Replacement Config Values');
        _.forEach(options.replaceConfigValues, function(replacement){
            if(_.isUndefined(replacement.existingConfigValueToReplace) || _.isUndefined(replacement.filePatternOfSourceList)){
                grunt.log.error('Attributes existingConfigValueToReplace and filePatternOfSourceList are required to do config replacements');
                return false;
            }
            grunt.verbose.subhead('New Replacement');
            grunt.verbose.writeln('Existing value: ' + JSON.stringify(grunt.config.get(replacement.existingConfigValueToReplace),null,'\t'));
            grunt.log.writeln('Changing ' + replacement.existingConfigValueToReplace);
            replacementTargetFileName = 'channel_builder.out.' + target + '.' + replacement.filePatternOfSourceList + '.list';
            grunt.log.writeln('New value will be the value of ' + replacementTargetFileName);
            grunt.config.set(replacement.existingConfigValueToReplace, grunt.config.get(replacementTargetFileName));
            grunt.verbose.writeln('New value: ' + JSON.stringify(grunt.config.get(replacement.existingConfigValueToReplace),null,'\t'));
        });
    }

  });

};
