async function setUserMediaAudioSource(source) {
  const quicTransportServerURL = `quic-transport://localhost:4433/toggle_source`;
  try {
    const transport = new WebTransport(quicTransportServerURL);
    console.log(transport, source);
    // not implemented
    transport.onstatechange = async (e) => {
      console.log(e);
    };
    await transport.ready;
    const encoder = new TextEncoder('utf-8');
    const sender = await transport.createUnidirectionalStream();
    const writer = sender.writable.getWriter();
    const input = encoder.encode(source);
    await writer.write(input);
    await writer.close();
    const reader = transport.incomingUnidirectionalStreams.getReader();
    const result = await reader.read();
    const stream = result.value;
    const { readable } = stream;
    const data = await new Response(readable).text();
    await reader.cancel();
    transport.close();
    return transport.closed
      .then((reason) => {
        // `reason` set to Boolean true is a bug https://bugs.chromium.org/p/chromium/issues/detail?id=1151675
        console.log('Connection closed normally.', { reason });
        return data;
      })
      .catch((e) => {
        console.error(e.message);
        console.trace();
      });
  } catch (e) {
    console.warn(e.message);
    throw e;
  }
}
