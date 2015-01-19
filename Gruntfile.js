
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
      options: {
        // separator: ';',
        banner: "(function(window, undefined) {",
        footer: "})(window);"
      },
      dist: {
        src: ['src/util.js', 'src/viva.js', 'src/vector.js',  'src/*.js'],
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
      build: ["dist"]
    },
    watch: {
      scripts: {
        files: ['src/**/*.js'],
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
            src: ['src/*.js'],
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
  grunt.registerTask('default', ['clean', 'concat', 'uglify', 'jsdoc']);
  grunt.registerTask('dev', ['clean', 'concat', 'uglify', 'jsdoc', 'watch']);
  grunt.registerTask('kissr', ['clean', 'concat', 'uglify', 'copy']);
  // grunt.registerTask('dev', ['clean', 'concat', 'uglify', 'watch']);

};
