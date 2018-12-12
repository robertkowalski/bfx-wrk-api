'use strict'

const { Api } = require('..')
const assert = require('assert')

class ServiceApi extends Api {
  asyncCb (space, ip, cb) {
    setTimeout(() => {
      cb(null, ip)
    }, 200)
  }

  async asyncWithCb (space, ip, cb) {
    setTimeout(() => {
      cb(null, ip)
    }, 200)
  }

  async asyncWithCbThrows (space, ip, cb) {
    try {
      throw new Error('boom')
    } catch (e) {
      return cb(e)
    }
  }

  async asyncWithoutCbNoPrefix (space, ip) {
    function networkRequest () {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve('a')
        }, 200)
      })
    }

    const res = await networkRequest()
    return res
  }

  async prm_asyncWithoutCb (space, ip) {
    function networkRequest () {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve('prm_a')
        }, 200)
      })
    }

    const res = await networkRequest()
    return res
  }

  async prm_asyncWithCbAsserts (space, ip, cb) {
    console.log(cb)
    try {
      cb()
    } catch (e) {
      console.log(e)
      return [ip, e]
    }
  }

  parseDocs (a) {
    return parse(a)
  }

  async prm_asyncWithCbThrows (space, ip, cb) {
    const b = parseDocs()

    return b
  }

  twoCallbacks (space, cb) {
    cb(null, 'a')
    cb(null, 'b')
  }
}

let api
describe('callback handling', () => {
  beforeEach(function () {
    api = new ServiceApi()
    api.caller = { getCtx: () => { return true } }
  })

  it('handles callbacks', (done) => {
    api.handle('test', {
      action: 'asyncCb',
      args: [ 'a' ]
    }, (err, res) => {
      if (err) throw err

      assert.strictEqual(res, 'a')
      done()
    })
  })

  it('callback called twice returns first value', (done) => {
    api.handle('test', {
      action: 'twoCallbacks',
      args: []
    }, (err, res) => {
      if (err) throw err

      assert.strictEqual(res, 'a')
      done()
    })
  })

  it('async/await functions with callbacks', (done) => {
    api.handle('test', {
      action: 'asyncWithCb',
      args: [ 'a' ]
    }, (err, res) => {
      if (err) throw err

      assert.strictEqual(res, 'a')
      done()
    })
  })

  it('async/await functions using cb throws', (done) => {
    api.handle('test', {
      action: 'asyncWithCbThrows',
      args: [ 'a' ]
    }, (err, res) => {
      assert.strictEqual(err.message, 'ERR_API_BASE: boom')
      done()
    })
  })

  it('pure async/await functions cant use callbacks', (done) => {
    api.handle('test', {
      action: 'asyncWithoutCbNoPrefix',
      args: [ 'a' ]
    }, (err, res) => {})

    setTimeout(done, 1000)
  })

  it('pure async/await functions must be prefixed by prm_', (done) => {
    api.handle('test', {
      action: 'prm_asyncWithoutCb',
      args: [ 'a' ]
    }, (err, res) => {
      if (err) throw err

      assert.strictEqual(res, 'prm_a')
      done()
    })
  })

  it('pure async/await functions prefixed by prm_ do not have callback support', (done) => {
    api.handle('test', {
      action: 'prm_asyncWithCbAsserts',
      args: [ 'pineapple' ]
    }, (err, asserts) => {
      if (err) throw err

      const [res, e] = asserts
      assert.strictEqual(res, 'pineapple')
      assert.strictEqual(e.message, 'cb is not a function')
      done()
    })
  })

  it('pure async/await functions prefixed by prm_ throws', (done) => {
    api.handle('test', {
      action: 'prm_asyncWithCbThrows',
      args: [ 'pineapple' ]
    }, (err, asserts) => {
      if (err) throw err

      const [res, e] = asserts
      assert.strictEqual(res, 'pineapple')
      assert.strictEqual(e.message, 'cb is not a function')
      done()
    })
  })
})
