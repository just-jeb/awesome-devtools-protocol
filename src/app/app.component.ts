import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  cpu = 1;
  // Create a connection to the service worker
  backgroundPageConnection = chrome.runtime.connect({
    name: `${chrome.devtools.inspectedWindow.tabId}`
  });

  ngOnInit(): void {
    // chrome.storage.sync.get('cpuRate', ({ cpuRate }) => {
    //   if (cpuRate) {
    //     this.cpu = cpuRate;
    //   }
    // });
  }

  public updateCpu(value: number) {

    console.log('Got CPU rate update: ', value)
    this.backgroundPageConnection.postMessage({ cpu: value, tabId: chrome.devtools.inspectedWindow.tabId });
  }
}
