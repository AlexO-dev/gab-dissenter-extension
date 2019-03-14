// gab-dissent.js
// Copyright (C) 2019 Gab AI, Inc.
// All Rights Reserved
'use strict';

(function () {
  var hydra = window.hydra = window.hydra || {};

  var GabDissent =
  /*#__PURE__*/
  function () {
    function GabDissent() {
      var self = this;
      self.draftSaveTimerId = null;

      if (hydra.client && hydra.client.socket) {
        hydra.client.socket.on('notification', self.onNotification.bind(self));
      }
    }

    var _proto = GabDissent.prototype;

    _proto.onNotification = function onNotification(message) {
      var self = this;

      switch (message.subjectType) {
        case 'Comment':
          self.processCommentNotification(message);
          break;
      }
    };

    _proto.validateInceptionUrl = function validateInceptionUrl(event) {
      var url = event.currentTarget[0].value;

      if (url && url.length > 0) {
        return true;
      }

      event.preventDefault();
      window.hydra.client.showModal({
        title: '🤬 Failed to Dissent',
        prompt: '<ol class="my-0"><li>Copy a page address from your browser\'s address bar.</li><li>Paste it here.</li><li>Tap "Dissent This" (the pencil) to begin!</li></ol>',
        buttons: [{
          label: '🤪 Got it',
          class: 'btn-primary',
          onclick: function onclick() {
            window.hydra.client.closeModal();
          }
        }]
      });
      return false;
    };

    _proto.saveDraft = function saveDraft(event) {
      var self = this;
      var parentId = event.currentTarget.getAttribute('data-parent-id');
      var dataId = self.getDraftDataId(event.currentTarget);
      var draft;
      event.preventDefault();

      if (!self.storageSupported()) {
        self.hideDraftDirtyIcon(parentId);
        return;
      }

      if (event.currentTarget.value.length === 0) {
        self.storageRemoveItem(dataId);
        window.clearTimeout(self.draftSaveTimerId);
        self.draftSaveTimerId = null;
        self.hideDraftDirtyIcon(parentId);
        return false;
      }

      if (self.draftSaveTimerId) {
        window.clearTimeout(self.draftSaveTimerId);
        self.draftSaveTimerId = null;
      }

      draft = event.currentTarget.value;
      self.draftSaveTimerId = window.setTimeout(function () {
        self.storageSetItem(dataId, draft);
        self.hideDraftDirtyIcon(parentId);
        self.draftSaveTimerId = null;
      }, 2000);
      self.showDraftDirtyIcon(parentId);
      return false;
    };

    _proto.showDraftDirtyIcon = function showDraftDirtyIcon(parentId) {
      var self = this;
      var saveIcon = self.getComposerSaveIcon(parentId);
      saveIcon.classList.remove('d-none');
    };

    _proto.hideDraftDirtyIcon = function hideDraftDirtyIcon(parentId) {
      var self = this;
      var saveIcon = self.getComposerSaveIcon(parentId);

      if (saveIcon.classList.contains('d-none')) {
        return;
      }

      saveIcon.classList.add('d-none');
    };

    _proto.getDraftDataId = function getDraftDataId(commentInput) {
      var commentId = commentInput.getAttribute('data-parent-id');
      var commentUrl = commentInput.getAttribute('data-url');
      var commentUrlId = hydra.client.hashText(commentUrl);
      return commentId ? "dissenter:draft:" + commentId : "dissenter:draft:" + commentUrlId;
    };

    _proto.restoreDrafts = function restoreDrafts() {
      var self = this;
      var forms = document.querySelectorAll('form.comment-composer');
      forms.forEach(function (form) {
        var commentInput = form.querySelector('textarea[name="body"]');
        var dataId = self.getDraftDataId(commentInput);
        var draft = self.storageGetItem(dataId);

        if (draft) {
          commentInput.value = draft;
        }
      });
    };

    _proto.clearAllDrafts = function clearAllDrafts() {
      var self = this;
      self.storageClear();
      var prompt = document.querySelector('span#prompt-drafts-cleared');
      prompt.classList.remove('d-none');

      if (self.draftClearedTimeoutId) {
        window.clearTimeout(self.draftClearedTimeoutId);
        self.draftClearedTimeoutId = null;
      }

      self.draftClearedTimeoutId = window.setTimeout(function () {
        prompt.classList.add('d-none');
        self.draftClearedTimeoutId = null;
      }, 3000);
    };

    _proto.getComposerSaveIcon = function getComposerSaveIcon(commentId) {
      var saveIcon;

      if (commentId) {
        saveIcon = document.querySelector("[data-comment-id=\"" + commentId + "\"].draft-dirty-icon");
      } else {
        saveIcon = document.querySelector(':not([data-comment-id]).draft-dirty-icon');
      }

      return saveIcon;
    };

    _proto.storageSupported = function storageSupported() {
      return window.localStorage ? true : false;
    };

    _proto.storageSetItem = function storageSetItem(key, value) {
      if (!window.localStorage) {
        return;
      }

      window.localStorage.setItem(key, value);
    };

    _proto.storageGetItem = function storageGetItem(key) {
      if (!window.localStorage) {
        return null;
      }

      return window.localStorage.getItem(key);
    };

    _proto.storageRemoveItem = function storageRemoveItem(key) {
      if (!window.localStorage) {
        return;
      }

      window.localStorage.removeItem(key);
    };

    _proto.storageClear = function storageClear() {
      if (!window.localStorage) {
        return;
      }

      window.localStorage.clear();
    };

    _proto.processCommentNotification = function processCommentNotification(message) {
      var comment = message.subject;
      var footer = document.querySelector("div[data-comment-id=\"" + comment._id + "\"].comment-footer");
      var upvotes = footer.querySelector('.stat-upvotes');
      upvotes.innerHTML = comment.stats.upvoteCount;
      var downvotes = footer.querySelector('.stat-downvotes');
      downvotes.innerHTML = comment.stats.downvoteCount;
      var replies = footer.querySelector('.stat-replies');
      replies.innerHTML = comment.stats.replyCount;
    };

    _proto.enableProtocolHandler = function enableProtocolHandler(event) {
      // jshint ignore:line
      navigator.registerProtocolHandler('web+dissent', 'https://dissenter.com/begin-extension?url=%s', 'Dissenter');
    };

    _proto.revealBlastRecorder = function revealBlastRecorder(event) {
      event.preventDefault();
      var commentId = event.currentTarget.getAttribute('data-comment-id');
      var blastRecorder;

      if (!commentId) {
        blastRecorder = document.querySelector('div:not([data-comment-id]).hydra-blast-recorder-container');
      } else {
        blastRecorder = document.querySelector("div[data-comment-id=\"" + commentId + "\"].hydra-blast-recorder-container");
      }

      if (!blastRecorder) {
        window.alert('No Blast recorder exists.');
        return false;
      }

      blastRecorder.classList.remove('d-none');
      return false;
    };

    _proto.loadComment = function loadComment(event, commentId) {
      event.preventDefault();
      window.location = "/comment/" + commentId;
      return true;
    };

    _proto.loadChatInvite = function loadChatInvite(event, inviteId) {
      event.preventDefault();
      window.location = "/chat/invite/" + inviteId;
      return true;
    };

    _proto.editComment = function editComment(event, commentId) {
      event.preventDefault();
      var body = document.querySelector("div[data-comment-id=\"" + commentId + "\"].comment-body");
      var editor = document.querySelector("form[data-comment-id=\"" + commentId + "\"].comment-editor");
      body.classList.add('d-none');
      editor.classList.remove('d-none');
      editor.querySelector('textarea[id="body"]').focus();
      return true;
    };

    _proto.saveComment = function saveComment(event) {
      event.preventDefault();
      var commentId = event.target.getAttribute('data-comment-id');
      var formData = new FormData(event.target);
      var request = new XMLHttpRequest();

      request.onload = function (event) {
        if (event.target.status !== 200) {
          window.alert(event.target.status + ": " + event.target.statusText);
          return;
        }

        var comment = document.querySelector("div[data-comment-id=\"" + commentId + "\"].comment");
        comment.innerHTML = event.target.response;
        window.setTimeout(function () {
          window.alert('Comment updated successfully');
        }, 0);
      };

      request.open('POST', "/comment/" + commentId);
      request.send(formData);
      return true;
    };

    _proto.closeCommentEditor = function closeCommentEditor(event) {
      event.preventDefault();
      var commentId = event.target.getAttribute('data-comment-id');
      var body = document.querySelector("div[data-comment-id=\"" + commentId + "\"].comment-body");
      var editor = document.querySelector("form[data-comment-id=\"" + commentId + "\"].comment-editor");
      body.classList.remove('d-none');
      editor.classList.add('d-none');
      return true;
    };

    _proto.reportComment = function reportComment(event, commentId) {
      console.log(event, commentId);
    };

    _proto.blockCommentAuthor = function blockCommentAuthor(event, commentId, author) {
      event.preventDefault();
      var resource = new hydra.HydraResource();
      var url = "/user/block";
      resource.post(url, {
        userId: author._id,
        username: author.username
      }).then(function () {
        var comment = document.querySelector("div[data-comment-id=\"" + commentId + "\"].comment-container");
        comment.parentNode.removeChild(comment);
      }).catch(function (error) {
        console.log('block user error', error);
      });
      return true;
    };

    _proto.showEditHistory = function showEditHistory(event, commentId) {
      event.preventDefault();
      var editHistory = document.querySelector("div[data-comment-id=\"" + commentId + "\"].edit-history");
      editHistory.classList.remove('d-none');
      return true;
    };

    _proto.publishComment = function publishComment(event, options) {
      if (options === void 0) {
        options = {};
      }

      var self = this;
      options = Object.assign({}, options);
      var formData = new FormData(event.currentTarget);
      event.preventDefault();
      var commentInput = event.currentTarget.querySelector('textarea[name="body"]');
      var xhr = new XMLHttpRequest();

      xhr.onload = function (response) {
        var error;

        if (response.currentTarget.status !== 200) {
          error = JSON.parse(response.currentTarget.response);
          window.alert(error.message);
          console.log("Error:" + error.message);
          return;
        }

        commentInput.value = '';
        var dataId = self.getDraftDataId(commentInput);
        self.storageRemoveItem(dataId);

        if (options.containerSelector) {
          var commentContainer = document.querySelector(options.containerSelector);
          commentContainer.insertAdjacentHTML('afterbegin', response.currentTarget.response);
        }
      };

      xhr.open('POST', "https://dissenter.com" + '/comment');
      xhr.send(formData);
      return false;
    };

    _proto.getRepliesContainer = function getRepliesContainer(commentId) {
      return document.querySelector("div[data-comment-id=\"" + commentId + "\"].comment-replies");
    };

    _proto.toggleReplies = function toggleReplies(event, commentId, sort) {
      var self = this;
      var replies = self.getRepliesContainer(commentId);

      if (!replies.classList.contains('d-none')) {
        replies.classList.add('d-none');
        event.preventDefault();
        return false;
      }

      replies.classList.remove('d-none');
      sort = sort === undefined || sort === 'undefined' ? 'top' : sort;
      return self.loadReplies(event, commentId, sort);
    };

    _proto.selectCommentsTab = function selectCommentsTab(event, tabName, query) {
      var self = this;
      query = JSON.parse(query);
      query.s = tabName;
      var commentId = event.currentTarget.getAttribute('data-comment-id');

      if (!commentId) {
        return self.loadComments(event, tabName, query);
      }

      return self.loadReplies(event, commentId, tabName);
    };

    _proto.loadComments = function loadComments(event, sort, query) {
      event.preventDefault();
      var pageContent = document.querySelector("div.comment-page-list");
      var resource = new hydra.HydraResource('replies', {
        type: 'html'
      });

      if (!query.since) {
        query.since = moment.utc();
      }

      resource.fetch("/comment", query).then(function (response) {
        pageContent.innerHTML = response.response;

        if (twttr) {
          twttr.widgets.load();
        }
      }).catch(function (error) {
        console.error('failed to load replies', error);
      });
      return true;
    };

    _proto.loadReplies = function loadReplies(event, commentId, sort, since) {
      if (sort === void 0) {
        sort = 'top';
      }

      if (since === void 0) {
        since = '';
      }

      event.preventDefault();
      var replies = document.querySelector("div[data-comment-id=\"" + commentId + "\"].comment-replies");
      var content = replies.querySelector('.comment-replies-content');
      var resource = new hydra.HydraResource('replies', {
        type: 'html'
      });
      since = since === '' ? new Date().toString().slice(0, 33) : since;
      resource.fetch("/comment/" + commentId + "/replies", {
        s: sort,
        since: since.toString()
      }).then(function (response) {
        content.innerHTML = response.response;
      }).catch(function (error) {
        console.error('failed to load replies', error);
      });
      return true;
    };

    _proto.showReplyComposer = function showReplyComposer(event, commentId) {
      var replies = document.querySelector("div[data-comment-id=\"" + commentId + "\"].comment-replies");
      replies.classList.remove('d-none');
      var composer = document.querySelector("form[data-comment-id=\"" + commentId + "\"].comment-composer");
      composer.classList.remove('d-none');
      return this.loadReplies(event, commentId);
    };

    _proto.recordCommentVote = function recordCommentVote(event, commentId, voteType) {
      event.preventDefault();
      var resource = new hydra.HydraResource();
      resource.post("/user-vote", {
        subjectType: 'Comment',
        subject: commentId,
        vote: voteType
      }).catch(function (error) {
        console.error('comment vote error', error);
        window.alert(error.response.message);
      });
    };

    _proto.revealDiscussion = function revealDiscussion(commentId, msUntilReveal) {
      if (msUntilReveal === void 0) {
        msUntilReveal = 0;
      }

      var revealer = document.querySelector("div[data-comment-id=\"" + commentId + "\"].discussion-revealer");

      if (msUntilReveal <= 0) {
        revealer.classList.add('revealed');
        return;
      }

      window.setTimeout(function () {
        revealer.classList.add('revealed');
      }, msUntilReveal);
    };

    _proto.loadCommentVoteGraph = function loadCommentVoteGraph(commentId, canvasElementSelector) {
      var self = this;
      var resource = new hydra.HydraResource();
      resource.fetch("/comment/" + commentId + "/vote-graph").then(function (response) {
        self.renderDissentVoteGraph(commentId, canvasElementSelector, response.response);
      }).catch(function (error) {
        console.error('vote graph error', error);
        window.alert('Comment vote graph error: ' + (error.message || error.statusText));
      });
    };

    _proto.loadCommentReplyGraph = function loadCommentReplyGraph(commentId, canvasElementSelector) {
      var self = this;
      var resource = new hydra.HydraResource();
      resource.fetch("/comment/" + commentId + "/reply-graph").then(function (response) {
        self.renderDissentReplyGraph(commentId, canvasElementSelector, response.response);
      }).catch(function (error) {
        console.error('vote graph error', error);
        window.alert('Comment vote graph error: ' + (error.message || error.statusText));
      });
    };

    _proto.renderDissentVoteGraph = function renderDissentVoteGraph(commentId, canvasElementSelector, graph) {
      var canvas = document.querySelector(canvasElementSelector);
      var ctx = canvas.getContext('2d');
      var upvotes = graph.data.map(function (data) {
        return {
          x: data.timestamp,
          y: data.upvotes
        };
      });
      var downvotes = graph.data.map(function (data) {
        return {
          x: data.timestamp,
          y: data.downvotes
        };
      });
      return new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [{
            label: 'upvotes',
            data: upvotes,
            backgroundColor: 'rgba(92,219,149,0.3)',
            borderColor: 'rgb(92,219,149)',
            pointBackgroundColor: '#00d177',
            pointBorderColor: '#000000'
          }, {
            label: 'downvotes',
            data: downvotes,
            backgroundColor: 'rgba(92,219,149,0.3)',
            borderColor: 'rgb(92,219,149)',
            pointBackgroundColor: '#ff0000',
            pointBorderColor: '#000000'
          }]
        },
        options: {
          legend: {
            display: false,
            labels: {
              fontColor: '#bdbdbd'
            }
          },
          scales: {
            xAxes: [{
              type: 'time',
              gridLines: {
                color: '#bdbdbd'
              },
              ticks: {
                fontColor: '#bdbdbd'
              }
            }],
            yAxes: [{
              gridLines: {
                color: '#bdbdbd'
              },
              ticks: {
                fontColor: '#bdbdbd'
              }
            }]
          }
        }
      });
    };

    _proto.renderDissentReplyGraph = function renderDissentReplyGraph(commentId, canvasElementSelector, graph) {
      var canvas = document.querySelector(canvasElementSelector);
      var ctx = canvas.getContext('2d');
      var replyData = graph.data.map(function (data) {
        return {
          x: data.timestamp,
          y: data.replies
        };
      });
      return new Chart(ctx, {
        type: 'bar',
        data: {
          datasets: [{
            label: 'replies',
            data: replyData,
            backgroundColor: 'rgba(92,219,149,0.3)',
            borderColor: 'rgb(92,219,149)',
            pointBackgroundColor: '#00d177',
            pointBorderColor: '#000000'
          }]
        },
        options: {
          legend: {
            display: false,
            labels: {
              fontColor: '#bdbdbd'
            }
          },
          scales: {
            xAxes: [{
              type: 'time',
              gridLines: {
                color: '#bdbdbd'
              },
              ticks: {
                fontColor: '#bdbdbd'
              }
            }],
            yAxes: [{
              gridLines: {
                color: '#bdbdbd'
              },
              ticks: {
                fontColor: '#bdbdbd'
              }
            }]
          }
        }
      });
    };

    _proto.deleteComment = function deleteComment(event, commentId) {
      event.preventDefault();
      var xhr = new XMLHttpRequest();

      xhr.onload = function (response) {
        if (response.currentTarget.status !== 200) {
          window.alert(response.currentTarget.message);
          return;
        }

        window.hydra.client.showModal({
          title: 'Comment Deleted',
          prompt: 'The comment has been deleted.',
          buttons: [{
            label: 'OK',
            class: 'primary',
            onclick: function onclick() {
              window.hydra.client.closeModal();
              window.location.reload();
            }
          }]
        });
      };

      xhr.open('DELETE', "/comment/" + commentId);
      xhr.send();
      return true;
    };

    _proto.loadNotifications = function loadNotifications(event, since) {
      event.preventDefault();
      var xhr = new XMLHttpRequest();

      xhr.onload = function (response) {
        if (response.target.status !== 200) {
          window.alert(response.target.message);
          return;
        }

        var notificationsList = document.querySelector('ul#hydra-notifications-list');
        notificationsList.insertAdjacentHTML('afterend', response.target.response);
      };

      xhr.open('GET', "/notification?since=" + encodeURIComponent(since));
      xhr.send();
      return true;
    };

    _proto.saveSettings = function saveSettings(event) {
      event.preventDefault();
      var formData = new FormData(event.target);
      var xhr = new XMLHttpRequest();

      xhr.onload = function (response) {
        var message;

        if (response.currentTarget.status !== 200) {
          message = JSON.parse(response.currentTarget.response);
          window.hydra.client.showModal({
            title: 'Settings Update Error',
            prompt: message.message,
            buttons: [{
              label: 'OK',
              class: 'primary',
              onclick: function onclick() {
                window.hydra.client.closeModal();
                window.location.reload();
              }
            }]
          });
          return;
        }

        window.hydra.client.showModal({
          title: 'Settings Updated',
          prompt: 'System settings updated successfully.',
          buttons: [{
            label: 'OK',
            class: 'primary',
            onclick: function onclick() {
              window.hydra.client.closeModal();
              window.location.reload();
            }
          }]
        });
      };

      xhr.open('POST', '/user/settings');
      xhr.send(formData);
      return false;
    };

    return GabDissent;
  }();

  hydra.GabDissent = GabDissent;
})();