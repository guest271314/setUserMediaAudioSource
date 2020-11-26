# setUserMediaAudioSource
Dynamically set audio source for `MediaStreamTrack` from `getUserMedia({audio: true})`

Chromium refuses to list or capture audio output devices at Linux, in brief 

- [Issue 865799: A way for enumerateDevices() to show audiooutput devices with labels when user has no cam or mic](https://bugs.chromium.org/p/chromium/issues/detail?id=865799) 
- [Issue 931749: DOMException: could not start audio source when trying to access audioinput](https://bugs.chromium.org/p/chromium/issues/detail?id=931749)

the relevant specifcations have not fixed or seen fit to address the issue affirmatively either, in brief

- [enumerateDevices() should print correct MediaDeviceInfo #693](https://github.com/w3c/mediacapture-main/issues/693)
- [Either fully support or remove audio capture entirely: "MAY" re audio capture is ambiguous #140](https://github.com/w3c/mediacapture-screen-share/issues/140)
- [Implementers must not refuse to open sources set as default at the machine: "DOMException: Could not start audio source" is not in the specification #708](https://github.com/w3c/mediacapture-main/issues/708)
- [Clarify "audiooutput" does not mean capture of audio output to headphones or speakers #720](https://github.com/w3c/mediacapture-main/issues/720)
- [Rename selectAudioOutput: This specification does not define capture of headphones or speakers #111](https://github.com/w3c/mediacapture-output/issues/111)

On Linux after executing `navigator.mediaDevices.getUserMedia({audio: true})` we utilize `WebTransport` and `pactl` to get the list of `sources` and `source-outputs`, then dynamically set the `source` and `source-outputs` ([[Question] What specific pulseaudio commands are used at Recording tab to set the device being captured?](https://gitlab.freedesktop.org/pulseaudio/pavucontrol/-/issues/91#note_590795))

> `pactl move-source-output` is the command to move capture streams ("source output" means capture stream and "sink input" means playback stream).

Dynamically settings means that the same initial `MediaStreamTrack` source will be changed during the stream, thus we can capture microphone, actual audio output (monitor devices that Chromium refuses to list or capture), or any other devices that we decide to capture, in a single contiguous stream, bypassing the specifications and user-agents altogether.

# Usage

```
$ python3 quic_transport_set_user_media_audio_source_server.py certificate.pem certificate.key
```

```
$ python3 -m http.server 8000
```


```
var track, sources = [], source_outputs = [];

navigator.mediaDevices
  .getUserMedia({ audio: true })
  .then(async (stream) => {
    [track] = stream.getAudioTracks();
    const _sources = await setUserMediaAudioSource(
      'get-audio-sources'
    );
    const _source_outputs = await setUserMediaAudioSource(
      'get-audio-source-outputs'
    );
    return { _sources, _source_outputs };
  })
  .then(async ({ _sources, _source_outputs }) => {
    const __source_outputs = _source_outputs.match(
      /(?<=Source\sOutput\s#)\d+|(?<=Sample\sSpecification:\s).*$|(?<=\s+(media|application)(\.name|\.process\.binary)\s=\s").*(?="$)/gm
    );
    const __sources = _sources.match(
      /(?<=Source\s#)\d+|(?<=(Name|Description):\s+).*$/gm
    );
    do {
      const [
        index,
        sample_specification,
        media_name,
        application_name,
        application_process_binary,
      ] = __source_outputs.splice(0, 5);
      source_outputs.push({
        index,
        sample_specification,
        media_name,
        application_name,
        application_process_binary,
      });
    } while (__source_outputs.length);
    do {
      const [index, name, description] = __sources.splice(0, 3);
      sources.push({ index, name, description });
    } while (__sources.length);

    return setUserMediaAudioSource([
      source_outputs.find(
        ({ application_process_binary }) =>
          application_process_binary === 'chrome'
      ).index,
      sources.find(
        ({ description }) =>
          description === 'Monitor of Built-in Audio Analog Stereo'
      ).index,
    ]);
  })
  .then(console.log)
  .catch(console.error);
  ```
  
thereafter we can select and set any `source` and `source-output` that we decide to, at either Chromium or Firefox without bothering with `navigator.mediaDevices.enumerateDevices()` listing incorrect devices at Chrome or Chromium or calling `navigator.mediaDevices.getUserMedia()` multiple times with multiple `deviceId`s or `groupId`s at all just to change the device and resulting track
  
 ```
  setUserMediaAudioSource(
    [source_outputs.find(({application_process_binary}) => application_process_binary === 'chrome').index, 
     sources.find(({description}) => description === 'Built-in Audio Analog Stereo').index]
 )
  .then(console.log) // 'ok'
  .catch(console.error);
 ```
 
 and set the source to a monitor again, or any other virtual or user-defined device that we want to in the same `MediaStream`
 
  ```
  setUserMediaAudioSource(
    [source_outputs.find(({application_process_binary}) => application_process_binary === 'chrome').index, 
     sources.find(({description}) => description === 'Monitor of Built-in Audio Analog Stereo').index]
 )
  .then(console.log) // 'ok'
  .catch(console.error);
 ```
 
again bypassing the specifications' and implementations inadequacies, omissions, lack of interoperabilty, etc.

I have learned all that I know about Python in the several weeks that I have been experimenting with `QuicTransport` which is now obsolete ([Is QuicTransport obsolete?
](https://groups.google.com/a/chromium.org/g/web-transport-dev/c/PpQokbD6SbA/m/NImdr-9jBwAJ?pli=1)) and `WebTransport` ([webtransport](https://github.com/guest271314/samples-1/tree/gh-pages/webtransport)).

Contributions, improvements, feedback, welcome. 
