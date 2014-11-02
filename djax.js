;(function(undefined) {
  'use strict';

  // Declare the ajax function:
  function ajax(opt, fn) {
    if (!ajax.xhr)
      throw new Error(
        'XMLHttpRequest not found. You can specify which XMLHttpRequest ' +
        'you want to use by using `ajax.xhr = myXHR`.'
      );

    // Callbacks:
    var successes = [],
        errors = [],
        beforeSend = [];

    // Check for given callbacks:
    if (typeof opt === 'string') {
      opt = { url: opt };

      if (arguments.length === 2) {
        if (typeof fn === 'function')
          successes.push(fn);
        else if (Array.isArray(fn))
          successes = successes.concat(fn);
      }
    } else if (typeof opt !== 'object' || !opt)
      throw new Error('Wrong arguments');

    if (typeof opt.success === 'function')
      successes.push(opt.success);
    else if (Array.isArray(opt.success))
      successes = successes.concat(opt.success);

    if (typeof opt.error === 'function')
      errors.push(opt.error);
    else if (Array.isArray(opt.error))
      errors = errors.concat(opt.error);

    // Other parameters:
    var key,
        data,
        timer,
        conclude,
        done = false,
        url = opt.url,
        xhr = new ajax.xhr(),
        type = opt.type || 'GET',
        dataType = opt.dataType || 'json',
        contentType = opt.contentType || 'application/x-www-form-urlencoded';

    if (!url || typeof url !== 'string')
      throw new Error('Wrong arguments');

    if (opt.data) {
      if (typeof opt.data === 'string')
        data = opt.data;
      else if (/json/.test(contentType))
        data = JSON.stringify(opt.data);
      else {
        data = [];
        for (key in opt.data)
          data.push(
            encodeURIComponent(key) + '=' + encodeURIComponent(opt.data[key])
          );
        data = data.join('&');
      }

      if (/GET|DELETE/i.test(type)) {
        url += /\?/.test(url) ?
          '&' + data :
          '?' + data;
        data = '';
      }
    }

    xhr.onreadystatechange = function() {
      if (+xhr.readyState === 4) {
        if (timer)
          clearTimeout(timer);

        if (/^2/.test(xhr.status)) {
          data = xhr.responseText;
          if (/json/.test(dataType)) {
            try {
              data = JSON.parse(xhr.responseText);
            } catch (e) {
              conclude = function(successes, errors) {
                errors.forEach(function(fn) {
                  fn(xhr, 'parsererror');
                });
              };
              conclude(null, errors);
              return;
            }
          }


          conclude = function(successes, errors) {
            successes.forEach(function(fn) {
              fn(data, 'ok', xhr);
            });
          };
          conclude(successes);

        } else {
          conclude = function(successes, errors) {
            errors.forEach(function(fn) {
              fn(
                xhr,
                +xhr.status ? 'error' : 'abort',
                xhr.responseText
              );
            });
          };
          conclude(null, errors);
        }
      }
    };

    xhr.open(type, url, true);
    xhr.setRequestHeader('Content-Type', contentType);

    // Check custom headers:
    if (opt.headers)
      for (key in opt.headers)
        xhr.setRequestHeader(key, opt.headers[key]);

    // Check the "beforeSend" callback:
    if (
      typeof opt.beforeSend === 'function' &&
      opt.beforeSend(xhr, opt) === false
    )
      return xhr.abort();

    // Check "timeout":
    if (opt.timeout)
      timer = setTimeout(function() {
        xhr.onreadystatechange = function() {};
        xhr.abort();
        conclude = function(successes, errors) {
          errors.forEach(function(fn) {
            fn(xhr, 'timeout');
          });
        };
        conclude(null, errors);
      }, opt.timeout);

    // Send the AJAX call:
    xhr.send(data);

    // Promise:
    var promise = {
      xhr: xhr,
      done: function(callback) {
        if (typeof callback === 'function')
          successes.push(callback);
        else if (Array.isArray(callback))
          successes = successes.concat(callback);
        else
          throw new Error('Wrong arguments.');

        // If the call has already been received:
        if (done) {
          if (typeof callback === 'function')
            conclude([callback]);
          else if (Array.isArray(callback))
            conclude(callback);
        }

        return this;
      },
      fail: function(callback) {
        if (typeof callback === 'function')
          errors.push(callback);
        else if (Array.isArray(callback))
          errors = errors.concat(callback);
        else
          throw new Error('Wrong arguments.');

        // If the call has already been received:
        if (done) {
          if (typeof callback === 'function')
            conclude(null, [callback]);
          else if (Array.isArray(callback))
            conclude(null, callback);
        }

        return this;
      },
      then: function(success, error) {
        this.done(success);
        this.fail(error);

        // If the call has already been received:
        if (done)
          conclude(
            Array.isArray(success) ?
              success :
              typeof success === 'function' ?
                [success] : null,
            Array.isArray(error) ?
              error :
              typeof error === 'function' ?
                [error] : null
          );

        return this;
      }
    };

    // Kill promise next frame:
    setTimeout(function() {
      for (var k in promise)
        promise[k] = undefined;
    }, 0);

    return promise;
  }

  // Check XMLHttpRequest presence:
  if (typeof XMLHttpRequest !== 'undefined')
    ajax.xhr = XMLHttpRequest;

  // Export the AJAX method:
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports)
      exports = module.exports = ajax;
    exports.ajax = ajax;
  } else if (typeof define === 'function' && define.amd)
    define('djax', [], function() {
      return ajax;
    });
  else
    this.ajax = ajax;
}).call(this);