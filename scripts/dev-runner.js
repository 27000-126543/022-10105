const { spawn } = require('child_process')
const net = require('net')
const path = require('path')

const PORT = 3000
const VITE_URL = `http://localhost:${PORT}`

function waitForPort(port, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const timer = setInterval(() => {
      const socket = new net.Socket()
      socket.once('connect', () => {
        clearInterval(timer)
        socket.destroy()
        resolve()
      })
      socket.once('error', () => {
        socket.destroy()
        if (Date.now() - start > timeout) {
          clearInterval(timer)
          reject(new Error(`Timeout waiting for port ${port}`))
        }
      })
      socket.connect(port, '127.0.0.1')
    }, 500)
  })
}

async function main() {
  process.env.VITE_DEV_SERVER_URL = VITE_URL
  process.env.NODE_ENV = 'development'

  console.log('\n🚀 启动医美导诊系统开发环境...')
  console.log('   → 启动 Vite 开发服务器...')

  const vite = spawn('npx', ['vite', '--host', '--port', String(PORT)], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    shell: true,
    env: process.env,
  })

  vite.on('error', (err) => {
    console.error('Vite 启动失败:', err.message)
    process.exit(1)
  })

  process.on('exit', () => {
    vite.kill()
  })

  try {
    await waitForPort(PORT)
    console.log('\n✅ Vite 服务器已就绪 (' + VITE_URL + ')')
    console.log('   → 启动 Electron 桌面窗口...\n')

    const electron = spawn('npx', ['electron', '.'], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
      shell: true,
      env: process.env,
    })

    electron.on('close', () => {
      console.log('\n🛑 Electron 窗口已关闭，正在退出...')
      vite.kill()
      process.exit(0)
    })

    electron.on('error', (err) => {
      console.error('Electron 启动失败:', err.message)
      console.log('\n💡 提示：您仍然可以通过浏览器访问 ' + VITE_URL + ' 来使用系统\n')
    })
  } catch (err) {
    console.error('❌ 等待 Vite 超时:', err.message)
    console.log('\n💡 但您仍然可以尝试浏览器访问 ' + VITE_URL)
  }
}

main()
