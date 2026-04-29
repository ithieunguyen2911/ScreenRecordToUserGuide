import assert from 'node:assert/strict';
import { RecordingService } from '../src/services/RecordingService';

type RecorderHandler = ((event?: Event) => void) | null;

class FakeTrack {
  constructor(public kind: 'audio' | 'video') {}
  stopped = false;
  stop() {
    this.stopped = true;
  }
}

class FakeStream {
  constructor(private tracks: FakeTrack[]) {}
  getTracks() {
    return this.tracks;
  }
  getVideoTracks() {
    return this.tracks.filter(track => track.kind === 'video');
  }
  getAudioTracks() {
    return this.tracks.filter(track => track.kind === 'audio');
  }
}

class FakeMediaRecorder {
  static lastInstance: FakeMediaRecorder | null = null;
  state: RecordingState = 'inactive';
  mimeType: string;
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: RecorderHandler = null;

  constructor(public stream: FakeStream, options: MediaRecorderOptions) {
    this.mimeType = options.mimeType || 'video/webm';
    FakeMediaRecorder.lastInstance = this;
  }

  static isTypeSupported(type: string) {
    return type === 'video/webm;codecs=vp9' || type === 'video/webm';
  }

  start() {
    this.state = 'recording';
  }

  stop() {
    this.ondataavailable?.({ data: new Blob(['recorded video'], { type: this.mimeType }) });
    this.state = 'inactive';
    this.onstop?.();
  }
}

class FakeMediaRecorderWithoutStopEvent extends FakeMediaRecorder {
  stop() {
    this.state = 'inactive';
  }
}

function installBrowserFakes(
  mediaRecorderClass: typeof FakeMediaRecorder,
  displayStream: FakeStream,
  microphoneStream: FakeStream
) {
  (globalThis as any).MediaStream = FakeStream;
  (globalThis as any).MediaRecorder = mediaRecorderClass;
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      mediaDevices: {
        getDisplayMedia: async () => displayStream,
        getUserMedia: async () => microphoneStream,
      },
    },
  });
}

async function testRecordsDisplayAndMicrophoneTracks() {
  const displayTrack = new FakeTrack('video');
  const microphoneTrack = new FakeTrack('audio');
  const displayStream = new FakeStream([displayTrack]);
  const microphoneStream = new FakeStream([microphoneTrack]);
  const preview = { srcObject: null } as HTMLVideoElement;

  installBrowserFakes(FakeMediaRecorder, displayStream, microphoneStream);

  const service = new RecordingService();
  await service.startRecording(
    { quality: 'high', format: 'webm', includeAudio: true, frameRate: 30 },
    preview
  );

  assert.equal(preview.srcObject, displayStream);
  assert.equal(service.isRecording(), true);
  assert.equal(FakeMediaRecorder.lastInstance?.stream.getTracks().length, 2);

  const result = await service.stopRecording();

  assert.equal(result.blob.type, 'video/webm;codecs=vp9');
  assert.equal(result.blob.size > 0, true);
  assert.equal(displayTrack.stopped, true);
  assert.equal(microphoneTrack.stopped, true);
  assert.equal(service.isRecording(), false);
}

async function testStopTurnsOffTracksEvenWhenRecorderDoesNotFireStop() {
  const displayTrack = new FakeTrack('video');
  const microphoneTrack = new FakeTrack('audio');
  const displayStream = new FakeStream([displayTrack]);
  const microphoneStream = new FakeStream([microphoneTrack]);

  installBrowserFakes(FakeMediaRecorderWithoutStopEvent, displayStream, microphoneStream);

  const service = new RecordingService();
  await service.startRecording(
    { quality: 'high', format: 'webm', includeAudio: true, frameRate: 30 },
    null
  );

  const result = await service.stopRecording();

  assert.equal(displayTrack.stopped, true);
  assert.equal(microphoneTrack.stopped, true);
  assert.equal(service.isRecording(), false);
  assert.equal(result.blob.type, 'video/webm;codecs=vp9');
}

await testRecordsDisplayAndMicrophoneTracks();
await testStopTurnsOffTracksEvenWhenRecorderDoesNotFireStop();
console.log('RecordingService tests passed');
