const { ipcRenderer } = require('electron')

document.getElementById('btn').onclick = () => {
  document.getElementById('btn').disabled = true
  ipcRenderer.send('init')
}
