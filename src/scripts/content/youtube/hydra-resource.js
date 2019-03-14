"use strict";

// hydra-resource.js
// Copyright (C) 2019 Gab AI, Inc.
// All Rights Reserved
(function () {
  'use strict';

  var hydra = window.hydra = window.hydra || {};

  var HydraResource =
  /*#__PURE__*/
  function () {
    function HydraResource(name, options) {
      this.name = name || 'Resource';
      options = options || {};
      this.options = Object.assign({
        async: true,
        type: 'json'
      }, options);
      this.host = "https://dissenter.com";
    }

    var _proto = HydraResource.prototype;

    _proto.fetch = function fetch(url, params) {
      var resource = this;
      var transaction = {
        params: {
          method: 'GET',
          url: this.host + url,
          params: params
        }
      };
      return new Promise(function (resolve, reject) {
        transaction.request = new XMLHttpRequest();
        transaction.resolve = resolve;
        transaction.reject = reject;
        resource.executeTransaction(transaction);
      });
    };

    _proto.post = function post(url, body, bodyContentType) {
      var transaction = {
        params: {
          method: 'POST',
          url: this.host + url,
          body: body,
          bodyContentType: bodyContentType || 'application/json'
        }
      };
      var promise;

      try {
        promise = new Promise(this.doPost.bind(this, transaction));
      } catch (error) {
        console.error('hydra-resource.post error', error);
        throw error;
      }

      return promise;
    };

    _proto.doPost = function doPost(transaction, resolve, reject) {
      var error;

      if (this.options.type) {
        switch (this.options.type) {
          case 'json':
            transaction.params.body = JSON.stringify(transaction.params.body);
            break;

          case 'html':
            transaction.params.body = JSON.stringify(transaction.params.body);
            break;

          default:
            error = new Error('invalid resource type specified', {
              type: this.options.type
            });
            console.error(error.message, {
              error: error
            });
            throw error;
        }
      }

      transaction.request = new XMLHttpRequest();
      transaction.resolve = resolve;
      transaction.reject = reject;
      this.executeTransaction(transaction);
    };

    _proto.put = function put(url, body, bodyContentType) {
      var transaction = {
        params: {
          method: 'PUT',
          url: this.host + url,
          body: body,
          bodyContentType: bodyContentType || 'application/json'
        }
      };
      var promise;

      try {
        promise = new Promise(this.doPut.bind(this, transaction));
      } catch (error) {
        console.error('dmp-resource.put error', error);
        throw error;
      }

      return promise;
    };

    _proto.doPut = function doPut(transaction, resolve, reject) {
      var error;

      if (this.options.type) {
        switch (this.options.type) {
          case 'json':
            transaction.params.body = JSON.stringify(transaction.params.body);
            break;

          default:
            error = new Error('invalid resource type specified', {
              type: this.options.type
            });
            console.error(error.message, {
              error: error
            });
            throw error;
        }
      }

      transaction.request = new XMLHttpRequest();
      transaction.resolve = resolve;
      transaction.reject = reject;
      this.executeTransaction(transaction);
    };

    _proto.del = function del(url) {
      var transaction = {
        params: {
          method: 'DELETE',
          url: this.host + url
        }
      };
      var promise;

      try {
        promise = new Promise(this.doDelete.bind(this, transaction));
      } catch (error) {
        console.error('hydra-resource.post error', error);
        throw error;
      }

      return promise;
    };

    _proto.doDelete = function doDelete(transaction, resolve, reject) {
      transaction.request = new XMLHttpRequest();
      transaction.resolve = resolve;
      transaction.reject = reject;
      transaction.request.open(transaction.params.method, transaction.params.url, true);

      if (this.options.type) {
        switch (this.options.type) {
          case 'json':
            transaction.params.body = JSON.stringify(transaction.params.body);
            break;

          default:
            console.error('invalid resource type specified:', this.options.type);
            transaction.request.abort();
            delete transaction.request;
            return;
        }
      } else {
        transaction.params.body = JSON.stringify(transaction.params.body);
      }

      this.executeTransaction(transaction);
    };

    _proto.buildTransactionUrl = function buildTransactionUrl(transaction) {
      var url = transaction.params.url;
      var sep = '?';

      if (!transaction.params.params) {
        return url;
      }

      for (var property in transaction.params.params) {
        if (!transaction.params.params.hasOwnProperty(property)) {
          continue;
        }

        url += sep;
        url += property.toString();
        url += '=';

        if (transaction.params.params[property] || transaction.params.params[property] === false) {
          url += transaction.params.params[property].toString();
        }

        sep = '&';
      }

      return url;
    };

    _proto.executeTransaction = function executeTransaction(transaction) {
      var onReadyStateChange = this.onReadyStateChange.bind(this, transaction);
      transaction.request.addEventListener('readystatechange', onReadyStateChange);
      transaction.requestUrl = this.buildTransactionUrl(transaction);
      transaction.request.open(transaction.params.method, transaction.requestUrl, true);

      if (transaction.params.bodyContentType) {
        transaction.request.setRequestHeader('Content-Type', transaction.params.bodyContentType);
      }

      transaction.request.send(transaction.params.body);
    };

    _proto.onReadyStateChange = function onReadyStateChange(transaction) {
      var response;

      if (transaction.request.readyState === XMLHttpRequest.DONE) {
        if (transaction.request.status === 200) {
          if (this.options.type === 'json') {
            response = JSON.parse(transaction.request.response);
          } else {
            response = transaction.request.response;
          }

          transaction.resolve({
            url: transaction.params.url,
            status: transaction.request.status,
            statusText: transaction.request.statusText,
            response: response
          });
        } else {
          // console.error('hydra-resource: onReadyStateChange',
          //   transaction.request.status,
          //   transaction.request.statusText,
          //   transaction.request.response
          // );
          var responseObj;

          try {
            responseObj = JSON.parse(transaction.request.response);
          } catch (error) {
            console.log('response error', {
              error: transaction.request.response
            });
          }

          transaction.reject({
            status: transaction.request.status,
            statusText: transaction.request.statusText,
            response: responseObj
          });
        }
      }
    };

    return HydraResource;
  }();

  hydra.HydraResource = HydraResource;
})();