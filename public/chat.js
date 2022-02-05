var socket = io.connect("http://localhost:4000");

var divVideoChatLobby = document.getElementById("video-chat-lobby");
var divVideoChat = document.getElementById("video-chat-room");
var joinButton = document.getElementById("join");
var userVideo = document.getElementById("user-video");
var peerVideo = document.getElementById("peer-video");
var roomInput = document.getElementById("roomName");
var userStream;
var rtcPeerConnection;

var iceServers = {
  iceServers: [
    {
      urls: "stun:stun.services.mozilla.com",
    },
    {
      urls: 'stun:stun.l.google.com:19302'
    }


  ],
};

var isCreator = false;

joinButton.addEventListener("click", function () {
  console.log(roomInput.value);
  if (!roomInput.value) {
    return alert("Please enter a room name");
  }

  socket.emit("join", roomInput.value);
});

socket.on("created", function () {
  isCreator = true;
  navigator.getUserMedia(
    { audio: true, video: { width: 1280, height: 720 } },
    function (stream) {
      userStream = stream;
      divVideoChatLobby.style = "display:none";
      userVideo.srcObject = stream;
      userVideo.onloadedmetadata = function (e) {
        userVideo.play();
      };
      socket.emit("ready", roomInput.value);
    },
    function () {
      alert("Couldn't access user media");
    }
  );
});

socket.on("joined", function () {
  isCreator = false;
  navigator.getUserMedia(
    { audio: true, video: { width: 1280, height: 720 } },
    function (stream) {
      userStream = stream;
      divVideoChatLobby.style = "display:none";
      userVideo.srcObject = stream;
      userVideo.onloadedmetadata = function (e) {
        userVideo.play();
      };
      console.log('ready')
      socket.emit("ready", roomInput.value);
    },
    function () {
      alert("Couldn't access user media");
    }
  );
});

socket.on("full", function () {
  alert("room is full");
});

socket.on("ready", function () {
  if (!isCreator) {
    return;
  }
  rtcPeerConnection = new RTCPeerConnection(iceServers);
  rtcPeerConnection.onicecandidate = onIceCandidate;
  rtcPeerConnection.ontrack = onTrack;
  rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
  rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
  rtcPeerConnection.createOffer(function(offer) {
    rtcPeerConnection.setLocalDescription(offer)
    socket.emit('offer', offer, roomInput.value);
  }, function(error) {
    console.log({error});
  })
});

socket.on("candidate", function (candidate) {
  rtcPeerConnection.addIceCandidate(candidate);
});

socket.on("offer", function (offer) {
  if (isCreator) {
    return;
  }
  rtcPeerConnection = new RTCPeerConnection(iceServers);
  rtcPeerConnection.onicecandidate = onIceCandidate;
  rtcPeerConnection.ontrack = onTrack;
  rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
  rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
  rtcPeerConnection.setRemoteDescription(offer)
  rtcPeerConnection.createAnswer(function(answer) {
    rtcPeerConnection.setLocalDescription(answer);
    socket.emit('answer', answer, roomInput.value);
  }, function(error) {
    console.log({error});
  })
});

socket.on("answer", function (answer) {
  rtcPeerConnection.setRemoteDescription(answer);
});

function onIceCandidate(event) {
  console.log('On ice candidate')
  if (event.candidate) {
    console.log({event})
    socket.emit('candidate', event.candidate, roomInput.value);
  }
}

function onTrack(event) {
  console.log('ontrack');
  peerVideo.srcObject = event.streams[0];
  peerVideo.onloadedmetadata = function (e) {
    peerVideo.play();
  };
}