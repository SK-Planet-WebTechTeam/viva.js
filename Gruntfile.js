
/*jshint node:true */
module.exports = function(grunt) {
  'use strict';

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      options: {
        jshintrc: true
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      files: {
        src: 'src/**/*.js'
      }
    },
    concat: {
      util: {
        src: ['src/util/*.js'],
        dest: 'dist/temp/util.js'
      },
      geometry: {
        src: ['src/geometry/*.js'],
        dest: 'dist/temp/geometry.js'
      },
      core: {
        src: ['src/core/*.js'],
        dest: 'dist/temp/core.js'
      },
      body: {
        src: ['src/body/*.js'],
        dest: 'dist/temp/body.js'
      },
      renderer: {
        src: ['src/renderer/*.js'],
        dest: 'dist/temp/renderer.js'
      },
      behavior: {
        src: ['src/behavior/*.js', 'src/behavior/behavior.js'],
        dest: 'dist/temp/behavior.js'
      },
      dist: {
        options: {
          banner: "(function(window, undefined) {",
          footer: "})(window);"
        },
        src: ['dist/temp/util.js', 'dist/temp/core.js', 'dist/temp/geometry.js', 'dist/temp/body.js', 'dist/temp/renderer.js', 'dist/temp/behavior.js'],
        dest: 'dist/viva.js'
      }
    },
    uglify: {
      options: {
        preserveComments:'false',
        mangle: {
          except: []
        },
        compress: {
          drop_console: true
        },
      },
      my_target: {
        files: {
          'dist/viva.min.js': ['dist/viva.js']
        }
      }
    },
    "clean": {
      build: ["dist"],
      temp : ["dist/temp"]
    },
    watch: {
      scripts: {
        files: ['src/**/*.js', 'src/*',  'src/**/*' ],
        tasks: ['default'],
        options: {
          spawn: false,
        },
      },
    },
    copy: {
      main: {
        files: [
          // includes files within path
          {expand: true, src: ['dist/*', 'example/*'], dest: '/Users/skplanet/Dropbox/앱/KISSr/cheeki.kissr.com/physics/'}
        ]
      }
    },
    jsdoc : {
        dist : {
            src: ['src/**/*.js'],
            options: {
                destination: 'docs'
            }
        }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-closure-compiler');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-jsdoc');

  // Default task.
  grunt.registerTask('default', ['clean', 'concat', 'uglify', 'clean:temp', 'jsdoc']);
  grunt.registerTask('dev', ['clean', 'concat', 'uglify', 'clean:temp', 'jsdoc', 'watch']);
  grunt.registerTask('kissr', ['clean', 'concat', 'uglify', 'copy']);
  // grunt.registerTask('dev', ['clean', 'concat', 'uglify', 'watch']);

};
