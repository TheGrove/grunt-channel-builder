# grunt-channel-builder

> Grunt plugin for creating multiple applications by channel based on shared and unshared code residing in the same repository. Developed to work with [ngbp](https://github.com/ngbp/ngbp) but allow the ability to have targetted custom output builds per client/region.

## Getting Started
This plugin requires Grunt `~0.4.2`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-channel-builder --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-channel-builder');
```

## The "channel_builder" task

### Overview
In your project's Gruntfile, add a section named `channel_builder` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  channel_builder: {
    options: {
      src: '',
      filePatterns: {
          js: '',
          less: '',
          tpl: ''
      }
    },
    your_target: {
      folderNamePattern: ''
    }
  }
});
```

### Options

#### options.src
Type: `String`
Default value: `src`

A string value that represents the folder where the recursive search will start from.

#### options.filePatterns
Type: `Object`

An object of the file patterns that will be collected for each channel. Each file type can be a string glob match pattern or an array of them.

#### channel.folderNamePattern
Type: `String`

Each channel has a folder name pattern that will include or exclude files that match the file pattern if that file is in either a subfolder that has the pattern in the folder name or a common file that belongs to all channels.

### Usage Examples

#### Setup
Create any number of channels and give each one of them a folder name pattern. Keep your code structure how ever you want and by placing the file in a subfolder that has the channel's folder name pattern anywhere in the name (but seperated by a non-word character) it will be automatically added to the channel_builder config object ready to be fed into the grunt-contrib-concat task.

```js
channel_builder: {
  options: {
    src: 'src',
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
  },
  default: {
      // put nothing in here
  }
};
```

#### Result
In this example, excecuting the task channel_builder adds an out property that can be called using grunt templates feeding into the concat task.

```js
channel_builder {
  "options": {
    "src": "test/fixtures",
    "filePatterns": {
      "js": [
        "*.js",
        "!*.spec.js"
      ],
      "less": "*.less",
      "tpl": "*.tpl.html"
    }
  },
  "ireland": {
    "folderNamePattern": "ie"
  },
  "brazil": {
    "folderNamePattern": "br"
  },
  "acme": {
    "folderNamePattern": "acm"
  },
  "default": {},
  "out": {
    "ireland": {
      "js": [
        "test/fixtures/coolness/br-ie/coolnessfile.js",
        "test/fixtures/ie/mainfeature1.js",
        "test/fixtures/mainfeature2.js",
        "test/fixtures/wonder/awesome/ie/awesome.js",
        "test/fixtures/wonder/wonderfile.js"
      ],
      "less": [
        "test/fixtures/coolness/br-ie/coolnessfile.less",
        "test/fixtures/ie/mainfeature1.less"
      ],
      "tpl": [
        "test/fixtures/coolness/coolnessfile.tpl.html",
        "test/fixtures/ie/mainfeature1.tpl.html",
        "test/fixtures/mainfeature2.tpl.html"
      ]
    },
    "brazil": {
      "js": [
        "test/fixtures/coolness/br-ie/coolnessfile.js",
        "test/fixtures/mainfeature1.js",
        "test/fixtures/mainfeature2.js",
        "test/fixtures/wonder/acm br/wonderfile.js",
        "test/fixtures/wonder/awesome/awesome.js"
      ],
      "less": [
        "test/fixtures/coolness/br-ie/coolnessfile.less",
        "test/fixtures/mainfeature1.less"
      ],
      "tpl": [
        "test/fixtures/coolness/coolnessfile.tpl.html",
        "test/fixtures/mainfeature1.tpl.html",
        "test/fixtures/mainfeature2.tpl.html"
      ]
    },
    "acme": {
      "js": [
        "test/fixtures/coolness/coolnessfile.js",
        "test/fixtures/mainfeature1.js",
        "test/fixtures/mainfeature2.js",
        "test/fixtures/wonder/acm br/wonderfile.js",
        "test/fixtures/wonder/awesome/awesome.js"
      ],
      "less": [
        "test/fixtures/mainfeature1.less"
      ],
      "tpl": [
        "test/fixtures/coolness/coolnessfile.tpl.html",
        "test/fixtures/mainfeature1.tpl.html",
        "test/fixtures/mainfeature2.tpl.html"
      ]
    },
    "default": {
      "js": [
        "test/fixtures/coolness/coolnessfile.js",
        "test/fixtures/mainfeature1.js",
        "test/fixtures/mainfeature2.js",
        "test/fixtures/wonder/awesome/awesome.js",
        "test/fixtures/wonder/wonderfile.js"
      ],
      "less": [
        "test/fixtures/mainfeature1.less"
      ],
      "tpl": [
        "test/fixtures/coolness/coolnessfile.tpl.html",
        "test/fixtures/mainfeature1.tpl.html",
        "test/fixtures/mainfeature2.tpl.html"
      ]
    }
  }
}
```
So following the above example, you can use the template '<%= channel_builder.out.acme.js %>'' to get a list of javascript files that are specific to the acme channel that you can feed into your other processes.

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).
