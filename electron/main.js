const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = process.env.NODE_ENV === 'development' || !!process.env.VITE_DEV_SERVER_URL
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000'

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    title: '医美初诊导诊系统',
    width: 1920,
    height: 1080,
    minWidth: 1280,
    minHeight: 720,
    show: false,
    backgroundColor: '#0f172a',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false,
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  if (isDev) {
    console.log('[Electron] 开发模式：加载', VITE_DEV_SERVER_URL)
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html')
    if (fs.existsSync(indexPath)) {
      console.log('[Electron] 生产模式：加载', indexPath)
      mainWindow.loadFile(indexPath)
    } else {
      console.log('[Electron] ⚠️ 未找到打包文件，请先执行 npm run build')
      console.log('[Electron] 降级尝试加载开发服务器...')
      mainWindow.loadURL(VITE_DEV_SERVER_URL)
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  console.log('\n========================================')
  console.log('  🩺 医美初诊导诊系统 - Electron 已启动')
  console.log('  模式:', isDev ? '开发模式' : '生产模式')
  console.log('  时间:', new Date().toLocaleString('zh-CN'))
  console.log('========================================\n')
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

ipcMain.handle('print-ticket', async (_event, data) => {
  console.log('[IPC] 打印导诊小票:', data)
  return { success: true, message: '打印任务已提交' }
})

ipcMain.handle('export-handover', async (_event, data) => {
  console.log('[IPC] 导出交接清单:', data?.length, '条记录')
  return { success: true, message: '导出成功' }
})

process.on('uncaughtException', (err) => {
  console.error('[Electron 未捕获异常]:', err.message)
})
