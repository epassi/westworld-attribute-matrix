'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var fs = require('fs');
var path = require('path');

var PREFIXES = ['', 'grunt-', 'grunt-contrib-'];
var EXTENSIONS = ['.coffee', '.js'];

var jit = {
  pluginsRoot: 'node_modules',
  mappings: {},
  cwd: process.cwd()
};

jit.findUp = function (cwd, iterator) {
  var result = iterator(cwd);
  if (result) {
    return result;
  }
  var parent = path.resolve(cwd, '..');
  return parent !== cwd ? jit.findUp(parent, iterator) : null;
};

jit.findPlugin = function (taskName) {
  var _this = this;

  var pluginName = undefined,
      taskPath = undefined;

  // Static Mappings
  if (this.mappings.hasOwnProperty(taskName)) {
    pluginName = this.mappings[taskName];
    if (pluginName.indexOf('/') >= 0 && pluginName.indexOf('@') !== 0) {
      taskPath = path.resolve(this.cwd, pluginName);
      if (fs.existsSync(taskPath)) {
        return this.loadPlugin(taskName, taskPath, true);
      }
    } else {
      var _ret = function () {
        var dir = path.join(_this.pluginsRoot, pluginName, 'tasks');
        taskPath = _this.findUp(_this.cwd, function (cwd) {
          var findPath = path.join(cwd, dir);
          return fs.existsSync(findPath) ? findPath : null;
        });
        if (taskPath) {
          return {
            v: _this.loadPlugin(pluginName, taskPath)
          };
        }
      }();

      if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
    }
  }

  // Custom Tasks
  if (this.customTasksDir) {
    for (var i = EXTENSIONS.length; i--;) {
      taskPath = path.join(this.customTasksDir, taskName + EXTENSIONS[i]);
      if (fs.existsSync(taskPath)) {
        return this.loadPlugin(taskName, taskPath, true);
      }
    }
  }

  // Auto Mappings
  var dashedName = taskName.replace(/([A-Z])/g, '-$1').replace(/_+/g, '-').toLowerCase();
  taskPath = this.findUp(this.cwd, function (cwd) {
    for (var p = PREFIXES.length; p--;) {
      pluginName = PREFIXES[p] + dashedName;
      var findPath = path.join(cwd, _this.pluginsRoot, pluginName, 'tasks');
      if (fs.existsSync(findPath)) {
        return findPath;
      }
    }
  });
  if (taskPath) {
    return this.loadPlugin(pluginName, taskPath);
  }

  this.grunt.log.writeln(('\njit-grunt: Plugin for the "' + taskName + '" task not found.\nIf you have installed the plugin already, please setting the static mapping.\nSee').yellow, 'https://github.com/shootaroo/jit-grunt#static-mappings\n'.cyan);
};

jit.loadPlugin = function (name, path, isFile) {
  var grunt = this.grunt;
  var _write = grunt.log._write;
  var _nameArgs = grunt.task.current.nameArgs;
  grunt.task.current.nameArgs = 'loading ' + name;
  if (this.hideHeader) {
    grunt.log._write = function () {};
  }
  grunt.log.header('Loading "' + name + '" plugin');
  grunt.log._write = _write;

  if (isFile) {
    var fn = require(path);
    if (typeof fn === 'function') {
      fn.call(grunt, grunt);
    }
  } else {
    grunt.loadTasks(path);
  }
  grunt.task.current.nameArgs = _nameArgs;
};

jit.proxy = function (name) {
  return {
    task: {
      name: name,
      fn: function fn() {
        var thing = jit._taskPlusArgs.call(jit.grunt.task, name);
        if (!thing.task) {
          jit.findPlugin(thing.args[0]);
          thing = jit._taskPlusArgs.call(jit.grunt.task, name);
          if (!thing.task) {
            return new Error('Task "' + name + '" failed.');
          }
        }

        this.nameArgs = thing.nameArgs;
        this.name = thing.task.name;
        this.args = thing.args;
        this.flags = thing.flags;
        return thing.task.fn.apply(this, this.args);
      }
    },
    nameArgs: name,
    args: null,
    flags: null
  };
};

module.exports = function (grunt, mappings) {
  if (!jit.grunt) {
    jit.grunt = grunt;
    jit.hideHeader = !grunt.option('verbose');

    // Override _taskPlusArgs
    jit._taskPlusArgs = grunt.util.task.Task.prototype._taskPlusArgs;
    grunt.util.task.Task.prototype._taskPlusArgs = jit.proxy;
  }

  for (var key in mappings) {
    if (mappings.hasOwnProperty(key)) {
      jit.mappings[key] = mappings[key];
    }
  }

  return jit;
};