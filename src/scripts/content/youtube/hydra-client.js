"use strict";

// hydra-client.js
// Copyright (C) 2019 Gab AI, Inc.
// All Rights Reserved
var hydra = window.hydra = window.hydra || {};

(function () {
  'use strict';

  var HydraClient =
  /*#__PURE__*/
  function () {
    function HydraClient(user) {
      var self = this;
      self.user = user;
      self.processes = [];
      self.animationCallback = self.onAnimationFrame.bind(self);
      window.requestAnimationFrame(self.animationCallback);
    }

    var _proto = HydraClient.prototype;

    _proto.addProcess = function addProcess(process) {
      var self = this;
      self.processes.push(process);
    };

    _proto.onAnimationFrame = function onAnimationFrame() {
      var self = this;
      self.processes.forEach(function (process) {
        process.update();
      });
      window.requestAnimationFrame(self.animationCallback);
    };

    _proto.hashText = function hashText(text) {
      var hash = 0,
          i,
          chr;

      if (text.length === 0) {
        return hash;
      }

      for (i = 0; i < text.length; i++) {
        chr = text.charCodeAt(i);
        hash = (hash << 5) - hash + chr; // jshint ignore:line

        hash |= 0; // jshint ignore:line
      }

      hash = hash.toString(16);

      if (hash[0] === '-') {
        hash = hash.slice(1);
      }

      return hash;
    };

    _proto.connect = function connect() {
      var self = this;
      self.notifications = [];
      self.isAuthenticated = false;
      self.socket = io('https://dissenter.com/', {
        transports: ['websocket']
      });
      self.socket.on('authenticated', self.onSocketAuthenticated.bind(self));
      self.socket.on('autherror', self.onSocketAuthError.bind(self));
      self.socket.on('notification', self.onNotification.bind(self));
      self.socket.on('join-result', self.onJoinResult.bind(self));
      self.socket.on('chat', self.onChatMessage.bind(self));
      fetch('https://dissenter.com/user/connect-io').then(function (response) {
        return response.text();
      }).then(function (body) {
        self.socket.emit('authenticate', JSON.parse(body));
      });
    };

    _proto.onSocketAuthenticated = function onSocketAuthenticated(message) {
      var self = this; // console.log('onSocketAuthenticated', message);

      self.joinChannel(message.user._id, 'user');
      self.isAuthenticated = true;
      var event = new Event('hydra-socket-authenticated');
      event.data = message.user;
      window.dispatchEvent(event);
      self.updateNotificationCount();
    };

    _proto.onSocketAuthError = function onSocketAuthError(message) {
      console.log('socket authentication error', message);
    };

    _proto.joinChannel = function joinChannel(channelId, channelType) {
      if (channelType === void 0) {
        channelType = 'chat';
      }

      var self = this; // console.log('joining channel', channelId);

      self.socket.emit('join', {
        channelType: channelType,
        channelId: channelId
      });
    };

    _proto.onJoinResult = function onJoinResult(message) {
      var self = this; // console.log('onJoinResult', message);

      if (message.room) {
        self.currentChatRoom = message.room;
      }
    };

    _proto.leaveChannel = function leaveChannel(channelId) {
      var self = this;
      self.socket.emit('leave', {
        channelId: channelId
      });
      self.currentChatRoom = null;
    };

    _proto.onNotification = function onNotification(message) {
      var self = this; // console.log('notification', message);

      self.notifications.push(message); //self.updateNotificationDisplay();
    };

    _proto.initChatClient = function initChatClient() {
      var e = document.getElementById('chat-message-container');
      e.scrollTop = e.scrollHeight;
    };

    _proto.createChatRoomInvite = function createChatRoomInvite(event, roomId) {
      event.preventDefault();
      var username = window.prompt('Enter username to invite to room');

      if (!username) {
        // console.log('chat room invite aborted');
        return true;
      } // console.log('username', roomId, username);


      var url = "/chat/" + roomId + "/invite";
      var resource = new hydra.HydraResource();
      resource.post(url, {
        username: username
      }).catch(function (error) {
        console.log('failed to create chat room invite', error);
        window.alert(error.response.message);
      });
      return true;
    };

    _proto.onChatInputChange = function onChatInputChange(event) {
      var status = document.querySelector('#chat-input-status');
      status.innerHTML = event.target.value.length + " of 1000";
    };

    _proto.postChatMessage = function postChatMessage(event) {
      event.preventDefault();
      var self = this;
      var roomId = event.target.getAttribute('data-room-id');
      var resource = new hydra.HydraResource();
      var input = document.getElementById('chat-text-input');
      var inputStatus = document.getElementById('chat-input-status');
      var body = input.value;

      if (body === '' || body.length < 2) {
        window.alert('Chat text cannot be empty or very short.');
        input.value = '';
        inputStatus.innerHTML = '0 of 1000';
        return true;
      }

      if (body === self.lastChatContent) {
        window.alert('You already sent that message');
        input.value = '';
        inputStatus.innerHTML = '0 of 1000';
        return true;
      }

      self.lastChatContent = body;
      resource.post("/chat/" + roomId, {
        body: body
      }).then(function () {
        input.value = '';
        inputStatus.innerHTML = '0 of 1000';
      }).catch(function (error) {
        console.log('postChatMessage error', error);
      });
      return true;
    };

    _proto.onChatMessage = function onChatMessage(message) {
      var self = this; // console.log('onChatMessage', message);

      switch (message.event) {
        case 'user-join':
          return self.onChatRoomUserJoinMessage(message);

        case 'room-message':
          return self.onChatRoomMessage(message);
      }
    };

    _proto.onChatRoomUserJoinMessage = function onChatRoomUserJoinMessage(message) {
      var messages = document.getElementById('chat-message-container');
      var messageContainer = document.createElement('div');
      messageContainer.classList.add('chat-message');
      messages.appendChild(messageContainer);
      var flexContainer = document.createElement('div');
      flexContainer.classList.add('d-flex');
      messageContainer.appendChild(flexContainer);
      var profileColumn = document.createElement('div');
      profileColumn.classList.add('mr-2');
      flexContainer.appendChild(profileColumn);
      var profileImage = document.createElement('img');
      profileImage.src = message.user.picture_url;
      profileImage.classList.add('bg-dark');
      profileImage.classList.add('border');
      profileImage.classList.add('border-light');
      profileImage.classList.add('profile-photo');
      profileColumn.appendChild(profileImage);
      var messageColumn = document.createElement('div');
      flexContainer.appendChild(messageColumn);
      var messageMeta = document.createElement('div');
      messageMeta.classList.add('message-meta');
      messageMeta.classList.add('small');
      messageMeta.classList.add('d-flex');
      messageColumn.appendChild(messageMeta);
      var metaTimestamp = document.createElement('div');
      metaTimestamp.classList.add('meta-timestamp');
      metaTimestamp.classList.add('mr-1');
      metaTimestamp.innerHTML = moment().format('hh:mm:ss a');
      messageMeta.appendChild(metaTimestamp);
      var metaUsername = document.createElement('div');
      metaUsername.classList.add('meta-username');
      messageMeta.appendChild(metaUsername);
      var metaUserLink = document.createElement('a');
      metaUserLink.setAttribute('href', "/user/" + message.user.username);
      metaUserLink.innerHTML = message.user.username;
      metaUsername.appendChild(metaUserLink);
      var messageBody = document.createElement('div');
      messageBody.classList.add('message-body');
      messageBody.classList.add('system-message');
      messageBody.innerHTML = 'joined the room';
      messageColumn.appendChild(messageBody);
      messages.scrollTop = messages.scrollHeight;
    };

    _proto.onChatRoomMessage = function onChatRoomMessage(message) {
      var messages = document.getElementById('chat-message-container');
      var messageContainer = document.createElement('div');
      messageContainer.classList.add('chat-message');
      messageContainer.setAttribute('data-message-id', message.message._id);
      messages.appendChild(messageContainer);
      var flexContainer = document.createElement('div');
      flexContainer.classList.add('d-flex');
      messageContainer.appendChild(flexContainer);
      var profileColumn = document.createElement('div');
      profileColumn.classList.add('mr-2');
      flexContainer.appendChild(profileColumn);
      var profileImage = document.createElement('img');
      profileImage.src = message.message.author.picture_url;
      profileImage.classList.add('bg-dark');
      profileImage.classList.add('border');
      profileImage.classList.add('border-light');
      profileImage.classList.add('profile-photo');
      profileColumn.appendChild(profileImage);
      var messageColumn = document.createElement('div');
      flexContainer.appendChild(messageColumn);
      var messageMeta = document.createElement('div');
      messageMeta.classList.add('message-meta');
      messageMeta.classList.add('small');
      messageMeta.classList.add('d-flex');
      messageColumn.appendChild(messageMeta);
      var metaTimestamp = document.createElement('div');
      metaTimestamp.classList.add('meta-timestamp');
      metaTimestamp.classList.add('mr-1');
      metaTimestamp.innerHTML = moment(message.message.created).format('hh:mm:ss a');
      messageMeta.appendChild(metaTimestamp);
      var metaUsername = document.createElement('div');
      metaUsername.classList.add('meta-username');
      messageMeta.appendChild(metaUsername);
      var metaUserLink = document.createElement('a');
      metaUserLink.setAttribute('href', "/user/" + message.message.author.username);
      metaUserLink.innerHTML = message.message.author.username;
      metaUsername.appendChild(metaUserLink);
      var messageBody = document.createElement('div');
      messageBody.classList.add('message-body');
      messageBody.innerHTML = message.message.body;
      messageColumn.appendChild(messageBody);
      messages.scrollTop = messages.scrollHeight;
    };

    _proto.createNotification = function createNotification(notification) {
      var self = this;
      self.notifications.push(notification);
      self.updateNotificationDisplay();
    };

    _proto.updateNotificationDisplay = function updateNotificationDisplay() {
      var self = this;

      if (self.notificationTimeout) {
        return;
      }

      var notification = self.notifications.shift();

      if (!notification) {
        return;
      }

      var notificationLabel = document.querySelector('#hydra-status-bar-label');

      switch (notification.action) {
        case 'reply':
          notificationLabel.innerHTML = '<i class="fas fa-reply"></i>';
          break;

        case 'upvote':
          notificationLabel.innerHTML = '<i class="fas fa-chevron-up"></i>';
          break;

        case 'downvote':
          notificationLabel.innerHTML = '<i class="fas fa-chevron-down"></i>';
          break;

        case 'share':
          notificationLabel.innerHTML = '<i class="fas fa-share"></i>';
          break;
      }

      var notificationContent = document.querySelector('#hydra-status-bar-content');

      switch (notification.action) {
        case 'reply':
          notificationContent.innerHTML = "<a href=\"/user/" + notification.actor.username + "\">" + notification.actor.username + "</a> commented <a href=\"/comment/" + notification.related._id + "\">" + notification.related.body + "</a>";
          break;

        case 'upvote':
          notificationContent.innerHTML = "<a href=\"/user/" + notification.actor.username + "\">" + notification.actor.username + "</a> on <a href=\"/comment/" + notification.subject._id + "\">" + notification.subject.body + "</a>";
          break;

        case 'downvote':
          notificationContent.innerHTML = "<a href=\"/comment/" + notification.subject._id + "\">" + notification.subject.body + "</a>";
          break;
      }
    };

    _proto.showModal = function showModal(options) {
      if (options === void 0) {
        options = {};
      }

      var title = document.querySelector('#hydra-modal .modal-title');
      title.innerHTML = options.title || '';
      var prompt = document.querySelector('#hydra-modal #modal-prompt');
      prompt.innerHTML = options.prompt || '';
      var footer = document.querySelector('#hydra-modal .modal-footer');

      while (footer.firstChild) {
        footer.removeChild(footer.firstChild);
      }

      if (options.buttons && options.buttons.length) {
        footer.classList.remove('d-none');
        options.buttons.forEach(function (button) {
          var buttonElement = document.createElement('button');
          buttonElement.setAttribute('type', 'button');

          if (button.onclick) {
            buttonElement.onclick = button.onclick;
          }

          if (button.label) {
            buttonElement.innerText = button.label;
          }

          buttonElement.classList.add('btn');

          if (button.class) {
            buttonElement.classList.add(button.class);
          }

          footer.appendChild(buttonElement);
        });
      } else {
        footer.classList.add('d-none');
      }

      $('#hydra-modal').modal('show'); // jshint ignore: line
    };

    _proto.showLightbox = function showLightbox(imageUrl) {
      var lightbox = document.querySelector('#hydra-lightbox');
      var lightboxImg = document.querySelector('#hydra-lightbox-image');
      lightbox.classList.remove('d-none');
      lightbox.classList.add('d-flex');
      lightboxImg.src = imageUrl;
    };

    _proto.hideLightbox = function hideLightbox() {
      var lightbox = document.querySelector('#hydra-lightbox');
      lightbox.classList.remove('d-flex');
      lightbox.classList.add('d-none');
    };

    _proto.loadHydraGraph = function loadHydraGraph(url, canvas) {
      var resource = new hydra.HydraResource();
      resource.fetch(url).then(function (response) {
        var ctx = canvas.getContext('2d'); // console.log('HYDRA graph', response);

        return Promise.resolve(new Chart(ctx, response.response.graph));
      }).catch(function (error) {
        console.error('HYDRA graph error', error);
      });
    };

    _proto.updateNotificationCount = function updateNotificationCount() {
      var resource = new hydra.HydraResource();
      resource.fetch('/notification/new-count').then(function (response) {
        if (!response.response.notificationCount) {
          return;
        }

        var notificationCount = document.querySelector('#hydra-notification-count');
        notificationCount.classList.remove('d-none');
        notificationCount.innerHTML = response.response.notificationCount;
      }).catch(function (error) {
        console.log('failed to update notification count', error);
      });
    };

    return HydraClient;
  }();

  hydra.HydraClient = HydraClient;
})();