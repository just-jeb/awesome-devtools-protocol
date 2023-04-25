
chrome.runtime.onConnect.addListener(port => {
  console.log('Got connection from port: ', port.name);
  const tabId = Number.parseInt(port.name, 10);
  chrome.debugger.attach({ tabId }, '1.3', () => {
    console.log('Attached debugger to tab ', tabId);
  });

  const messageListener = (message: any, port: chrome.runtime.Port) => {
    console.log(`Got message from port: ${port.name}, tabId: ${tabId}, message: `, message);
    chrome.debugger.sendCommand(
      { tabId },
      "Emulation.setCPUThrottlingRate",
      { rate: message.cpu },
      (res) => {
        console.log('Set CPU throttling to: ', res);
      }
    );
  }

  port.onMessage.addListener(messageListener);

  port.onDisconnect.addListener((port) => {
    console.log(`Got disconnect from port: ${port.name}, detaching debugger`);

    port.onMessage.removeListener(messageListener);

    chrome.debugger.detach({ tabId }, () => {
      console.log('Detached debugger from tab ', tabId);
      chrome.debugger.getTargets().then((targets) => {
        console.log('Got targets after detach', targets);
      })
    })
  });

});
