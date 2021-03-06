/*
 * grunt-vulcanize
 * https://github.com/Polymer/grunt-vulcanize
 *
 * Copyright (c) 2013 The Polymer Authors
 * Licensed under the BSD license.
 */

'use strict';

module.exports = function(grunt) {

  var Vulcanize = require('vulcanize');
  var path = require('path');

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('vulcanize', 'Inline HTML Imports', function() {
    var done = this.async();
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      abspath: '',
      excludes: [
      ],
      stripExcludes: [
      ],
      targetUrl: '',
      inlineScripts: false,
      inlineCss: false,
      implicitStrip: true,
      stripComments: false,
      csp: ''
    });

    var filesCount = this.files ? this.files.length : 0;

    if (filesCount <= 0) {
      done();
      return;
    }

    // Iterate over all specified file groups.
    this.files.forEach(function(f) {
      // Concat specified files.
      var src = f.src.filter(function(filepath) {
        // Warn on and remove invalid source files (if nonull was set).
        if (!options.abspath && !grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else {
          return true;
        }
      });

      // Handle options.
      var vulcan = new Vulcanize(options);

      vulcan.process(options.targetUrl || src[0], function(err, inlinedHtml) {

        if (err) {
          return grunt.fatal(err);
        }

        if (options.csp) {
          var crisper = require('crisper');

          // Legacy support for String type inputs.
          var cspPath;
          if (typeof options.csp === 'string') {
              cspPath = path.resolve(path.dirname(f.dest), options.csp);
              options.csp = { jsFileName: options.csp };
          }
          else {
              cspPath = path.resolve(path.dirname(f.dest), options.csp.jsFileName);
          }

          // Set Crisper source HTML.
          options.csp.source = inlinedHtml;
          // Set Crisper script import position to end of file.
          if (!options.csp.scriptInHead) {
              options.csp.scriptInHead = false;
          }

          var out = crisper(options.csp);
          inlinedHtml = out.html;
          grunt.file.write(cspPath, out.js);
          grunt.log.ok(src[0] + " -> " + cspPath);
        }

        grunt.file.write(f.dest, inlinedHtml);

        grunt.log.ok(src[0] + " -> " + f.dest);

        filesCount--;

        if (filesCount <= 0) {
          done();
        }
      });

    });
  });

};
