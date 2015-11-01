'use strict';

var gutil = require('gulp-util');
var through = require('through2');
var PluginError = gutil.PluginError;
var fs = require('fs');
var path = require('path');
var jstemplate = require('./jstemplate.js');


module.exports = function(options) {
    return through.obj(function(file, enc, cb) {
        var escaper = /\\|\u2028|\u2029/g;
        var escapes = {
            "'": "'",
            '\\': '\\',
            '\r': 'r',
            '\n': 'n',
            '\t': 't',
            '\u2028': 'u2028',
            '\u2029': 'u2029'
        };
        var htmlRegexp = /<!--[\w\W\r\n]*?-->/img;

        var _options = {
            namespace: 'TmplInline',
            processName: function(filename) {
                if (/\.soda$/.test(filename)) {
                    return path.basename(filename, ".soda");
                } else {
                    return path.basename(filename, ".html");
                }
            }
        };

        if (file.isNull()) {
            cb(null, file);
            return;
        }

        if (file.isStream()) {
            cb(new gutil.PluginError('gulp-qunba-tmpl', 'Streaming not supported'));
            return;
        }

        if (file.isBuffer()) {
            var filename = path.basename(file.path).split('.')[0];
            var name = _options.namespace + "_" + path.basename(file.base);
            var content = file.contents.toString('utf8');
            var tmplId = name + '.' + filename;

            content = content.replace(escaper, function(match) {
                return '\\' + escapes[match];
            }).replace(htmlRegexp, ''); //È¥µô×¢ÊÍ

            if (/\.soda$/.test(file.history[0])) {
                content = JSON.stringify(content);
            } else {
                var tmplFunc = jstemplate.compile(tmplId, content);
                content = tmplFunc.toString();
            }

            content = 'var ' + filename + ' = ' + content + ';\n' + tmplId + ' = "' + tmplId + '";\n' + 'Tmpl.addTmpl(' + tmplId + ', ' + filename + ');\n';

            file.contents = new Buffer(content, 'utf8');
        }

        cb(null, file);
    });
}