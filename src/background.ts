
interface TabState {
  debuggerAttached: boolean;
}

const tabsMap: Record<number, TabState | undefined> = {};

chrome.runtime.onConnect.addListener(port => {
  console.log('Got connection from port: ', port.name);
  const tabId = Number.parseInt(port.name, 10);

  const messageListener = async (message: any, port: chrome.runtime.Port) => {
    console.log(`Got message from port: ${port.name}, tabId: ${tabId}, message: `, message);

    const targets = await chrome.debugger.getTargets();
    const target = targets.find(target => target.tabId === tabId);
    if (!target) {
      console.log('No target found for tabId: ', tabId);
    }

    const sendCommand = () => chrome.debugger.sendCommand(
      { tabId },
      "Emulation.setCPUThrottlingRate",
      { rate: message.cpu },
      () => {
        console.log('Set CPU throttling to: ', message.cpu);
      }
    );

    // DevTools Protocol (?) BUG #1
    // target.attached is pretty much useless, because it returns true when the debugger has not been attached yet,
    // hence sendCommand fails with "target not attached".
    // ***********************************************************************************************************
    // That's why we're using our own version of "attached" here.
    if (/*!target?.attached*/!tabsMap[tabId]?.debuggerAttached) {
      // If debugger not attached, attach it and then send the command
      console.log('Target not attached, attaching debugger');
      chrome.debugger.attach({ tabId }, '1.3', () => {
        console.log(`Attached debugger to tab ${tabId}, sending command`);
        tabsMap[tabId] = { debuggerAttached: true };
        sendCommand();
      });
    } else {
      //Otherwise just send the command
      sendCommand();
    }
  }

  port.onMessage.addListener(messageListener);

  port.onDisconnect.addListener(async (port) => {
    console.log(`Got disconnect from port: ${port.name}, removing listener`);

    port.onMessage.removeListener(messageListener);

    const targets = await chrome.debugger.getTargets();
    const target = targets.find(target => target.tabId === tabId);
    // Same issue with target.attached here, but to be on the safe side we're using it along with our own version
    if (tabsMap[tabId]?.debuggerAttached && target?.attached) {
      console.log(`Debugger is attached, detaching from tab ${tabId}`);
      chrome.debugger.detach({ tabId }, () => {
        tabsMap[tabId]!.debuggerAttached = false;
        console.log('detach callback for tab', tabId);
      })
    }
  });
});

const onDetachListener = (source: chrome.debugger.Debuggee, reason: string) => {
  console.log('debugger detached: ', source, reason);
  // DevTools Protocol (?) BUG #2
  // Happens when you have two tabs with extension open and close one of the DevTools (debugger detaches from both tabs)
  // ***************************************************************************************************************
  // If debugger detached for some reason other than disconnecting the port, set our own version of "attached" to false
  if (source.tabId && tabsMap[source.tabId]?.debuggerAttached) {
    tabsMap[source.tabId]!.debuggerAttached = false;
  }
};

chrome.debugger.onDetach.addListener(onDetachListener);
