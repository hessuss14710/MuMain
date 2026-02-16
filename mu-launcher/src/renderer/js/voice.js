class VoiceManager {
  constructor() {
    this.ws = null;
    this.localStream = null;
    this.peers = new Map(); // name -> { pc, audioEl, volume }
    this.characterName = '';
    this.muted = false;
    this.onStateChange = null;
    this.onPeersUpdate = null;
    this.reconnectTimer = null;
    this.voiceUrl = '';
  }

  async connect(voiceUrl, characterName) {
    this.voiceUrl = voiceUrl;
    this.characterName = characterName;

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (err) {
      console.error('[Voice] Microphone access denied:', err.message);
      this._setState('error');
      return;
    }

    this._connectWs();
  }

  _connectWs() {
    if (this.ws && this.ws.readyState <= 1) return;

    this._setState('connecting');
    this.ws = new WebSocket(this.voiceUrl);

    this.ws.onopen = () => {
      this.ws.send(JSON.stringify({ type: 'join', character: this.characterName }));
      this._setState('connected');
    };

    this.ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      switch (msg.type) {
        case 'joined':
          break;
        case 'peers-update':
          this._handlePeersUpdate(msg.peers);
          break;
        case 'signal':
          this._handleSignal(msg.from, msg.data);
          break;
        case 'player-left':
          this._removePeer(msg.character);
          break;
        case 'kicked':
          this.disconnect();
          break;
      }
    };

    this.ws.onclose = () => {
      this._setState('disconnected');
      this._scheduleReconnect();
    };

    this.ws.onerror = () => {
      this._setState('disconnected');
    };
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.characterName) this._connectWs();
    }, 5000);
  }

  _handlePeersUpdate(peers) {
    const currentPeerNames = new Set(peers.map(p => p.name));

    // Remove peers that are no longer nearby
    for (const [name] of this.peers) {
      if (!currentPeerNames.has(name)) {
        this._removePeer(name);
      }
    }

    // Add/update peers
    for (const peer of peers) {
      if (!this.peers.has(peer.name)) {
        this._createPeer(peer.name);
        this._sendOffer(peer.name);
      }
      // Update volume
      const peerData = this.peers.get(peer.name);
      if (peerData && peerData.audioEl) {
        peerData.audioEl.volume = peer.volume;
        peerData.volume = peer.volume;
      }
    }

    if (this.onPeersUpdate) this.onPeersUpdate(peers);
  }

  _createPeer(name) {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    const audioEl = new Audio();
    audioEl.autoplay = true;

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        this._signal(name, { type: 'ice', candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      audioEl.srcObject = e.streams[0];
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        this._removePeer(name);
      }
    };

    // Add local audio track
    if (this.localStream) {
      for (const track of this.localStream.getAudioTracks()) {
        pc.addTrack(track, this.localStream);
      }
    }

    this.peers.set(name, { pc, audioEl, volume: 1.0 });
  }

  async _sendOffer(name) {
    const peer = this.peers.get(name);
    if (!peer) return;

    try {
      const offer = await peer.pc.createOffer();
      await peer.pc.setLocalDescription(offer);
      this._signal(name, { type: 'offer', sdp: offer });
    } catch (err) {
      console.error(`[Voice] Offer error for ${name}:`, err.message);
    }
  }

  async _handleSignal(from, data) {
    let peer = this.peers.get(from);

    if (data.type === 'offer') {
      if (!peer) {
        this._createPeer(from);
        peer = this.peers.get(from);
      }
      try {
        await peer.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await peer.pc.createAnswer();
        await peer.pc.setLocalDescription(answer);
        this._signal(from, { type: 'answer', sdp: answer });
      } catch (err) {
        console.error(`[Voice] Answer error for ${from}:`, err.message);
      }
    } else if (data.type === 'answer') {
      if (peer) {
        try {
          await peer.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        } catch (err) {
          console.error(`[Voice] Remote desc error for ${from}:`, err.message);
        }
      }
    } else if (data.type === 'ice') {
      if (peer) {
        try {
          await peer.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error(`[Voice] ICE error for ${from}:`, err.message);
        }
      }
    }
  }

  _removePeer(name) {
    const peer = this.peers.get(name);
    if (!peer) return;
    peer.pc.close();
    peer.audioEl.srcObject = null;
    this.peers.delete(name);
  }

  _signal(target, data) {
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify({ type: 'signal', target, data }));
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.localStream) {
      for (const track of this.localStream.getAudioTracks()) {
        track.enabled = !this.muted;
      }
    }
    return this.muted;
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    for (const [name] of this.peers) {
      this._removePeer(name);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    this._setState('disconnected');
  }

  _setState(state) {
    if (this.onStateChange) this.onStateChange(state);
  }
}
